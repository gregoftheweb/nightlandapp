import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  GreatPower,
  Position,
} from "@/config/types";
import { InfoBox } from "./InfoBox";
import { CombatDialog } from "./CombatDialog";
import { getTextContent } from "../modules/utils";
import { getItemTemplate } from "@/config/objects";

const { width, height } = Dimensions.get("window");

const CELL_SIZE = 32;
const VIEWPORT_COLS = Math.floor(width / CELL_SIZE);
const VIEWPORT_ROWS = Math.floor(height / CELL_SIZE);

// Background tile configuration
const BACKGROUND_TILE_SIZE = 320;
const BACKGROUND_SCALE = CELL_SIZE / 32;
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

  // Memoized entity position maps for O(1) lookups (perf: replaces linear scans)
  const monsterPositionMap = useMemo(() => {
    const map = new Map<string, Monster>();
    [...(state.activeMonsters || []), ...(state.level.monsters || [])].forEach((m) => {
      if (m.position && !m.inCombatSlot && m.active !== false) {
        const key = `${m.position.row}-${m.position.col}`;
        map.set(key, m);
      }
    });
    return map;
  }, [state.activeMonsters, state.level.monsters]);

  const greatPowerPositionMap = useMemo(() => {
    const map = new Map<string, GreatPower>();
    (state.level.greatPowers || []).forEach((gp) => {
      if (gp.position && gp.active !== false) {
        const key = `${gp.position.row}-${gp.position.col}`;
        map.set(key, gp);
      }
    });
    return map;
  }, [state.level.greatPowers]);

  const itemPositionMap = useMemo(() => {
    const map = new Map<string, Item>();
    (state.items || []).forEach((item) => {
      if (item.active && item.position) {
        const key = `${item.position.row}-${item.position.col}`;
        map.set(key, item);
      }
    });
    return map;
  }, [state.items]);

  // Fast position finders using maps (perf: O(1) vs O(n))
  const findMonsterAtPosition = useMemo(
    () => (worldRow: number, worldCol: number): Monster | undefined =>
      monsterPositionMap.get(`${worldRow}-${worldCol}`),
    [monsterPositionMap]
  );

  const findGreatPowerAtPosition = useMemo(
    () => (worldRow: number, worldCol: number): GreatPower | undefined =>
      greatPowerPositionMap.get(`${worldRow}-${worldCol}`),
    [greatPowerPositionMap]
  );

  const findItemAtPosition = useMemo(
    () => (worldRow: number, worldCol: number): Item | undefined =>
      itemPositionMap.get(`${worldRow}-${worldCol}`),
    [itemPositionMap]
  );

  // Handle combat start and log updates (dev logs wrapped)
  useEffect(() => {
    if (__DEV__) {
      console.log("Combat effect running");
    }
    if (state.inCombat && !previousInCombat && state.attackSlots.length > 0) {
      const firstMonster = state.attackSlots[0];
      const monsterName = firstMonster.name || firstMonster.shortName || "Monster";
      const combatStartMessage = getTextContent("combatStart", [monsterName]);
      setCombatMessages([combatStartMessage, ...state.combatLog.map((log) => log.message)]);
      setCombatInfoVisible(true);
      if (__DEV__) {
        console.log("Combat started (detected transition), showing CombatDialog with message:", combatStartMessage);
      }
    } else if (state.inCombat && state.combatLog.length > 0) {
      setCombatMessages(state.combatLog.map((log) => log.message));
      setCombatInfoVisible(true);
    } else if (!state.inCombat && previousInCombat) {
      setCombatInfoVisible(false);
      setCombatMessages([]);
      if (__DEV__) {
        console.log("Combat ended (detected transition), hiding CombatDialog");
      }
    }
    setPreviousInCombat(state.inCombat);
  }, [state.inCombat, state.attackSlots, state.combatLog, previousInCombat]);

  // Game over effect (dev logs wrapped; no auto-close comment since updated InfoBox)
  useEffect(() => {
    if (state.gameOver) {
      const deathMessage = state.gameOverMessage || "Your journey ends here. The darkness claims another soul...";
      if (__DEV__) {
        console.log("DEATH DETECTED - Showing InfoBox:", deathMessage);
      }
      setInfoData({ name: "DEATH", description: deathMessage });
      setInfoVisible(true);
      // InfoBox stays open until user closes; index.tsx handles navigation on close
    }
  }, [state.gameOver, state.gameOverMessage]);

  if (!state.level || !state.level.objects) {
    if (__DEV__) {
      console.warn("GameBoard: state.level is undefined or missing objects!");
    }
    return <View style={styles.gridContainer} />;
  }

  // Memoized showInfo (perf: avoids closure recreation; dev log wrapped)
  const showInfo = useCallback((name: string, description: string) => {
    if (__DEV__) {
      console.log("showInfo called:", { name, description, infoVisible });
    }
    setInfoData({ name, description });
    setInfoVisible(true);
  }, [infoVisible]); // Dep on infoVisible to avoid stale closures

  // Memoized handlers (perf: stable refs for child props/optimizations)
  const handlePlayerTap = useCallback(() => {
    if (__DEV__) {
      console.log("handlePlayerTap called, player:", state.player);
    }
    const player = state.player;
    const weaponInfo = player.weapons?.length ? ` | Weapon: ${player.weapons[0].id}` : "";
    showInfo(
      player.name || "Christos",
      `${player.description || "The brave hero of the Last Redoubt."}\n\n Level: ${state.level.name}\n${state.level.description}\n${player.position.row}- ${player.position.col}`
    );
    onPlayerTap?.();
  }, [state.player, state.level, showInfo, onPlayerTap]);

  const handleMonsterTap = useCallback((monster: Monster) => {
    if (__DEV__) {
      console.log("handleMonsterTap called, monster:", monster);
    }
    showInfo(
      monster.name || monster.shortName || "Monster",
      monster.description || `A dangerous creature. HP: ${monster.hp || "Unknown"}`
    );
    onMonsterTap?.(monster);
  }, [showInfo, onMonsterTap]);

  const handleGreatPowerTap = useCallback((greatPower: GreatPower) => {
    if (__DEV__) {
      console.log("handleGreatPowerTap called, greatPower:", greatPower);
    }
    const statusInfo = greatPower.awakened ? "AWAKENED" : "Sleeping";
    showInfo(
      greatPower.name || greatPower.shortName || "Great Power",
      `${greatPower.description || "An ancient entity of immense power."}\n\nStatus: ${statusInfo}\nHP: ${greatPower.hp}/${greatPower.maxHP}\nAC: ${greatPower.ac}\nAttack: ${greatPower.attack}`
    );
    onGreatPowerTap?.(greatPower);
  }, [showInfo, onGreatPowerTap]);

  const handleBuildingTap = useCallback((building: LevelObjectInstance) => {
    if (__DEV__) {
      console.log("handleBuildingTap called, building:", building);
    }
    showInfo(
      building.name || building.shortName || "Building",
      building.description || "An interesting structure in the world."
    );
    onBuildingTap?.(building);
  }, [showInfo, onBuildingTap]);

  const handleItemTap = useCallback((item: Item) => {
    if (__DEV__) {
      console.log("handleItemTap called, item:", item);
    }
    showInfo(
      item.name || item.shortName || "Item",
      item.description || "An object of interest."
    );
    onItemTap?.(item);
  }, [showInfo, onItemTap]);

  // Background style (unchanged, but memoized for consistency)
  const getBackgroundStyle = useMemo(() => () => {
    const scaledTileSize = BACKGROUND_TILE_SIZE * BACKGROUND_SCALE;
    const offsetX = -(cameraOffset.offsetX * CELL_SIZE) % scaledTileSize;
    const offsetY = -(cameraOffset.offsetY * CELL_SIZE) % scaledTileSize;
    return {
      transform: [{ translateX: offsetX }, { translateY: offsetY }],
      width: width + scaledTileSize,
      height: height + scaledTileSize,
    };
  }, [cameraOffset.offsetX, cameraOffset.offsetY]);

  // Memoized grid cells (perf: deps on camera + entities; skips if unchanged)
  const renderGridCells = useMemo(() => {
    const tiles: React.ReactNode[] = [];
    for (let row = 0; row < VIEWPORT_ROWS; row++) {
      for (let col = 0; col < VIEWPORT_COLS; col++) {
        const worldRow = row + cameraOffset.offsetY;
        const worldCol = col + cameraOffset.offsetX;

        const isPlayer = !!state.player?.position && worldRow === state.player.position.row && worldCol === state.player.position.col;
        const monsterAtPosition = findMonsterAtPosition(worldRow, worldCol);
        const greatPowerAtPosition = findGreatPowerAtPosition(worldRow, worldCol);

        tiles.push(
          <View
            key={`cell-${worldRow}-${worldCol}`}
            style={[
              styles.cell,
              {
                left: col * CELL_SIZE,
                top: row * CELL_SIZE,
                borderColor: getCellBorderColor(isPlayer, monsterAtPosition, greatPowerAtPosition, state.inCombat),
                backgroundColor: getCellBackgroundColor(isPlayer, monsterAtPosition, greatPowerAtPosition, state.inCombat),
              },
            ]}
          />
        );
      }
    }
    return tiles;
  }, [cameraOffset.offsetY, cameraOffset.offsetX, state.player?.position, monsterPositionMap, greatPowerPositionMap, state.inCombat]);

  // Memoized entity renders (perf: deps on relevant state slices)
  const renderCombatMonsters = useMemo(() => {
    if (!state.inCombat || !state.attackSlots) return [];
    return state.attackSlots.map((monster: Monster, index) => {
      if (!monster.position || !monster.uiSlot) return null;
      const screenRow = monster.position.row - cameraOffset.offsetY;
      const screenCol = monster.position.col - cameraOffset.offsetX;
      const inView = screenRow >= 0 && screenRow < VIEWPORT_ROWS && screenCol >= 0 && screenCol < VIEWPORT_COLS;
      if (!inView) return null;
      return (
        <TouchableOpacity
          key={`combat-monster-${monster.id}-${index}`}
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
          <Image source={getMonsterImage(monster)} style={styles.character} resizeMode="contain" />
        </TouchableOpacity>
      );
    }).filter((item): item is React.ReactElement => item !== null);
  }, [state.inCombat, state.attackSlots, cameraOffset.offsetY, cameraOffset.offsetX, handleMonsterTap]);

  const renderPlayer = useMemo(() => {
    if (!state.player?.position) return null;
    const screenRow = state.player.position.row - cameraOffset.offsetY;
    const screenCol = state.player.position.col - cameraOffset.offsetX;
    const inView = screenRow >= 0 && screenRow < VIEWPORT_ROWS && screenCol >= 0 && screenCol < VIEWPORT_COLS;
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
        <Image source={require("../assets/images/christos.png")} style={styles.character} resizeMode="contain" />
      </TouchableOpacity>
    );
  }, [state.player?.position, cameraOffset.offsetY, cameraOffset.offsetX, handlePlayerTap]);

  const renderMonsters = useMemo(() => {
    if (!state.activeMonsters) return [];
    return state.activeMonsters.map((monster, index) => {
      if (!monster.position || monster.inCombatSlot) return null;
      const screenRow = monster.position.row - cameraOffset.offsetY;
      const screenCol = monster.position.col - cameraOffset.offsetX;
      const inView = screenRow >= 0 && screenRow < VIEWPORT_ROWS && screenCol >= 0 && screenCol < VIEWPORT_COLS;
      if (!inView) return null;
      return (
        <TouchableOpacity
          key={`monster-${monster.id}-${index}`}
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
          <Image source={getMonsterImage(monster)} style={styles.character} resizeMode="contain" />
        </TouchableOpacity>
      );
    }).filter((item): item is React.ReactElement => item !== null);
  }, [state.activeMonsters, cameraOffset.offsetY, cameraOffset.offsetX, handleMonsterTap]);

  const renderGreatPowers = useMemo(() => {
    if (!state.level.greatPowers) return [];
    return state.level.greatPowers.map((greatPower, index) => {
      if (!greatPower.position || greatPower.active === false) return null;
      const screenRow = greatPower.position.row - cameraOffset.offsetY;
      const screenCol = greatPower.position.col - cameraOffset.offsetX;
      const gpWidth = greatPower.width || 1;
      const gpHeight = greatPower.height || 1;
      const inView = screenRow + gpHeight > 0 && screenRow < VIEWPORT_ROWS && screenCol + gpWidth > 0 && screenCol < VIEWPORT_COLS;
      if (!inView) return null;
      return (
        <TouchableOpacity
          key={`greatpower-${greatPower.id}-${index}`}
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
            style={{ width: "100%", height: "100%", opacity: greatPower.awakened ? 1.0 : 0.7 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    }).filter((item): item is React.ReactElement => item !== null);
  }, [state.level.greatPowers, cameraOffset.offsetY, cameraOffset.offsetX, handleGreatPowerTap]);

  const renderItems = useMemo(() => {
    if (!state.items) return [];
    return state.items.map((item, index) => {
      if (!item.position || !item.active) return null;
      const screenRow = item.position.row - cameraOffset.offsetY;
      const screenCol = item.position.col - cameraOffset.offsetX;
      const inView = screenRow >= 0 && screenRow < VIEWPORT_ROWS && screenCol >= 0 && screenCol < VIEWPORT_COLS;
      if (!inView) return null;
      return (
        <TouchableOpacity
          key={`item-${item.id}-${index}`}
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
            source={getItemImage(item)}
            style={{ width: CELL_SIZE * 0.6, height: CELL_SIZE * 0.6, position: "absolute", left: CELL_SIZE * 0.2, top: CELL_SIZE * 0.2 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    }).filter((item): item is React.ReactElement => item !== null);
  }, [state.items, cameraOffset.offsetY, cameraOffset.offsetX, handleItemTap]);

  const renderBuildings = useMemo(() => {
    return state.level.objects.map((obj: LevelObjectInstance, index) => {
      if (!obj.position || !obj.image) return null;
      const screenRow = obj.position.row - cameraOffset.offsetY;
      const screenCol = obj.position.col - cameraOffset.offsetX;
      const objWidth = obj.size?.width ?? 1;
      const objHeight = obj.size?.height ?? 1;
      const inView = screenRow + objHeight > 0 && screenRow < VIEWPORT_ROWS && screenCol + objWidth > 0 && screenCol < VIEWPORT_COLS;
      if (!inView) return null;
      return (
        <TouchableOpacity
          key={`building-${obj.id}-${index}`}
          onPress={() => handleBuildingTap(obj)}
          activeOpacity={0.8}
          style={{
            position: "absolute",
            left: screenCol * CELL_SIZE,
            top: screenRow * CELL_SIZE,
            width: objWidth * CELL_SIZE,
            height: objHeight * CELL_SIZE,
            zIndex: obj.zIndex || 0,
          }}
        >
          <Image source={obj.image as ImageSourcePropType} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
        </TouchableOpacity>
      );
    }).filter((item): item is React.ReactElement => item !== null);
  }, [state.level.objects, cameraOffset.offsetY, cameraOffset.offsetX, handleBuildingTap]);

  // Memoized grid render (perf: batches entities + z-sort only if needed)
  const renderGrid = useMemo(() => {
    const gridCells = renderGridCells;
    const allEntities = [
      ...renderBuildings,
      ...renderMonsters,
      ...renderGreatPowers,
      ...renderItems,
      ...renderCombatMonsters,
      renderPlayer,
    ].filter((entity): entity is React.ReactElement => entity !== null);

    // Sort by z-index (perf: only if allEntities changed)
    if (allEntities.length > 1) {
      allEntities.sort((a, b) => {
        const getZIndex = (element: React.ReactElement): number => {
          const props = element.props as any;
          const style = props.style;
          if (Array.isArray(style)) {
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
    }

    return [...gridCells, ...allEntities];
  }, [renderGridCells, renderBuildings, renderMonsters, renderGreatPowers, renderItems, renderCombatMonsters, renderPlayer]);

  // Tiled background (unchanged; already memoized well)
  const tiledBackground = useMemo(() => {
    const cols = Math.ceil(width / SCALED_TILE_SIZE) + 2;
    const rows = Math.ceil(height / SCALED_TILE_SIZE) + 2;
    const rawX = (((cameraOffset.offsetX * CELL_SIZE) % SCALED_TILE_SIZE) + SCALED_TILE_SIZE) % SCALED_TILE_SIZE;
    const rawY = (((cameraOffset.offsetY * CELL_SIZE) % SCALED_TILE_SIZE) + SCALED_TILE_SIZE) % SCALED_TILE_SIZE;
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
            style={{ position: "absolute", left, top, width: SCALED_TILE_SIZE, height: SCALED_TILE_SIZE }}
            resizeMode="stretch"
          />
        );
      }
    }
    return tiles;
  }, [cameraOffset.offsetX, cameraOffset.offsetY, width, height, SCALED_TILE_SIZE]);

  return (
    <View style={styles.gridContainer}>
      {/* Tiled Background */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        {tiledBackground}
      </View>

      {/* Game Content */}
      <View style={styles.gameContent}>{renderGrid}</View>

      <InfoBox
        visible={infoVisible}
        name={infoData.name}
        description={infoData.description}
        onClose={() => {
          if (__DEV__) {
            console.log("InfoBox onClose called, setting infoVisible to false");
          }
          setInfoVisible(false);
        }}
      />

      <CombatDialog
        visible={combatInfoVisible}
        messages={combatMessages}
        onClose={() => {
          if (__DEV__) {
            console.log("CombatDialog onClose called");
          }
          setCombatInfoVisible(false);
        }}
      />
    </View>
  );
}

// Utility functions (unchanged, but could memoize if called in loops)
const getCellBackgroundColor = (
  isPlayer: boolean,
  hasMonster: Monster | undefined,
  hasGreatPower: GreatPower | undefined,
  inCombat: boolean
) => {
  if (isPlayer) return "rgba(45, 81, 105, 0.4)";
  if (hasMonster) return "rgba(88, 57, 57, 0.4)";
  return "rgba(17, 17, 17, 0.3)";
};

const getCellBorderColor = (
  isPlayer: boolean,
  hasMonster: Monster | undefined,
  hasGreatPower: GreatPower | undefined,
  inCombat: boolean
) => {
  if (isPlayer) return "rgba(84, 124, 255, 0.7)";
  if (hasMonster) return "rgba(255, 8, 8, 0.6)";
  return "rgba(17, 17, 17, 0.3)";
};

const getMonsterImage = (monster: Monster) => {
  return monster.image || require("../assets/images/abhuman.png");
};

const getGreatPowerImage = (greatPower: GreatPower) => {
  return greatPower.image || require("../assets/images/watcherse.png");
};

const getItemImage = (item: Item) => {
  if (item.image) return item.image;
  const template = getItemTemplate(item.shortName);
  return template?.image || require("../assets/images/potion.png");
};

const styles = StyleSheet.create({
  gridContainer: {
    width,
    height,
    position: "relative",
    overflow: "hidden",
  },
  backgroundContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    width,
    height,
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
    borderColor: "rgba(8, 8, 8, 0.3)",
  },
  character: {
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    position: "absolute",
    left: CELL_SIZE * 0.1,
    top: CELL_SIZE * 0.1,
  },
});

export { VIEWPORT_ROWS, VIEWPORT_COLS, CELL_SIZE };