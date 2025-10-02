import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { Monster, LevelObjectInstance, Item, GreatPower,Footstep } from "@/config/types";
import { audioManager } from "../../modules/audioManager";

// Constants
const { width, height } = Dimensions.get("window");
const MIN_MOVE_DISTANCE = 1;
const HUD_HEIGHT = 60;
const MOVEMENT_INTERVAL = 150;
const GAME_OVER_DELAY = 7000;
const GREAT_POWER_AWAKEN_DISTANCE = 3;

type Direction = "up" | "down" | "left" | "right" | "stay" | null;

export default function Game() {
  const { state, dispatch, setOverlay } = useGameContext();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [targetId, setTargetId] = useState<string | undefined>();
  const router = useRouter();

  // Refs
  const stateRef = useRef(state);
  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentDirection = useRef<Direction>(null);

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

    console.log("Game Over detected, navigating to death screen");
    audioManager.pauseBackgroundMusic();

    const timeout = setTimeout(() => {
      dispatch({ type: "RESET_GAME" });
      router.push("/princess");
    }, GAME_OVER_DELAY);

    return () => clearTimeout(timeout);
  }, [state.gameOver, router, dispatch]);

  // Initialize starting monsters
  useEffect(() => {
    if (state.activeMonsters.length === 0 && state.moveCount === 0) {
      console.log("Initializing starting monsters");
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
        tapRow: Math.floor(rawRow) 
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
          ? (deltaRow > 0 ? "down" : "up")
          : (deltaCol > 0 ? "right" : "left");
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
      }, MOVEMENT_INTERVAL);
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
      if (state.inCombat || isOverlayVisible) return;
      
      const { pageX, pageY } = event.nativeEvent;
      if (pageY > height - HUD_HEIGHT) return;

      const { tapCol, tapRow } = calculateTapPosition(pageX, pageY);
      const { row: playerRow, col: playerCol } = state.player.position;

      const direction = getMovementDirectionFromTap(
        tapRow,
        tapCol,
        playerRow,
        playerCol,
        MIN_MOVE_DISTANCE
      );

      if (direction) performMove(direction);
    },
    [
      state.inCombat,
      state.player.position,
      isOverlayVisible,
      calculateTapPosition,
      getMovementDirectionFromTap,
      performMove,
    ]
  );

  const handleLongPress = useCallback(
    (event: any) => {
      if (state.inCombat || isOverlayVisible) return;
      
      const { pageX, pageY } = event.nativeEvent;
      if (pageY > height - HUD_HEIGHT) return;

      const { tapCol, tapRow } = calculateTapPosition(pageX, pageY);
      const { row: playerRow, col: playerCol } = state.player.position;

      const direction = getMovementDirectionFromTap(
        tapRow,
        tapCol,
        playerRow,
        playerCol,
        MIN_MOVE_DISTANCE
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
    if (!state.inCombat) setInventoryVisible(true);
  }, [state.inCombat]);

  const handleCloseInventory = useCallback(() => {
    setInventoryVisible(false);
  }, []);

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
      if (state.inCombat) {
        console.log("Monster tapped during combat:", monster.name, "ID:", monster.id);
        setTargetId(monster.id);
      }
    },
    [state.inCombat]
  );

  const handleGreatPowerTap = useCallback(
    (greatPower: GreatPower) => {
      console.log("Great Power tapped:", greatPower.name, "awakened:", greatPower.awakened);

      if (greatPower.awakened) return;

      const playerPos = state.player.position;
      const powerPos = greatPower.position;
      const distance =
        Math.abs(playerPos.row - powerPos.row) +
        Math.abs(playerPos.col - powerPos.col);

      if (
        distance <= GREAT_POWER_AWAKEN_DISTANCE &&
        greatPower.awakenCondition === "player_within_range"
      ) {
        console.log("Awakening Great Power:", greatPower.name);
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

  const handleFootstepTap = useCallback(
  (footstep: Footstep) => {
    console.log("Footstep tapped:", footstep.name, "ID:", footstep.id);
  },
  []
);

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
        />
        <PositionDisplay position={state.player.position} level={state.level} />
        <PlayerHUD
          hp={state.player.hp}
          maxHP={state.player.maxHP}
          onGearPress={handleGearPress}
          onTurnPress={handleTurnPress}
          onAttackPress={handleAttackPress}
          onInventoryPress={handleInventoryPress}
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
    backgroundColor: "#000" 
  },
  gameContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
});