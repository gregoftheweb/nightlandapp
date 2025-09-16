// app/game/GameBoard.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { Monster, LevelObjectInstance, Player, GameState, CombatLogEntry } from "@/config/types";
import { InfoBox } from "../../components/InfoBox";

const { width, height } = Dimensions.get("window");

const CELL_SIZE = 32;
const VIEWPORT_COLS = Math.floor(width / CELL_SIZE);
const VIEWPORT_ROWS = Math.floor(height / CELL_SIZE);

interface GameBoardProps {
  state: GameState;
  cameraOffset: { offsetX: number; offsetY: number };
  onPlayerTap?: () => void;
  onMonsterTap?: (monster: Monster) => void;
  onBuildingTap?: (building: LevelObjectInstance) => void;
}

export default function GameBoard({
  state,
  cameraOffset,
  onPlayerTap,
  onMonsterTap,
  onBuildingTap,
}: GameBoardProps) {
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoData, setInfoData] = useState({ name: "", description: "" });
  const [combatInfoVisible, setCombatInfoVisible] = useState(false);
  const [combatMessage, setCombatMessage] = useState("");

  // Handle combat log updates
  useEffect(() => {
    if (state.inCombat && state.combatLog && state.combatLog.length > 0) {
      const latestLog = state.combatLog[state.combatLog.length - 1];
      setCombatMessage(latestLog.message);
      setCombatInfoVisible(true);
    } else {
      setCombatInfoVisible(false);
    }
  }, [state.combatLog, state.inCombat]);

  if (!state.level || !state.level.objects) {
    console.warn("GameBoard: state.level is undefined or missing objects!");
    return <View style={styles.gridContainer} />;
  }

  const showInfo = (name: string, description: string) => {
    setInfoData({ name, description });
    setInfoVisible(true);
  };

  const handlePlayerTap = () => {
    if (onPlayerTap) {
      onPlayerTap();
    } else {
      const player = state.player;
      const weaponInfo = player.weapons?.length ? ` | Weapon: ${player.weapons[0].id}` : "";
      showInfo(
        player.name || "Player",
        `${player.description}\n\nHP: ${player.hp}/${player.maxHP}\nAC: ${player.ac}\nAttack: ${player.attack}${weaponInfo}`
      );
    }
  };

  const handleMonsterTap = (monster: Monster) => {
    if (onMonsterTap) {
      onMonsterTap(monster);
    } else {
      showInfo(
        monster.name || monster.shortName || "Monster",
        monster.description || `A dangerous creature. HP: ${monster.hp || "Unknown"}`
      );
    }
  };

  const handleBuildingTap = (building: LevelObjectInstance) => {
    if (onBuildingTap) {
      onBuildingTap(building);
    } else {
      showInfo(
        building.name || building.shortName || "Building",
        building.description || "An interesting structure in the world."
      );
    }
  };

  const findMonsterAtPosition = (worldRow: number, worldCol: number): Monster | undefined => {
    return (
      state.activeMonsters.find(
        (monster: Monster) =>
          monster.position?.row === worldRow &&
          monster.position?.col === worldCol &&
          !monster.inCombatSlot
      ) ||
      state.level.monsters?.find(
        (monster: any) =>
          monster.position?.row === worldRow &&
          monster.position?.col === worldCol &&
          monster.active !== false &&
          !monster.inCombatSlot
      )
    );
  };

  const findItemAtPosition = (worldRow: number, worldCol: number): any => {
    return (
      state.items?.find((item: any) => item.active && item.position.row === worldRow && item.position.col === worldCol) ||
      state.level.items?.find((item: any) => item.active && item.position.row === worldRow && item.position.col === worldCol)
    );
  };

  const renderGridCells = (): React.ReactNode[] => {
    const tiles: React.ReactNode[] = [];

    for (let row = 0; row < VIEWPORT_ROWS; row++) {
      for (let col = 0; col < VIEWPORT_COLS; col++) {
        const worldRow = row + cameraOffset.offsetY;
        const worldCol = col + cameraOffset.offsetX;

        const isPlayer =
          !!state.player?.position &&
          worldRow === state.player.position.row &&
          worldCol === state.player.position.col;

        const monsterAtPosition = findMonsterAtPosition(worldRow, worldCol);
        const itemAtPosition = findItemAtPosition(worldRow, worldCol);

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
            {itemAtPosition && (
              <Image
                source={getItemImage(itemAtPosition.shortName)}
                style={[styles.item, { zIndex: 0 }]}
                resizeMode="contain"
              />
            )}
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

    return tiles;
  };

  const renderCombatMonsters = (): React.ReactNode[] => {
    if (!state.inCombat || !state.attackSlots) return [];

    return state.attackSlots.map((monster: Monster) => {
      if (!monster.position || !monster.uiSlot) return null;

      const screenRow = monster.position.row - cameraOffset.offsetY;
      const screenCol = monster.position.col - cameraOffset.offsetX;

      const inView =
        screenRow >= 0 &&
        screenRow < VIEWPORT_ROWS &&
        screenCol >= 0 &&
        screenCol < VIEWPORT_COLS;

      if (!inView) return null;

      return (
        <TouchableOpacity
          key={`combat-monster-${monster.id}`}
          onPress={() => handleMonsterTap(monster)}
          style={{
            position: "absolute",
            left: screenCol * CELL_SIZE,
            top: screenRow * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            zIndex: 3,
          }}
          activeOpacity={0.7}
        >
          <Image
            source={getMonsterImage(monster)}
            style={styles.character}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    }).filter((item): item is React.ReactElement => item !== null);
  };

  const renderBuildings = (): React.ReactNode[] => {
    return state.level.objects.map((obj: LevelObjectInstance) => {
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
            zIndex: 10,
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
  };

  const renderGrid = () => {
    const gridCells = renderGridCells();
    const buildings = renderBuildings();
    const combatMonsters = renderCombatMonsters();

    return [...gridCells, ...combatMonsters, ...buildings];
  };

  return (
    <View style={styles.combatDialog}>
      {renderGrid()}
      <InfoBox
        visible={infoVisible}
        name={infoData.name}        
        description={infoData.description}
        onClose={() => setInfoVisible(false)}
      />
      <InfoBox
        visible={combatInfoVisible}
        name="Combat"
        description={combatMessage}
        onClose={() => setCombatInfoVisible(false)}
      />
    </View>
  );
}

const getCellBackgroundColor = (isPlayer: boolean, hasMonster: any, inCombat: boolean) => {
  if (isPlayer) return "#444";
  if (hasMonster) return "#622";
  return "#111";
};

const getMonsterImage = (monster: any) => {
  if (monster.image) {
    return monster.image;
  }

  const monsterImages: { [key: string]: any } = {
    abhuman: require("../../assets/images/abhuman.png"),
    night_hound: require("../../assets/images/nighthound4.png"),
    watcher_se: require("../../assets/images/watcherse.png"),
  };

  return monsterImages[monster.shortName] || require("../../assets/images/abhuman.png");
};

const getItemImage = (shortName: string) => {
  const itemImages: { [key: string]: any } = {
    healthPotion: require("../../assets/images/potion.png"),
    ironSword: require("../../assets/images/shortSword.png"),
  };
  return itemImages[shortName] || require("../../assets/images/potion.png");
};

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
  combatDialog: {
    position: "absolute",
    top: 25,
    left: 5,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 2,
    borderColor: "#990000",
    padding: 10,
    borderRadius: 8,
    maxWidth: "50%",
  },
});

export { VIEWPORT_ROWS, VIEWPORT_COLS, CELL_SIZE };