import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { handleMovePlayer } from "../../modules/playerUtils";
import { PositionDisplay } from "../../components/PositionDisplay";
import { useGameContext } from "../../context/GameContext";
import GameBoard, { VIEWPORT_ROWS, VIEWPORT_COLS, CELL_SIZE } from "./GameBoard";
import PlayerHUD from "../../components/PlayerHUD";
import Settings from "../../components/Settings";

const { width, height } = Dimensions.get("window");

// Configuration for long-press behavior
const LONG_PRESS_DELAY = 300; // Time to hold before long-press starts (ms)
const MOVEMENT_INTERVAL = 200; // Time between repeated moves during long-press (ms)
const MIN_MOVE_DISTANCE = 1; // Minimum distance to trigger movement
const HUD_HEIGHT = 60; // Approximate HUD height (adjust based on PlayerHUD styles)

export default function Game() {
  const { state, dispatch, showDialog, setOverlay, setDeathMessage } = useGameContext();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDirection = useRef<string | null>(null);
  const isLongPressing = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const stopLongPress = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    if (longPressInterval.current) {
      clearInterval(longPressInterval.current);
      longPressInterval.current = null;
    }
    isLongPressing.current = false;
    currentDirection.current = null;
  }, []);

  const calculateCameraOffset = useCallback((playerPos: { row: number; col: number }) => {
    const halfViewportCols = Math.floor(VIEWPORT_COLS / 2);
    const halfViewportRows = Math.floor(VIEWPORT_ROWS / 2);
    return {
      offsetX: Math.max(0, Math.min(state.gridWidth - VIEWPORT_COLS, playerPos.col - halfViewportCols)),
      offsetY: Math.max(0, Math.min(state.gridHeight - VIEWPORT_ROWS, playerPos.row - halfViewportRows)),
    };
  }, [state.gridWidth]);

  const [cameraOffset, setCameraOffset] = useState(() => calculateCameraOffset(state.player.position));

  useEffect(() => {
    setCameraOffset(calculateCameraOffset(state.player.position));
  }, [state.player.position, calculateCameraOffset]);

  useEffect(() => {
    if (state.inCombat) {
      stopLongPress();
    }
  }, [state.inCombat, stopLongPress]);

  useEffect(() => {
    return () => {
      stopLongPress();
    };
  }, [stopLongPress]);

  const getMovementDirection = useCallback((tapRow: number, tapCol: number, playerRow: number, playerCol: number) => {
    const rowDiff = tapRow - playerRow;
    const colDiff = tapCol - playerCol;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    if (absRowDiff < MIN_MOVE_DISTANCE && absColDiff < MIN_MOVE_DISTANCE) {
      return null;
    }

    if (absRowDiff > absColDiff) {
      return rowDiff < 0 ? "up" : "down";
    } else if (absColDiff > absRowDiff) {
      return colDiff < 0 ? "left" : "right";
    } else {
      return absRowDiff >= absColDiff ? (rowDiff < 0 ? "up" : "down") : (colDiff < 0 ? "left" : "right");
    }
  }, []);

  const calculateTapPosition = useCallback((pageX: number, pageY: number) => {
    const gridLeft = (width - VIEWPORT_COLS * CELL_SIZE) / 2;
    const gridTop = (height - VIEWPORT_ROWS * CELL_SIZE) / 2;

    const rawCol = (pageX - gridLeft) / CELL_SIZE + cameraOffset.offsetX;
    const rawRow = (pageY - gridTop) / CELL_SIZE + cameraOffset.offsetY;

    return {
      tapCol: Math.floor(rawCol),
      tapRow: Math.floor(rawRow),
    };
  }, [cameraOffset]);

  const performMovement = useCallback((direction: string) => {
    const currentState = stateRef.current;
    if (currentState.inCombat) {
      stopLongPress();
      return;
    }
    handleMovePlayer(currentState, dispatch, direction, setOverlay, showDialog, setDeathMessage);
  }, [dispatch, setOverlay, showDialog, setDeathMessage, stopLongPress]);

  const startLongPress = useCallback((direction: string) => {
    if (stateRef.current.inCombat) return;

    isLongPressing.current = true;
    currentDirection.current = direction;

    longPressInterval.current = setInterval(() => {
      if (isLongPressing.current && currentDirection.current) {
        performMovement(currentDirection.current);
      } else {
        stopLongPress();
      }
    }, MOVEMENT_INTERVAL);
  }, [performMovement, stopLongPress]);

  const handlePressIn = useCallback((event: any) => {
    if (state.inCombat || settingsVisible) {
      console.log("Touch ignored: in combat or settings visible");
      return;
    }

    const { pageY } = event.nativeEvent;
    if (pageY > height - HUD_HEIGHT) {
      console.log("Touch in HUD area, ignoring for movement");
      return;
    }

    stopLongPress();

    const { pageX } = event.nativeEvent;
    const { tapCol, tapRow } = calculateTapPosition(pageX, pageY);
    const { row: playerRow, col: playerCol } = state.player.position;

    const direction = getMovementDirection(tapRow, tapCol, playerRow, playerCol);

    if (direction) {
      currentDirection.current = direction;
      performMovement(direction);
      longPressTimeout.current = setTimeout(() => {
        startLongPress(direction);
      }, LONG_PRESS_DELAY);
    }
  }, [state.inCombat, settingsVisible, state.player.position, stopLongPress, calculateTapPosition, getMovementDirection, performMovement, startLongPress]);

  const handlePressOut = useCallback(() => {
    stopLongPress();
  }, [stopLongPress]);

  const handleTouchCancel = useCallback(() => {
    stopLongPress();
  }, [stopLongPress]);

  const handleGearPress = useCallback(() => {
    if (state.inCombat) {
      showDialog("Cannot access settings during combat", 1500);
    } else {
      setSettingsVisible(true);
    }
  }, [state.inCombat, showDialog]);

  const handleCloseSettings = useCallback(() => {
    setSettingsVisible(false);
  }, []);

  return (
    <View
      style={styles.container}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handleTouchCancel}
    >
      <View style={styles.gameContainer}>
        <GameBoard state={state} cameraOffset={cameraOffset} />
        <PositionDisplay position={state.player.position} />
        {state.inCombat && (
          <View style={styles.combatOverlay}>
            {/* Combat UI */}
          </View>
        )}
        <PlayerHUD
          hp={state.player.hp}
          maxHP={state.player.maxHP}
          onGearPress={handleGearPress}
        />
        <Settings
          visible={settingsVisible}
          onClose={handleCloseSettings}
        />
      </View>
    </View>
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
  combatOverlay: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 20,
    borderRadius: 10,
  },
});