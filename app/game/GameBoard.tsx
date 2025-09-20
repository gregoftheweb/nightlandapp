import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import {
  Monster,
  LevelObjectInstance,
  Player,
  GameState,
  CombatLogEntry,
  Item,
} from "@/config/types";
import { InfoBox } from "../../components/InfoBox";
import { CombatDialog } from "../../components/CombatDialog";
import { getTextContent } from "../../modules/utils";

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
  onItemTap?: (item: Item) => void;
}

export default function GameBoard({
  state,
  cameraOffset,
  onPlayerTap,
  onMonsterTap,
  onBuildingTap,
  onItemTap,
}: GameBoardProps) {
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoData, setInfoData] = useState({ name: "", description: "" });
  const [combatInfoVisible, setCombatInfoVisible] = useState(false);
  const [combatMessages, setCombatMessages] = useState<string[]>([]);
  const [previousInCombat, setPreviousInCombat] = useState(false);

  // Handle combat start and log updates
  useEffect(() => {
    if (state.inCombat && !previousInCombat && state.attackSlots.length > 0) {
      // When combat starts (transition from false to true)
      const firstMonster = state.attackSlots[0];
      const monsterName =
        firstMonster.name || firstMonster.shortName || "Monster";
      const combatStartMessage = getTextContent("combatStart", [monsterName]);
      setCombatMessages([
        combatStartMessage,
        ...state.combatLog.map((log) => log.message),
      ]);
      setCombatInfoVisible(true);
      console.log(
        "Combat started (detected transition), showing CombatDialog with message:",
        combatStartMessage
      );
    } else if (state.inCombat && state.combatLog.length > 0) {
      // Update messages during combat
      setCombatMessages(state.combatLog.map((log) => log.message));
      setCombatInfoVisible(true);
    } else if (!state.inCombat && previousInCombat) {
      // When combat ends (transition from true to false)
      setCombatInfoVisible(false);
      setCombatMessages([]);
      console.log("Combat ended (detected transition), hiding CombatDialog");
    }

    // Update previous state
    setPreviousInCombat(state.inCombat);
  }, [state.inCombat, state.attackSlots, state.combatLog, previousInCombat]);

  if (!state.level || !state.level.objects) {
    console.warn("GameBoard: state.level is undefined or missing objects!");
    return <View style={styles.gridContainer} />;
  }

  const showInfo = (name: string, description: string) => {
    console.log("showInfo called:", { name, description, infoVisible });
    setInfoData({ name, description });
    setInfoVisible(true);
  };

  const handlePlayerTap = () => {
    console.log("handlePlayerTap called, player:", state.player);
    const player = state.player;
    const weaponInfo = player.weapons?.length
      ? ` | Weapon: ${player.weapons[0].id}`
      : "";
    showInfo(
      player.name || "Christos",
      `${player.description || "The brave hero of the Last Redoubt."}\n\nHP: ${
        player.hp
      }/${player.maxHP}\nAC: ${player.ac || 10}\nAttack: ${
        player.attack
      }${weaponInfo}`
    );
    onPlayerTap?.();
  };

  const handleMonsterTap = (monster: Monster) => {
    console.log("handleMonsterTap called, monster:", monster);
    showInfo(
      monster.name || monster.shortName || "Monster",
      monster.description ||
        `A dangerous creature. HP: ${monster.hp || "Unknown"}`
    );
    onMonsterTap?.(monster);
  };

  const handleBuildingTap = (building: LevelObjectInstance) => {
    console.log("handleBuildingTap called, building:", building);
    showInfo(
      building.name || building.shortName || "Building",
      building.description || "An interesting structure in the world."
    );
    onBuildingTap?.(building);
  };

  const handleItemTap = (item: Item) => {
    console.log("handleItemTap called, item:", item);
    showInfo(
      item.name || item.shortName || "Item",
      item.description || "An object of interest."
    );
    onItemTap?.(item);
  };

  const findMonsterAtPosition = (
    worldRow: number,
    worldCol: number
  ): Monster | undefined => {
    const monster =
      state.activeMonsters.find(
        (monster: Monster) =>
          monster.position?.row === worldRow &&
          monster.position?.col === worldCol &&
          !monster.inCombatSlot
      ) ||
      state.level.monsters?.find(
        (monster: Monster) =>
          monster.position?.row === worldRow &&
          monster.position?.col === worldCol &&
          monster.active !== false &&
          !monster.inCombatSlot
      );
    return monster;
  };

  const findItemAtPosition = (
    worldRow: number,
    worldCol: number
  ): Item | undefined => {
    return state.items?.find(
      (item: Item) =>
        item.active &&
        item.position?.row === worldRow &&
        item.position?.col === worldCol
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
                backgroundColor: getCellBackgroundColor(
                  isPlayer,
                  monsterAtPosition,
                  state.inCombat
                ),
              },
            ]}
          >
            {itemAtPosition && (
              <TouchableOpacity
                onPress={() => handleItemTap(itemAtPosition)}
                style={styles.tappableArea}
                activeOpacity={0.7}
              >
                <Image
                  source={getItemImage(itemAtPosition.shortName)}
                  style={[styles.item, { zIndex: 1 }]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
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

    return state.attackSlots
      .map((monster: Monster) => {
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
      })
      .filter((item): item is React.ReactElement => item !== null);
  };

  const renderBuildings = (): React.ReactNode[] => {
    return state.level.objects
      .map((obj: LevelObjectInstance) => {
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
      })
      .filter((item): item is React.ReactElement => item !== null);
  };

  const renderGrid = () => {
    const gridCells = renderGridCells();
    const buildings = renderBuildings();
    const combatMonsters = renderCombatMonsters();

    return [...gridCells, ...combatMonsters, ...buildings];
  };

  return (
    <View style={styles.gridContainer}>
      {renderGrid()}

      <InfoBox
        visible={infoVisible}
        name={infoData.name}
        description={infoData.description}
        onClose={() => {
          console.log("InfoBox onClose called, setting infoVisible to false");
          setInfoVisible(false);
        }}
      />

      <CombatDialog
        visible={combatInfoVisible}
        messages={combatMessages}
        onClose={() => {
          console.log("CombatDialog onClose called");
          setCombatInfoVisible(false);
        }}
      />
    </View>
  );
}

const getCellBackgroundColor = (
  isPlayer: boolean,
  hasMonster: Monster | undefined,
  inCombat: boolean
) => {
  if (isPlayer) return "#444";
  if (hasMonster) return "#622";
  return "#111";
};

const getMonsterImage = (monster: Monster) => {
  if (monster.image) {
    return monster.image;
  }

  const monsterImages: { [key: string]: any } = {
    abhuman: require("../../assets/images/abhuman.png"),
    night_hound: require("../../assets/images/nighthound4.png"),
    watcher_se: require("../../assets/images/watcherse.png"),
  };

  return (
    monsterImages[monster.shortName] ||
    require("../../assets/images/abhuman.png")
  );
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
});

export { VIEWPORT_ROWS, VIEWPORT_COLS, CELL_SIZE };
