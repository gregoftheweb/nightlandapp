// app/game/index.tsx - Refactored to focus on presentation
import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { PositionDisplay } from "../../components/PositionDisplay";
import { useGameContext } from "../../context/GameContext";
import GameBoard, { VIEWPORT_ROWS, VIEWPORT_COLS, CELL_SIZE } from "./GameBoard";
import PlayerHUD from "../../components/PlayerHUD";
import Settings from "../../components/Settings";
import { GameLoop } from "../../modules/gameLoop";
import { calculateCameraOffset } from "../../modules/utils";

import { MovementHandler } from "../../modules/movement";

const { width, height } = Dimensions.get("window");

// Configuration constants
const LONG_PRESS_DELAY = 300;
const MOVEMENT_INTERVAL = 200;
const MIN_MOVE_DISTANCE = 1;
const HUD_HEIGHT = 60;

export default function Game() {
  const { state, dispatch, showDialog, setOverlay, setDeathMessage } = useGameContext();
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  // Game loop and movement handlers
  const gameLoopRef = useRef<GameLoop | null>(null);
  const movementHandlerRef = useRef<MovementHandler | null>(null);
  
  // Touch handling state
  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDirection = useRef<string | null>(null);
  const isLongPressing = useRef(false);

  // Camera state
  const [cameraOffset, setCameraOffset] = useState(() => 
    calculateCameraOffset(state.player.position, VIEWPORT_COLS, VIEWPORT_ROWS, state.gridWidth, state.gridHeight)
  );

  // Initialize handlers
  useEffect(() => {
    if (!gameLoopRef.current) {
      gameLoopRef.current = new GameLoop(dispatch, showDialog, setOverlay, setDeathMessage);
      gameLoopRef.current.start();
    }

    if (!movementHandlerRef.current) {
      movementHandlerRef.current = new MovementHandler(dispatch, showDialog, setOverlay, setDeathMessage);
    }

    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.cleanup();
        gameLoopRef.current = null;
      }
    };
  }, [dispatch, showDialog, setOverlay, setDeathMessage]);

  // Update camera when player moves
  useEffect(() => {
    setCameraOffset(
      calculateCameraOffset(state.player.position, VIEWPORT_COLS, VIEWPORT_ROWS, state.gridWidth, state.gridHeight)
    );
  }, [state.player.position, state.gridWidth, state.gridHeight]);

  // Stop combat-sensitive operations when in combat
  useEffect(() => {
    if (state.inCombat) {
      stopLongPress();
    }
  }, [state.inCombat]);

  // Touch handling utilities
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

  const calculateTapPosition = useCallback((pageX: number, pageY: number) => {
    const gridLeft = (width - VIEWPORT_COLS * CELL_SIZE) / 2;
    const gridTop = (height - VIEWPORT_ROWS * CELL_SIZE) / 2; // Fixed typo: VIEWPORT_COLS -> VIEWPORT_ROWS

    const rawCol = (pageX - gridLeft) / CELL_SIZE + cameraOffset.offsetX;
    const rawRow = (pageY - gridTop) / CELL_SIZE + cameraOffset.offsetY;

    return {
      tapCol: Math.floor(rawCol),
      tapRow: Math.floor(rawRow),
    };
  }, [cameraOffset]);

  // const performMovement = useCallback((direction: string) => {
  //   if (state.inCombat || !movementHandlerRef.current || !gameLoopRef.current) return;
  //   movementHandlerRef.current.movePlayer(state, direction as any);
  //   gameLoopRef.current.processTurn(state, 'MOVE_PLAYER', { direction });
  //   stopLongPress();
  // }, [state.inCombat, stopLongPress]);



const startLongPress = useCallback((direction: string) => {
  if (state.inCombat || !gameLoopRef.current) return;

  isLongPressing.current = true;
  currentDirection.current = direction;

  longPressInterval.current = setInterval(() => {
    if (isLongPressing.current && currentDirection.current && gameLoopRef.current) {
      // Only call GameLoop - it handles MovementHandler internally
      gameLoopRef.current.processTurn(state, 'MOVE_PLAYER', { direction: currentDirection.current });
    } else {
      stopLongPress();
    }
  }, MOVEMENT_INTERVAL);
}, [state.inCombat, stopLongPress]);



  // Touch event handlers
 const handlePressIn = useCallback((event: any) => {
  if (state.inCombat || settingsVisible || !movementHandlerRef.current || !gameLoopRef.current) {
    return;
  }

  const { pageY, pageX } = event.nativeEvent;
  if (pageY > height - HUD_HEIGHT) {
    return; // Ignore HUD area
  }

  stopLongPress();

  const { tapCol, tapRow } = calculateTapPosition(pageX, pageY);
  const { row: playerRow, col: playerCol } = state.player.position;

  const direction = movementHandlerRef.current.getMovementDirectionFromTap(
    tapRow, tapCol, playerRow, playerCol, MIN_MOVE_DISTANCE
  );

  console.log(`TAP DEBUG: direction=${direction}, tapRow=${tapRow}, tapCol=${tapCol}, playerRow=${playerRow}, playerCol=${playerCol}`);

  if (direction) {
    currentDirection.current = direction;
    // Only call GameLoop once - it handles everything
    gameLoopRef.current.processTurn(state, 'MOVE_PLAYER', { direction });
    
    longPressTimeout.current = setTimeout(() => {
      startLongPress(direction);
    }, LONG_PRESS_DELAY);
  }
}, [
  state.inCombat,
  settingsVisible,
  state.player.position,
  stopLongPress,
  calculateTapPosition,
  startLongPress
]);




  const handlePressOut = useCallback(() => {
    stopLongPress();
  }, [stopLongPress]);

  const handleTouchCancel = useCallback(() => {
    stopLongPress();
  }, [stopLongPress]);

  // UI event handlers
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLongPress();
    };
  }, [stopLongPress]);

  return (
    <View
      style={styles.container}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handleTouchCancel}
    >
      <View style={styles.gameContainer}>
        <GameBoard state={state} cameraOffset={cameraOffset} />
        <PositionDisplay position={state.player.position} level={state.level} />
        
        {state.inCombat && (
          <View style={styles.combatOverlay}>
            {/* Combat UI components can be added here */}
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