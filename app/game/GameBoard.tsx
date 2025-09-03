import React, { useState } from "react";
import { View, Image, StyleSheet, Dimensions, ImageSourcePropType, Text, TouchableOpacity } from "react-native";
import { Monster, LevelObjectInstance, Player } from "@/config/types";
import { GameState } from "@/config/types";
import { InfoBox } from "../../components/InfoBox";

const { width, height } = Dimensions.get("window");

const CELL_SIZE = 32;
const VIEWPORT_COLS = Math.floor(width / CELL_SIZE);
const VIEWPORT_ROWS = Math.floor(height / CELL_SIZE);

interface GameBoardProps {
  state: GameState;
  cameraOffset: { offsetX: number; offsetY: number };
}

export default function GameBoard({ state, cameraOffset }: GameBoardProps) {
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoData, setInfoData] = useState({ name: '', description: '' });

  if (!state.level || !state.level.objects) {
    console.warn("GameBoard: state.level is undefined or missing objects!");
    return <View style={styles.gridContainer} />;
  }

  const showInfo = (name: string, description: string) => {
    setInfoData({ name, description });
    setInfoVisible(true);
  };

  const handlePlayerTap = () => {
    const player = state.player;
    const weaponInfo = player.weapons?.length ? ` | Weapon: ${player.weapons[0].id}` : "";
showInfo(
  player.name || "Player",
  `${player.description}\n\nHP: ${player.hp}/${player.maxHP}\nAC: ${player.ac}\nAttack: ${player.attack}${weaponInfo}`
);
  };

  const handleMonsterTap = (monster: Monster) => {
    showInfo(
      monster.name || monster.shortName || "Monster",
      monster.description || `A dangerous creature. HP: ${monster.hp || "Unknown"}`
    );
  };

  const handleBuildingTap = (building: LevelObjectInstance) => {
    showInfo(
      building.name || building.shortName || "Building",
      building.description || "An interesting structure in the world."
    );
  };

  const renderGrid = () => {
    const tiles: React.ReactNode[] = [];

    // --- Render grid cells first ---
    for (let row = 0; row < VIEWPORT_ROWS; row++) {
      for (let col = 0; col < VIEWPORT_COLS; col++) {
        const worldRow = row + cameraOffset.offsetY;
        const worldCol = col + cameraOffset.offsetX;

        const isPlayer =
          worldRow === state.player.position.row &&
          worldCol === state.player.position.col;

     
      // ✅ FIX 1: Check BOTH activeMonsters AND level.monsters
      const monsterAtPosition = 
        state.activeMonsters.find(
          (monster: Monster) =>
            monster.position?.row === worldRow &&
            monster.position?.col === worldCol
        ) || 
        state.level.monsters?.find(
          (monster: any) =>
            monster.position?.row === worldRow &&
            monster.position?.col === worldCol &&
            monster.active !== false
        );


      // ✅ FIX 2: Also check for items from level
      const itemAtPosition = 
        state.items?.find((item: any) => 
          item.active && item.position.row === worldRow && item.position.col === worldCol
        ) || 
        state.level.items?.find((item: any) => 
          item.active && item.position.row === worldRow && item.position.col === worldCol
        );

        tiles.push(
        <View
          key={`cell-${worldRow}-${worldCol}`}
          style={[
            styles.cell,
            {
              left: col * CELL_SIZE,
              top: row * CELL_SIZE,
              backgroundColor: getCellBackgroundColor(isPlayer, monsterAtPosition, state.inCombat),
            },
          ]}
        >
          {/* ✅ FIX 3: Render items first (bottom layer) */}
          {itemAtPosition && (
            <Image
              source={getItemImage(itemAtPosition.shortName)}
              style={[styles.item, { zIndex: 0 }]}
              resizeMode="contain"
            />
          )}

          {/* ✅ FIX 4: Render monsters with proper images */}
          {monsterAtPosition && !isPlayer && (
            <TouchableOpacity 
              onPress={() => handleMonsterTap(monsterAtPosition)}
              style={styles.tappableArea}
              activeOpacity={0.7}
            >
              <Image
                source={getMonsterImage(monsterAtPosition)}
                style={[styles.character, { zIndex: 1 }]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}

          {/* Player on top */}
          {isPlayer && (
            <TouchableOpacity 
              onPress={handlePlayerTap}
              style={styles.tappableArea}
              activeOpacity={0.7}
            >
              <Image
                source={require("../../assets/images/christos.png")}
                style={[styles.character, { zIndex: 2 }]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      );
    }
  }

    // --- Render buildings AFTER grid cells so they appear on top ---
    const buildingsRendered = state.level.objects.map((obj: LevelObjectInstance) => {
      if (!obj.position || !obj.image) return null;

      const screenRow = obj.position.row - cameraOffset.offsetY;
      const screenCol = obj.position.col - cameraOffset.offsetX;
      const objWidth = obj.size?.width ?? 1;
      const objHeight = obj.size?.height ?? 1;

      const inView =
        screenRow + objHeight > 0 &&
        screenRow < VIEWPORT_ROWS &&
        screenCol + objWidth > 0 &&
        screenCol < VIEWPORT_COLS;

      if (!inView) return null;

      console.log(
        `Rendering building ${obj.id} at screen(${screenCol},${screenRow}) px(${screenCol * CELL_SIZE},${screenRow * CELL_SIZE}) size(${objWidth * CELL_SIZE},${objHeight * CELL_SIZE})`
      );

      return (
        <TouchableOpacity
          key={`building-${obj.id}`}
          onPress={() => handleBuildingTap(obj)}
          activeOpacity={0.8}
          style={{
            position: "absolute",
            left: screenCol * CELL_SIZE,
            top: screenRow * CELL_SIZE,
            width: objWidth * CELL_SIZE,
            height: objHeight * CELL_SIZE,
            zIndex: 10, // higher than player or monsters
          }}
        >
          <Image
            source={obj.image as ImageSourcePropType}
            style={{
              width: "100%",
              height: "100%",
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    }).filter((item): item is React.ReactElement => item !== null);

    return [...tiles, ...buildingsRendered]; // grid cells first, buildings on top
  };

  console.log("Camera offset:", cameraOffset);
  console.log("Objects in current level:", state.level.objects);

  return (
    <View style={styles.gridContainer}>
      {renderGrid()}
      
      {/* InfoBox Dialog */}
      <InfoBox
        visible={infoVisible}
        name={infoData.name}
        description={infoData.description}
        onClose={() => setInfoVisible(false)}
      />
    </View>
  );
}

// --- Helpers ---
const getCellBackgroundColor = (isPlayer: boolean, hasMonster: any, inCombat: boolean) => {
  if (isPlayer) return "#444";
  if (hasMonster) return "#622";
  if (inCombat) return "#331";
  return "#111";
};

const getMonsterImage = (monster: any) => {
  // First try to use the image directly from the monster data
  if (monster.image) {
    return monster.image;
  }
  
  // Fallback to shortName mapping
  const monsterImages: { [key: string]: any } = {
    'abhuman': require("../../assets/images/abhuman.png"),
    'night_hound': require("../../assets/images/nighthound4.png"), // Match your levels.ts
    'watcher_se': require("../../assets/images/watcherse.png"),
  };
  
  return monsterImages[monster.shortName] || require("../../assets/images/abhuman.png");
};



// ✅ FIX 6: Add item style and getItemImage function
const getItemImage = (shortName: string) => {
  const itemImages: { [key: string]: any } = {
    'healthPotion': require("../../assets/images/potion.png"),
    'ironSword': require("../../assets/images/shortSword.png"),
  };
  return itemImages[shortName] || require("../../assets/images/potion.png");
};




// --- Styles ---
const styles = StyleSheet.create({
  gridContainer: {
    width,
    height,
    position: "relative",
    backgroundColor: "#111",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: "absolute",
    borderWidth: 0.5,
    borderColor: "#222",
  },
  character: {
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    position: "absolute",
    left: CELL_SIZE * 0.1,
    top: CELL_SIZE * 0.1,
  },
  building: {
    position: "absolute",
  },
  tappableArea: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
    item: {
    width: CELL_SIZE * 0.6,
    height: CELL_SIZE * 0.6,
    position: "absolute",
    left: CELL_SIZE * 0.2,
    top: CELL_SIZE * 0.2,
  },
});

export { VIEWPORT_ROWS, VIEWPORT_COLS, CELL_SIZE };