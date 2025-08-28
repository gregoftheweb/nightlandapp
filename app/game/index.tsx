import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { handleMovePlayer } from "../../modules/playerUtils";
import { PositionDisplay } from "../../components/PositionDisplay";
import { useGameContext } from "../../context/GameContext";
import GameBoard, { VIEWPORT_ROWS, VIEWPORT_COLS, CELL_SIZE } from "./GameBoard";

const { width, height } = Dimensions.get("window");

// Configuration for long-press behavior
const LONG_PRESS_DELAY = 300; // Time to hold before long-press starts (ms)
const MOVEMENT_INTERVAL = 1000; // Time between repeated moves during long-press (ms)

export default function Game() {
  const { state, dispatch, showDialog, setOverlay, setDeathMessage } = useGameContext();

  // Long-press state management - simplified for debugging
  const longPressInterval = useRef<number | null>(null);
  const longPressTimeout = useRef<number | null>(null);

  // Add a ref to track current state
  const stateRef = useRef(state);
  
  // Keep the ref updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const stopLongPress = () => {
    // Clear both timeout and interval
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    
    if (longPressInterval.current) {
      clearInterval(longPressInterval.current);
      longPressInterval.current = null;
    }
  };

  const calculateCameraOffset = (playerPos: { row: number; col: number }) => {
    const halfViewportCols = Math.floor(VIEWPORT_COLS / 2);
    const halfViewportRows = Math.floor(VIEWPORT_ROWS / 2);
    return {
      offsetX: Math.max(0, Math.min(state.gridWidth - VIEWPORT_COLS, playerPos.col - halfViewportCols)),
      offsetY: Math.max(0, Math.min(state.gridHeight - VIEWPORT_ROWS, playerPos.row - halfViewportRows)),
    };
  };

  const [cameraOffset, setCameraOffset] = useState(calculateCameraOffset(state.player.position));
  
  useEffect(() => {
    setCameraOffset(calculateCameraOffset(state.player.position));
  }, [state.player.position]);

  // Cleanup intervals on unmount or combat state change
  useEffect(() => {
    if (state.inCombat) {
      stopLongPress();
    }
  }, [state.inCombat]);

  useEffect(() => {
    return () => {
      stopLongPress();
    };
  }, []);

  const getMovementDirection = (tapRow: number, tapCol: number, playerRow: number, playerCol: number) => {
    const rowDiff = Math.abs(tapRow - playerRow);
    const colDiff = Math.abs(tapCol - playerCol);
    
    if (rowDiff > colDiff) {
      return tapRow < playerRow ? "up" : "down";
    } else if (tapCol !== playerCol) {
      return tapCol < playerCol ? "left" : "right";
    }
    return null;
  };

  const calculateTapPosition = (pageX: number, pageY: number) => {
    const gridLeft = (width - VIEWPORT_COLS * CELL_SIZE) / 2;
    const gridTop = (height - VIEWPORT_ROWS * CELL_SIZE) / 2;
    
    const rawCol = (pageX - gridLeft) / CELL_SIZE + cameraOffset.offsetX;
    const rawRow = (pageY - gridTop) / CELL_SIZE + cameraOffset.offsetY;
    
    return {
      tapCol: Math.floor(rawCol),
      tapRow: Math.floor(rawRow)
    };
  };

  const startLongPress = (direction: string) => {
    if (state.inCombat) return;
    
    // Start the repeated movement using current state ref
    longPressInterval.current = setInterval(() => {
      handleMovePlayer(stateRef.current, dispatch, direction, setOverlay, showDialog, setDeathMessage);
    }, MOVEMENT_INTERVAL);
  };

  const handlePressIn = (event: any) => {
    if (state.inCombat) return;
    
    const { pageX, pageY } = event.nativeEvent;
    const { tapCol, tapRow } = calculateTapPosition(pageX, pageY);
    const { row: playerRow, col: playerCol } = state.player.position;

    const direction = getMovementDirection(tapRow, tapCol, playerRow, playerCol);
    
    if (direction) {
      // Execute immediate movement
      handleMovePlayer(state, dispatch, direction, setOverlay, showDialog, setDeathMessage);
      
      // Set up long-press timer
      longPressTimeout.current = setTimeout(() => {
        startLongPress(direction);
      }, LONG_PRESS_DELAY);
    }
  };

  const handlePressOut = () => {
    stopLongPress();
  };

  return (
    <View
      style={styles.container}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      <View style={styles.gameContainer}>
        <GameBoard state={state} cameraOffset={cameraOffset} />
        <PositionDisplay position={state.player.position} />
        {state.inCombat && (
          <View style={styles.combatOverlay}>
            {/* Combat UI */}
          </View>
        )}
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