// /app/game/index.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Dimensions, Pressable, Text } from "react-native";
import { PositionDisplay } from "../../components/PositionDisplay";
import { useGameContext } from "../../context/GameContext";
import GameBoard, {
  VIEWPORT_ROWS,
  VIEWPORT_COLS,
  CELL_SIZE,
} from "./GameBoard";
import PlayerHUD from "../../components/PlayerHUD";
import Settings from "../../components/Settings";
import { calculateCameraOffset } from "../../modules/utils";
import { handleMovePlayer, initializeStartingMonsters } from "../../modules/gameLoop";


const { width, height } = Dimensions.get("window");
const MIN_MOVE_DISTANCE = 1;
const HUD_HEIGHT = 60;
const MOVEMENT_INTERVAL = 150;

// Define Direction type locally since we removed movement.ts
type Direction = "up" | "down" | "left" | "right" | "stay" | null;

export default function Game() {
  const { state, dispatch, showDialog, setOverlay, setDeathMessage } =
    useGameContext();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const stateRef = useRef(state);

  // Keep latest state for callbacks
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
  // Initialize starting monsters on first load
  if (state.activeMonsters.length === 0 && state.moveCount === 0) {
    initializeStartingMonsters(state, dispatch);
  }
}, [state.activeMonsters.length, state.moveCount, state, dispatch]);

  // Long press movement
  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentDirection = useRef<Direction>(null);

  // Camera offset
  const [cameraOffset, setCameraOffset] = useState(() =>
    calculateCameraOffset(
      state.player.position,
      VIEWPORT_COLS,
      VIEWPORT_ROWS,
      state.gridWidth,
      state.gridHeight
    )
  );

  useEffect(() => {
    setCameraOffset(
      calculateCameraOffset(
        state.player.position,
        VIEWPORT_COLS,
        VIEWPORT_ROWS,
        state.gridWidth,
        state.gridHeight
      )
    );
  }, [state.player.position, state.gridWidth, state.gridHeight]);

  // -------------------
  // Movement helpers
  // -------------------
  const calculateTapPosition = useCallback(
    (pageX: number, pageY: number) => {
      const gridLeft = (width - VIEWPORT_COLS * CELL_SIZE) / 2;
      const gridTop = (height - VIEWPORT_ROWS * CELL_SIZE) / 2;
      const rawCol = (pageX - gridLeft) / CELL_SIZE + cameraOffset.offsetX;
      const rawRow = (pageY - gridTop) / CELL_SIZE + cameraOffset.offsetY;

      return { tapCol: Math.floor(rawCol), tapRow: Math.floor(rawRow) };
    },
    [cameraOffset]
  );

  const getMovementDirectionFromTap = useCallback(
    (tapRow: number, tapCol: number, playerRow: number, playerCol: number, minDistance: number): Direction => {
      const deltaRow = tapRow - playerRow;
      const deltaCol = tapCol - playerCol;
      const absRow = Math.abs(deltaRow);
      const absCol = Math.abs(deltaCol);

      // Check if tap is too close to player
      if (absRow < minDistance && absCol < minDistance) {
        return null;
      }

      // Determine primary direction based on larger delta
      if (absRow > absCol) {
        return deltaRow > 0 ? "down" : "up";
      } else if (absCol > absRow) {
        return deltaCol > 0 ? "right" : "left";
      } else {
        // Equal deltas, choose based on sign
        if (deltaRow !== 0) {
          return deltaRow > 0 ? "down" : "up";
        } else if (deltaCol !== 0) {
          return deltaCol > 0 ? "right" : "left";
        }
      }
      
      return null;
    },
    []
  );

  const performMove = useCallback((direction: Direction) => {
    if (!direction || stateRef.current.inCombat) return;
    
    handleMovePlayer(
      stateRef.current,
      dispatch,
      direction,
      setOverlay,
      showDialog,
      setDeathMessage
    );
  }, [dispatch, setOverlay, showDialog, setDeathMessage]);

  const startLongPressInterval = useCallback(
    (direction: Direction) => {
      currentDirection.current = direction;
      if (longPressInterval.current) clearInterval(longPressInterval.current);

      longPressInterval.current = setInterval(() => {
        if (stateRef.current.inCombat || !currentDirection.current) {
          clearInterval(longPressInterval.current!);
          longPressInterval.current = null;
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

  const handlePress = useCallback(
    (event: any) => {
      if (state.inCombat || settingsVisible) return;
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

      if (!direction) return;
      performMove(direction);
    },
    [state.inCombat, settingsVisible, calculateTapPosition, getMovementDirectionFromTap, performMove]
  );

  const handleLongPress = useCallback(
    (event: any) => {
      if (state.inCombat || settingsVisible) return;
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

      if (!direction) return;
      startLongPressInterval(direction);
    },
    [
      state.inCombat,
      settingsVisible,
      calculateTapPosition,
      getMovementDirectionFromTap,
      startLongPressInterval,
    ]
  );

  const handlePressOut = useCallback(
    () => stopLongPressInterval(),
    [stopLongPressInterval]
  );

  // -------------------
  // UI handlers
  // -------------------
  const handleGearPress = useCallback(() => {
    if (state.inCombat)
      showDialog("Cannot access settings during combat", 1500);
    else setSettingsVisible(true);
  }, [state.inCombat, showDialog]);

  const handleCloseSettings = useCallback(() => setSettingsVisible(false), []);

  const handleTurnPress = useCallback(() => {
    if (state.inCombat) return;
    dispatch({ type: "PASS_TURN" });
  }, [dispatch, state.inCombat]);

  const handleAttackPress = useCallback(() => {
    if (!state.inCombat) return;
    // TODO: Implement player attack logic
    console.log("Player attack pressed");
  }, [state.inCombat]);

  const handleMonsterTap = useCallback(
    (monster: any) => {
      if (state.inCombat) {
        // TODO: Queue player action / attack for this monster when combat.ts is implemented
        console.log("Monster tapped during combat:", monster.name);
      }
    },
    [state.inCombat]
  );

  const handlePlayerTap = useCallback(() => {
    // Could implement info or action menu
  }, []);

  const handleBuildingTap = useCallback((building: any) => {
    // Could implement info or interaction
  }, []);

  // -------------------
  // Render
  // -------------------
  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressOut={handlePressOut}
    >
      <View style={styles.gameContainer}>
        <GameBoard
          state={state}
          cameraOffset={cameraOffset}
          onPlayerTap={handlePlayerTap}
          onMonsterTap={handleMonsterTap}
          onBuildingTap={handleBuildingTap}
        />
        <PositionDisplay position={state.player.position} level={state.level} />

        {state.inCombat && (
          <View style={styles.combatOverlay}>
            <Text style={styles.dialogText}>
              this will be combat textthis will be combat textthis will be
              combat textthis will be combat textthis will be combat textthis
              will be combat textthis will be combat textthis will be combat
              text
            </Text>
          </View>
        )}

        <PlayerHUD
          hp={state.player.hp}
          maxHP={state.player.maxHP}
          onGearPress={handleGearPress}
          onTurnPress={handleTurnPress} // non-combat
          onAttackPress={handleAttackPress} // combat
          inCombat={state.inCombat} // dynamic
        />

        <Settings visible={settingsVisible} onClose={handleCloseSettings} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  dialogText: { color: "#990000" },
  gameContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  combatOverlay: {
    position: "absolute",
    top: 25, // 5 pixels from top
    left: 5, // 5 pixels from left
    backgroundColor: "rgba(0,0,0,0.7)", // 70% transparent black
    borderWidth: 2,
    borderColor: "#990000", // red border
    padding: 10,
    borderRadius: 8,
    maxWidth: "50%", // optional: prevent it from stretching too wide
  },
});