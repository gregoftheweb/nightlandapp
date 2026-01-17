import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { PositionDisplay } from "../../components/PositionDisplay";
import { useGameContext } from "../../context/GameContext";
import GameBoard, {
  VIEWPORT_ROWS,
  VIEWPORT_COLS,
  CELL_SIZE,
} from "../../components/GameBoard";
import PlayerHUD from "../../components/PlayerHUD";
import Settings from "../../components/Settings";
import Inventory from "../../components/Inventory";
import { calculateCameraOffset } from "../../modules/utils";
import {
  handleMovePlayer,
  handleCombatAction,
  handlePassTurn,
  initializeStartingMonsters,
} from "../../modules/turnManager";
import {
  Monster,
  LevelObjectInstance,
  Item,
  GreatPower,
  NonCollisionObject,
} from "@/config/types";
import { audioManager } from "../../modules/audioManager";
import {
  UI_CONSTANTS,
  TIMING_CONSTANTS,
  COMBAT_CONSTANTS,
} from "../../constants/Game";
import { findNearestMonster } from "../../modules/monsterUtils";
import { executeRangedAttack, processRangedAttackImpact, checkCombatEnd } from "../../modules/combat";

// Constants
const { width, height } = Dimensions.get("window");

type Direction = "up" | "down" | "left" | "right" | "stay" | null;

export default function Game() {
  const { state, dispatch, setOverlay } = useGameContext();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [targetId, setTargetId] = useState<string | undefined>();
  const router = useRouter();

  // Map to track projectile ID -> target monster ID for impact handling
  const projectileTargets = useRef<Map<string, string>>(new Map());

  // Refs
  const stateRef = useRef(state);
  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentDirection = useRef<Direction>(null);
  const lastZapPressTime = useRef<number>(0);

  // Keep state ref in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Memoized camera offset calculation
  const cameraOffset = useMemo(
    () =>
      calculateCameraOffset(
        state.player.position,
        VIEWPORT_COLS,
        VIEWPORT_ROWS,
        state.gridWidth,
        state.gridHeight
      ),
    [state.player.position, state.gridWidth, state.gridHeight]
  );

  // Audio management
  useFocusEffect(
    useCallback(() => {
      audioManager.playBackgroundMusic();
      return () => audioManager.pauseBackgroundMusic();
    }, [])
  );

  // Game over handling
  useEffect(() => {
    if (!state.gameOver) return;

    if (__DEV__) {
      console.log("Game Over detected");
    }
    audioManager.pauseBackgroundMusic();
  }, [state.gameOver]);

  // Initialize starting monsters
  useEffect(() => {
    if (state.activeMonsters.length === 0 && state.moveCount === 0) {
      if (__DEV__) {
        console.log("Initializing starting monsters");
      }
      initializeStartingMonsters(state, dispatch);
    }
  }, [state.activeMonsters.length, state.moveCount, state, dispatch]);

  // Tap position calculation
  const calculateTapPosition = useCallback(
    (pageX: number, pageY: number) => {
      const gridLeft = (width - VIEWPORT_COLS * CELL_SIZE) / 2;
      const gridTop = (height - VIEWPORT_ROWS * CELL_SIZE) / 2;
      const rawCol = (pageX - gridLeft) / CELL_SIZE + cameraOffset.offsetX;
      const rawRow = (pageY - gridTop) / CELL_SIZE + cameraOffset.offsetY;

      return {
        tapCol: Math.floor(rawCol),
        tapRow: Math.floor(rawRow),
      };
    },
    [cameraOffset.offsetX, cameraOffset.offsetY]
  );

  // Movement direction calculation
  const getMovementDirectionFromTap = useCallback(
    (
      tapRow: number,
      tapCol: number,
      playerRow: number,
      playerCol: number,
      minDistance: number
    ): Direction => {
      const deltaRow = tapRow - playerRow;
      const deltaCol = tapCol - playerCol;
      const absRow = Math.abs(deltaRow);
      const absCol = Math.abs(deltaCol);

      if (absRow < minDistance && absCol < minDistance) return null;

      // Determine primary direction based on larger delta
      if (absRow > absCol) {
        return deltaRow > 0 ? "down" : "up";
      } else if (absCol > absRow) {
        return deltaCol > 0 ? "right" : "left";
      } else {
        // Equal deltas - prioritize vertical movement
        return deltaRow !== 0
          ? deltaRow > 0
            ? "down"
            : "up"
          : deltaCol > 0
          ? "right"
          : "left";
      }
    },
    []
  );

  // Movement execution
  const performMove = useCallback(
    (direction: Direction) => {
      if (!direction || stateRef.current.inCombat) return;
      handleMovePlayer(stateRef.current, dispatch, direction, setOverlay);
    },
    [dispatch, setOverlay]
  );

  // Long press interval management
  const startLongPressInterval = useCallback(
    (direction: Direction) => {
      currentDirection.current = direction;
      if (longPressInterval.current) {
        clearInterval(longPressInterval.current);
      }

      longPressInterval.current = setInterval(() => {
        if (stateRef.current.inCombat || !currentDirection.current) {
          if (longPressInterval.current) {
            clearInterval(longPressInterval.current);
            longPressInterval.current = null;
          }
          return;
        }
        performMove(currentDirection.current);
      }, TIMING_CONSTANTS.MOVEMENT_INTERVAL);
    },
    [performMove]
  );

  const stopLongPressInterval = useCallback(() => {
    if (longPressInterval.current) {
      clearInterval(longPressInterval.current);
      longPressInterval.current = null;
      currentDirection.current = null;
    }
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => stopLongPressInterval();
  }, [stopLongPressInterval]);

  // Check if overlay is blocking interaction
  const isOverlayVisible = useMemo(
    () => settingsVisible || inventoryVisible,
    [settingsVisible, inventoryVisible]
  );

  // Press handlers
  const handlePress = useCallback(
    (event: any) => {
      if (isOverlayVisible) return;

      const { pageX, pageY } = event.nativeEvent;
      if (pageY > height - UI_CONSTANTS.HUD_HEIGHT) return;

      // If in ranged attack mode and player taps ground (not a monster), cancel mode
      if (state.rangedAttackMode) {
        dispatch({ type: "CLEAR_RANGED_MODE" });
        // Then proceed with normal tap behavior
      }

      // Don't allow movement during combat
      if (state.inCombat) return;

      const { tapCol, tapRow } = calculateTapPosition(pageX, pageY);
      const { row: playerRow, col: playerCol } = state.player.position;

      const direction = getMovementDirectionFromTap(
        tapRow,
        tapCol,
        playerRow,
        playerCol,
        UI_CONSTANTS.MIN_MOVE_DISTANCE
      );

      if (direction) performMove(direction);
    },
    [
      state.inCombat,
      state.player.position,
      state.rangedAttackMode,
      isOverlayVisible,
      calculateTapPosition,
      getMovementDirectionFromTap,
      performMove,
      dispatch,
    ]
  );

  const handleLongPress = useCallback(
    (event: any) => {
      if (state.inCombat || isOverlayVisible) return;

      const { pageX, pageY } = event.nativeEvent;
      if (pageY > height - UI_CONSTANTS.HUD_HEIGHT) return;

      const { tapCol, tapRow } = calculateTapPosition(pageX, pageY);
      const { row: playerRow, col: playerCol } = state.player.position;

      const direction = getMovementDirectionFromTap(
        tapRow,
        tapCol,
        playerRow,
        playerCol,
        UI_CONSTANTS.MIN_MOVE_DISTANCE
      );

      if (direction) startLongPressInterval(direction);
    },
    [
      state.inCombat,
      state.player.position,
      isOverlayVisible,
      calculateTapPosition,
      getMovementDirectionFromTap,
      startLongPressInterval,
    ]
  );

  // UI interaction handlers
  const handleGearPress = useCallback(() => {
    if (!state.inCombat) setSettingsVisible(true);
  }, [state.inCombat]);

  const handleCloseSettings = useCallback(() => {
    setSettingsVisible(false);
  }, []);

  const handleInventoryPress = useCallback(() => {
    // Exit ranged attack mode before opening inventory
    if (state.rangedAttackMode) {
      dispatch({ type: "CLEAR_RANGED_MODE" });
    }
    if (!state.inCombat) setInventoryVisible(true);
  }, [state.inCombat, state.rangedAttackMode, dispatch]);

  const handleCloseInventory = useCallback(() => {
    setInventoryVisible(false);
  }, []);

  // Handler for when a projectile animation completes
  const handleProjectileComplete = useCallback(
    (projectileId: string) => {
      // Get the target monster ID for this projectile
      const targetMonsterId = projectileTargets.current.get(projectileId);
      
      if (__DEV__) {
        console.log("🎯 Projectile complete:", projectileId, "target:", targetMonsterId);
      }

      // Remove projectile from state
      dispatch({
        type: "REMOVE_PROJECTILE",
        payload: { id: projectileId },
      });

      // Remove from tracking map
      projectileTargets.current.delete(projectileId);

      // Process the impact if we have a target
      if (targetMonsterId) {
        const targetDied = processRangedAttackImpact(stateRef.current, dispatch, targetMonsterId);

        // Check if combat should end (if in combat and all monsters defeated)
        if (stateRef.current.inCombat) {
          checkCombatEnd(stateRef.current, dispatch);
        }

        // If not in combat AND target didn't die, trigger enemy turn
        if (!stateRef.current.inCombat && !targetDied) {
          handlePassTurn(stateRef.current, dispatch);
        }
      }
    },
    [dispatch]
  );

  const handleZapPress = useCallback(() => {
    // Throttle rapid button presses to prevent overwhelming the system
    const now = Date.now();
    const timeSinceLastPress = now - lastZapPressTime.current;
    const THROTTLE_MS = 300; // Minimum time between presses
    
    if (timeSinceLastPress < THROTTLE_MS) {
      if (__DEV__) {
        console.log("🎯 handleZapPress throttled - too soon since last press:", timeSinceLastPress, "ms");
      }
      return;
    }
    
    lastZapPressTime.current = now;
    
    if (__DEV__) {
      console.log("🎯 handleZapPress - rangedAttackMode:", state.rangedAttackMode, "targetedMonsterId:", state.targetedMonsterId, "inCombat:", state.inCombat);
    }
    
    // Hard-stop: Don't allow ranged attack mode when in melee combat
    if (state.inCombat) {
      if (__DEV__) {
        console.log("🎯 Cannot use ranged attack in melee combat");
      }
      dispatch({
        type: "ADD_COMBAT_LOG",
        payload: { message: "Cannot use ranged attacks in melee combat!" },
      });
      return;
    }
    
    // If ranged attack mode is OFF, turn it ON and target nearest enemy
    if (!state.rangedAttackMode) {
      // Get all living monsters (both active and in attack slots)
      const allMonsters = [...state.activeMonsters, ...state.attackSlots];
      const nearestMonster = findNearestMonster(state.player.position, allMonsters);

      if (!nearestMonster) {
        // No enemies available
        if (__DEV__) {
          console.log("🎯 No enemies found to target");
        }
        dispatch({
          type: "ADD_COMBAT_LOG",
          payload: { message: "No enemies in range" },
        });
        return;
      }

      if (__DEV__) {
        console.log("🎯 Entering ranged mode, targeting:", nearestMonster.name);
      }

      // Enter ranged attack mode and target the nearest enemy
      dispatch({
        type: "TOGGLE_RANGED_MODE",
        payload: { active: true, targetId: nearestMonster.id },
      });

      // Add targeting message to combat log
      const monsterName = nearestMonster.name || nearestMonster.shortName || "enemy";
      dispatch({
        type: "ADD_COMBAT_LOG",
        payload: { message: `Christos has the ${monsterName} in his sight!` },
      });

      if (__DEV__) {
        console.log("🎯 Entered ranged attack mode, targeting:", nearestMonster.name);
      }
    } else {
      // If ranged attack mode is ON, execute the ranged attack
      if (!state.targetedMonsterId) {
        if (__DEV__) {
          console.log("🎯 No target, attempting auto-retarget");
        }
        
        // No target selected (maybe previous target died)
        // Try to auto-target the nearest monster
        const allMonsters = [...state.activeMonsters, ...state.attackSlots];
        const nearestMonster = findNearestMonster(state.player.position, allMonsters);
        
        if (!nearestMonster) {
          // No enemies available at all
          if (__DEV__) {
            console.log("🎯 No enemies for auto-retarget, clearing ranged mode");
          }
          dispatch({
            type: "ADD_COMBAT_LOG",
            payload: { message: "No enemies in range" },
          });
          dispatch({ type: "CLEAR_RANGED_MODE" });
          return;
        }
        
        if (__DEV__) {
          console.log("🎯 Auto-targeting nearest:", nearestMonster.name);
        }
        
        // Auto-target the nearest monster
        dispatch({
          type: "SET_TARGET_MONSTER",
          payload: { monsterId: nearestMonster.id },
        });
        
        // Add targeting message
        const monsterName = nearestMonster.name || nearestMonster.shortName || "enemy";
        dispatch({
          type: "ADD_COMBAT_LOG",
          payload: { message: `Christos has the ${monsterName} in his sight!` },
        });
        
        if (__DEV__) {
          console.log("🎯 Auto-targeted nearest monster:", nearestMonster.name);
        }
        return;
      }

      if (__DEV__) {
        console.log("🎯 Executing ranged attack on target:", state.targetedMonsterId);
      }

      // Find the target monster to get its position
      let targetMonster = state.activeMonsters.find(
        (m) => m.id === state.targetedMonsterId && m.hp > 0
      );
      if (!targetMonster) {
        targetMonster = state.attackSlots.find(
          (m) => m.id === state.targetedMonsterId && m.hp > 0
        );
      }

      if (!targetMonster) {
        if (__DEV__) {
          console.log("🎯 Target not found, clearing ranged mode");
        }
        dispatch({ type: "CLEAR_RANGED_MODE" });
        return;
      }

      // Calculate screen positions for player and monster
      const playerScreenX = (state.player.position.col - cameraOffset.offsetX) * CELL_SIZE + CELL_SIZE / 2;
      const playerScreenY = (state.player.position.row - cameraOffset.offsetY) * CELL_SIZE + CELL_SIZE / 2;
      const monsterScreenX = (targetMonster.position.col - cameraOffset.offsetX) * CELL_SIZE + CELL_SIZE / 2;
      const monsterScreenY = (targetMonster.position.row - cameraOffset.offsetY) * CELL_SIZE + CELL_SIZE / 2;

      // Execute the ranged attack (spawns projectile)
      const projectileId = executeRangedAttack(
        state,
        dispatch,
        state.targetedMonsterId,
        playerScreenX,
        playerScreenY,
        monsterScreenX,
        monsterScreenY
      );

      if (projectileId) {
        // Track the projectile -> target mapping for impact processing
        projectileTargets.current.set(projectileId, state.targetedMonsterId);
        
        if (__DEV__) {
          console.log("🎯 Projectile spawned:", projectileId);
        }
      }

      if (__DEV__) {
        console.log("🎯 handleZapPress complete");
      }
    }
  }, [state, dispatch, cameraOffset]);

  const handleTurnPress = useCallback(() => {
    if (state.inCombat) return;
    handlePassTurn(state, dispatch);
  }, [state, dispatch]);

  const handleAttackPress = useCallback(() => {
    if (!state.inCombat || !state.attackSlots) return;

    const targetMonster = targetId
      ? state.attackSlots.find((m) => m.id === targetId)
      : state.attackSlots[0];

    if (!targetMonster) {
      console.warn("No target monster in attack slots");
      return;
    }

    handleCombatAction(state, dispatch, "attack", targetMonster.id);
  }, [state, dispatch, targetId]);

  const handleMonsterTap = useCallback(
    (monster: Monster) => {
      // If in ranged attack mode, retarget to the tapped monster
      if (state.rangedAttackMode) {
        if (__DEV__) {
          console.log("Retargeting to:", monster.name, "ID:", monster.id);
        }
        dispatch({
          type: "SET_TARGET_MONSTER",
          payload: { monsterId: monster.id },
        });
        return;
      }

      // If in combat (not ranged mode), set as combat target
      if (state.inCombat) {
        if (__DEV__) {
          console.log(
            "Monster tapped during combat:",
            monster.name,
            "ID:",
            monster.id
          );
        }
        setTargetId(monster.id);
      }
    },
    [state.inCombat, state.rangedAttackMode, dispatch]
  );

  const handleGreatPowerTap = useCallback(
    (greatPower: GreatPower) => {
      if (__DEV__) {
        console.log(
          "Great Power tapped:",
          greatPower.name,
          "awakened:",
          greatPower.awakened
        );
      }

      if (greatPower.awakened) return;

      const playerPos = state.player.position;
      const powerPos = greatPower.position;
      const distance =
        Math.abs(playerPos.row - powerPos.row) +
        Math.abs(playerPos.col - powerPos.col);

      if (
        distance <= COMBAT_CONSTANTS.GREAT_POWER_AWAKEN_DISTANCE &&
        greatPower.awakenCondition === "player_within_range"
      ) {
        if (__DEV__) {
          console.log("Awakening Great Power:", greatPower.name);
        }
        dispatch({
          type: "AWAKEN_GREAT_POWER",
          payload: { greatPowerId: greatPower.id },
        });
      }
    },
    [state.player.position, dispatch]
  );

  // Empty handlers for entities managed by GameBoard
  const handlePlayerTap = useCallback(() => {}, []);
  const handleBuildingTap = useCallback(() => {}, []);
  const handleItemTap = useCallback(() => {}, []);

  const handleNonCollisionObjectTap = useCallback((obj: NonCollisionObject) => {
    if (__DEV__) {
      console.log("Non-collision object tapped:", obj.name, "Type:", obj.type);
    }
  }, []);

  const handleDeathInfoBoxClose = useCallback(() => {
    if (__DEV__) {
      console.log("Death InfoBox closed, navigating to death screen immediately");
    }
    router.push("/death");
  }, [router]);

  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressOut={stopLongPressInterval}
    >
      <View style={styles.gameContainer}>
        <GameBoard
          state={state}
          cameraOffset={cameraOffset}
          onPlayerTap={handlePlayerTap}
          onMonsterTap={handleMonsterTap}
          onBuildingTap={handleBuildingTap}
          onItemTap={handleItemTap}
          onGreatPowerTap={handleGreatPowerTap}
          onNonCollisionObjectTap={handleNonCollisionObjectTap}
          onDeathInfoBoxClose={handleDeathInfoBoxClose}
          onProjectileComplete={handleProjectileComplete}
        />
        <PositionDisplay position={state.player.position} level={state.level} />
        <PlayerHUD
          hp={state.player.hp}
          maxHP={state.player.maxHP}
          onGearPress={handleGearPress}
          onTurnPress={handleTurnPress}
          onAttackPress={handleAttackPress}
          onInventoryPress={handleInventoryPress}
          onZapPress={handleZapPress}
          inCombat={state.inCombat}
        />
        <Settings visible={settingsVisible} onClose={handleCloseSettings} />
        <Inventory
          visible={inventoryVisible}
          onClose={handleCloseInventory}
          inventory={state.player.inventory}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gameContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
