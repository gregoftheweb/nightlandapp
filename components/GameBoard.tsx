import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ImageSourcePropType,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import {
  Monster,
  LevelObjectInstance,
  Player,
  GameState,
  CombatLogEntry,
  Item,
  GreatPower,
} from "@/config/types";
import { InfoBox } from "./InfoBox";
import { CombatDialog } from "./CombatDialog";
import { getTextContent } from "../modules/utils";
import { getItemTemplate } from "@/config/objects"; // Added import for template lookup

const { width, height } = Dimensions.get("window");

const CELL_SIZE = 32;
const VIEWPORT_COLS = Math.floor(width / CELL_SIZE);
const VIEWPORT_ROWS = Math.floor(height / CELL_SIZE);

// Background tile configuration
const BACKGROUND_TILE_SIZE = 320; // Size of your background tile image
const BACKGROUND_SCALE = CELL_SIZE / 32; // Adjust this to scale the background relative to game cells
const SCALED_TILE_SIZE = BACKGROUND_TILE_SIZE * BACKGROUND_SCALE;

interface GameBoardProps {
  state: GameState;
  cameraOffset: { offsetX: number; offsetY: number };
  onPlayerTap?: () => void;
  onMonsterTap?: (monster: Monster) => void;
  onBuildingTap?: (building: LevelObjectInstance) => void;
  onItemTap?: (item: Item) => void;
  onGreatPowerTap?: (greatPower: GreatPower) => void;
}

export default function GameBoard({
  state,
  cameraOffset,
  onPlayerTap,
  onMonsterTap,
  onBuildingTap,
  onItemTap,
  onGreatPowerTap,
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

  useEffect(() => {
    if (state.gameOver) {
      const deathMessage =
        state.gameOverMessage ||
        "Your journey ends here. The darkness claims another soul...";

      console.log("DEATH DETECTED - Showing InfoBox:", deathMessage);

      setInfoData({
        name: "DEATH",
        description: deathMessage,
      });
      setInfoVisible(true);

      // InfoBox will auto-close after 3 seconds
      // index.tsx will handle navigation after 4 seconds
    }
  }, [state.gameOver, state.gameOverMessage]);

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
      `${
        player.description || "The brave hero of the Last Redoubt."
      }\n\n Level: ${state.level.name}\n${state.level.description}\n
      ${player.position.row}- ${player.position.col}`
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

  const handleGreatPowerTap = (greatPower: GreatPower) => {
    console.log("handleGreatPowerTap called, greatPower:", greatPower);
    const statusInfo = greatPower.awakened ? "AWAKENED" : "Sleeping";
    showInfo(
      greatPower.name || greatPower.shortName || "Great Power",
      `${
        greatPower.description || "An ancient entity of immense power."
      }\n\nStatus: ${statusInfo}\nHP: ${greatPower.hp}/${
        greatPower.maxHP
      }\nAC: ${greatPower.ac}\nAttack: ${greatPower.attack}`
    );
    onGreatPowerTap?.(greatPower);
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

  const findGreatPowerAtPosition = (
    worldRow: number,
    worldCol: number
  ): GreatPower | undefined => {
    return state.level.greatPowers?.find(
      (power: GreatPower) =>
        power.position?.row === worldRow &&
        power.position?.col === worldCol &&
        power.active !== false
    );
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

  // Calculate background offset for seamless scrolling
  const getBackgroundStyle = () => {
    const scaledTileSize = BACKGROUND_TILE_SIZE * BACKGROUND_SCALE;
    const offsetX = -(cameraOffset.offsetX * CELL_SIZE) % scaledTileSize;
    const offsetY = -(cameraOffset.offsetY * CELL_SIZE) % scaledTileSize;

    return {
      transform: [{ translateX: offsetX }, { translateY: offsetY }],
      width: width + scaledTileSize,
      height: height + scaledTileSize,
    };
  };

  // Simplified renderGridCells - only renders background grid cells
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
        const greatPowerAtPosition = findGreatPowerAtPosition(
          worldRow,
          worldCol
        );

        tiles.push(
          <View
            key={`cell-${worldRow}-${worldCol}`}
            style={[
              styles.cell,
              {
                left: col * CELL_SIZE,
                top: row * CELL_SIZE,
                borderColor: getCellBorderColor(
                  isPlayer,
                  monsterAtPosition,
                  greatPowerAtPosition,
                  state.inCombat
                ),
                backgroundColor: getCellBackgroundColor(
                  isPlayer,
                  monsterAtPosition,
                  greatPowerAtPosition,
                  state.inCombat
                ),
              },
            ]}
          />
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
              zIndex: 4,
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

  // Render player as absolute-positioned entity
  const renderPlayer = (): React.ReactNode | null => {
    if (!state.player?.position) return null;

    const screenRow = state.player.position.row - cameraOffset.offsetY;
    const screenCol = state.player.position.col - cameraOffset.offsetX;

    const inView =
      screenRow >= 0 &&
      screenRow < VIEWPORT_ROWS &&
      screenCol >= 0 &&
      screenCol < VIEWPORT_COLS;

    if (!inView) return null;

    return (
      <TouchableOpacity
        key="player"
        onPress={handlePlayerTap}
        style={{
          position: "absolute",
          left: screenCol * CELL_SIZE,
          top: screenRow * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE,
          zIndex: 5,
        }}
        activeOpacity={0.7}
      >
        <Image
          source={require("../assets/images/christos.png")}
          style={styles.character}
          resizeMode="contain"
        />
      </TouchableOpacity>
    );
  };

  // Render monsters as absolute-positioned entities
  const renderMonsters = (): React.ReactNode[] => {
    if (!state.activeMonsters) return [];

    return state.activeMonsters
      .map((monster) => {
        if (!monster.position || monster.inCombatSlot) return null;

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
            key={`monster-${monster.id}`}
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

  // Render great powers as absolute-positioned entities
  // Replace the renderGreatPowers function in GameBoard.tsx
  const renderGreatPowers = (): React.ReactNode[] => {
    if (!state.level.greatPowers) return [];

    return state.level.greatPowers
      .map((greatPower) => {
        if (!greatPower.position || greatPower.active === false) return null;

        const screenRow = greatPower.position.row - cameraOffset.offsetY;
        const screenCol = greatPower.position.col - cameraOffset.offsetX;
        const gpWidth = greatPower.width || 1;
        const gpHeight = greatPower.height || 1;

        // Check if any part of the Great Power is in view
        const inView =
          screenRow + gpHeight > 0 &&
          screenRow < VIEWPORT_ROWS &&
          screenCol + gpWidth > 0 &&
          screenCol < VIEWPORT_COLS;

        if (!inView) return null;

        return (
          <TouchableOpacity
            key={`greatpower-${greatPower.id}`}
            onPress={() => handleGreatPowerTap(greatPower)}
            style={{
              position: "absolute",
              left: screenCol * CELL_SIZE,
              top: screenRow * CELL_SIZE,
              width: gpWidth * CELL_SIZE,
              height: gpHeight * CELL_SIZE,
              zIndex: 2,
            }}
            activeOpacity={0.7}
          >
            <Image
              source={getGreatPowerImage(greatPower)}
              style={{
                width: "100%",
                height: "100%",
                opacity: greatPower.awakened ? 1.0 : 0.7,
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        );
      })
      .filter((item): item is React.ReactElement => item !== null);
  };

  // Render items as absolute-positioned entities
  const renderItems = (): React.ReactNode[] => {
    if (!state.items) return [];

    return state.items
      .map((item) => {
        if (!item.position || !item.active) return null;

        const screenRow = item.position.row - cameraOffset.offsetY;
        const screenCol = item.position.col - cameraOffset.offsetX;

        const inView =
          screenRow >= 0 &&
          screenRow < VIEWPORT_ROWS &&
          screenCol >= 0 &&
          screenCol < VIEWPORT_COLS;

        if (!inView) return null;

        return (
          <TouchableOpacity
            key={`item-${item.id}`}
            onPress={() => handleItemTap(item)}
            style={{
              position: "absolute",
              left: screenCol * CELL_SIZE,
              top: screenRow * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              zIndex: item.zIndex || 1,
            }}
            activeOpacity={0.7}
          >
            <Image
              source={getItemImage(item)} // Updated to pass full item
              style={{
                width: CELL_SIZE * 0.6,
                height: CELL_SIZE * 0.6,
                position: "absolute",
                left: CELL_SIZE * 0.2,
                top: CELL_SIZE * 0.2,
              }}
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

        // console.log(`Building ${obj.shortName} zIndex:`, obj.zIndex);
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
              zIndex: obj.zIndex || 0, // Use the object's zIndex, default to 0
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

    // Collect all entities that need z-index sorting
    const allEntities = [
      ...renderBuildings(),
      ...renderMonsters(),
      ...renderGreatPowers(),
      ...renderItems(),
      ...renderCombatMonsters(),
      renderPlayer(),
    ].filter((entity): entity is React.ReactElement => entity !== null);

    // Sort by z-index (lower values render first/behind)
    allEntities.sort((a, b) => {
      const getZIndex = (element: React.ReactElement): number => {
        const props = element.props as any;
        const style = props.style;

        if (Array.isArray(style)) {
          // Find zIndex in style array
          for (const s of style) {
            if (s && typeof s === "object" && "zIndex" in s) {
              return (s as any).zIndex || 0;
            }
          }
          return 0;
        }
        return style?.zIndex || 0;
      };

      return getZIndex(a) - getZIndex(b);
    });

    return [...gridCells, ...allEntities];
  };

  const tiledBackground = useMemo(() => {
    // number of tiles to cover the screen + 1 buffer row/col each side
    const cols = Math.ceil(width / SCALED_TILE_SIZE) + 2;
    const rows = Math.ceil(height / SCALED_TILE_SIZE) + 2;

    // normalize remainder to [0, SCALED_TILE_SIZE)
    const rawX =
      (((cameraOffset.offsetX * CELL_SIZE) % SCALED_TILE_SIZE) +
        SCALED_TILE_SIZE) %
      SCALED_TILE_SIZE;
    const rawY =
      (((cameraOffset.offsetY * CELL_SIZE) % SCALED_TILE_SIZE) +
        SCALED_TILE_SIZE) %
      SCALED_TILE_SIZE;

    // offset in range [-SCALED_TILE_SIZE+1 .. 0]
    const offsetX = -rawX;
    const offsetY = -rawY;

    const tiles: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = offsetX + c * SCALED_TILE_SIZE;
        const top = offsetY + r * SCALED_TILE_SIZE;

        tiles.push(
          <Image
            key={`bg-${r}-${c}`}
            source={require("../assets/images/dark-blue-bg-320.png")}
            style={{
              position: "absolute",
              left,
              top,
              width: SCALED_TILE_SIZE,
              height: SCALED_TILE_SIZE,
            }}
            resizeMode="stretch" // fill tile exactly
          />
        );
      }
    }
    return tiles;
  }, [
    cameraOffset.offsetX,
    cameraOffset.offsetY,
    width,
    height,
    SCALED_TILE_SIZE,
  ]);

  return (
    <View style={styles.gridContainer}>
      {/* Tiled Background */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {tiledBackground}
      </View>

      {/* Game Content */}
      <View style={styles.gameContent}>{renderGrid()}</View>

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
  hasGreatPower: GreatPower | undefined,
  inCombat: boolean
) => {
  // Make cell backgrounds more transparent to show the tiled background
  if (isPlayer) return "rgba(45, 81, 105, 0.4)";
  if (hasMonster) return "rgba(88, 57, 57, 0.4)";
  return "rgba(17, 17, 17, 0.3)"; // Very transparent for normal cells
};

const getCellBorderColor = (
  isPlayer: boolean,
  hasMonster: Monster | undefined,
  hasGreatPower: GreatPower | undefined,
  inCombat: boolean
) => {
  // Make cell backgrounds more transparent to show the tiled background
  if (isPlayer) return "rgba(84, 124, 255, 0.7)";
  // if (hasGreatPower)
  //   return hasGreatPower.awakened
  //     ? "rgba(102, 68, 68, 0.6)"
  //     : "rgba(255, 8, 8, 0.5)";
  if (hasMonster) return "rgba(255, 8, 8, 0.6)";
  return "rgba(17, 17, 17, 0.3)"; // Very transparent for normal cells
};

const getMonsterImage = (monster: Monster) => {
  return monster.image || require("../assets/images/abhuman.png"); // Fallback if no template lookup
};

const getGreatPowerImage = (greatPower: GreatPower) => {
  return greatPower.image || require("../assets/images/watcherse.png"); // Fallback if no template lookup
};

const getItemImage = (item: Item) => {
  if (item.image) {
    return item.image;
  }
  //backup grab it from template
  const template = getItemTemplate(item.shortName);
  return template?.image || require("../assets/images/potion.png"); // Default fallback
};

const styles = StyleSheet.create({
  gridContainer: {
    width,
    height,
    position: "relative",
    overflow: "hidden", // Prevent background from showing outside bounds
  },
  backgroundTile: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: -1, // Behind everything else
  },
  backgroundContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    width,
    height,
    // no zIndex required because you render it first; pointerEvents ensures touches pass through
  },
  gameContent: {
    width,
    height,
    position: "relative",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: "absolute",
    borderWidth: 0.5,
    borderColor: "rgba(8, 8, 8, 0.3)", // More transparent borders
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
