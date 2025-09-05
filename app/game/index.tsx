import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import { PositionDisplay } from "../../components/PositionDisplay";
import { useGameContext } from "../../context/GameContext";
import GameBoard, { VIEWPORT_ROWS, VIEWPORT_COLS, CELL_SIZE } from "./GameBoard";
import PlayerHUD from "../../components/PlayerHUD";
import Settings from "../../components/Settings";
import { GameLoop } from "../../modules/gameLoop";
import { calculateCameraOffset } from "../../modules/utils";
import { MovementHandler, Direction } from "../../modules/movement";

const { width, height } = Dimensions.get("window");
const MIN_MOVE_DISTANCE = 1;
const HUD_HEIGHT = 60;
const MOVEMENT_INTERVAL = 150;

export default function Game() {
  const { state, dispatch, showDialog, setOverlay, setDeathMessage } = useGameContext();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const gameLoopRef = useRef<GameLoop | null>(null);
  const movementHandlerRef = useRef<MovementHandler | null>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentDirection = useRef<Direction>(null);

  const [cameraOffset, setCameraOffset] = useState(() =>
    calculateCameraOffset(state.player.position, VIEWPORT_COLS, VIEWPORT_ROWS, state.gridWidth, state.gridHeight)
  );

  useEffect(() => {
    if (!gameLoopRef.current) {
      gameLoopRef.current = new GameLoop(dispatch, showDialog, setOverlay, setDeathMessage);
      gameLoopRef.current.start();
      console.log("Game: GameLoop initialized");
    }
    if (!movementHandlerRef.current) {
      movementHandlerRef.current = new MovementHandler(dispatch, showDialog, setOverlay, setDeathMessage);
      console.log("Game: MovementHandler initialized");
    }
  }, [dispatch, showDialog, setOverlay, setDeathMessage]);

  useEffect(() => {
    setCameraOffset(
      calculateCameraOffset(state.player.position, VIEWPORT_COLS, VIEWPORT_ROWS, state.gridWidth, state.gridHeight)
    );
  }, [state.player.position, state.gridWidth, state.gridHeight]);

  // -------------------
  // Movement helpers
  // -------------------
  const calculateTapPosition = useCallback((pageX: number, pageY: number) => {
    const gridLeft = (width - VIEWPORT_COLS * CELL_SIZE) / 2;
    const gridTop = (height - VIEWPORT_ROWS * CELL_SIZE) / 2;
    const rawCol = (pageX - gridLeft) / CELL_SIZE + cameraOffset.offsetX;
    const rawRow = (pageY - gridTop) / CELL_SIZE + cameraOffset.offsetY;

    return { tapCol: Math.floor(rawCol), tapRow: Math.floor(rawRow) };
  }, [cameraOffset]);

  const performMove = useCallback((direction: Direction) => {
    if (!gameLoopRef.current || !direction || state.inCombat) {
      console.log("performMove: Blocked", { direction, inCombat: state.inCombat });
      return;
    }
    console.log("performMove: Dispatching MOVE_PLAYER", { direction });
    gameLoopRef.current.processTurn(stateRef.current, "MOVE_PLAYER", { direction });
  }, [state.inCombat]);

  const startLongPressInterval = useCallback((direction: Direction) => {
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
  }, [performMove]);

  const stopLongPressInterval = useCallback(() => {
    if (longPressInterval.current) {
      clearInterval(longPressInterval.current);
      longPressInterval.current = null;
      currentDirection.current = null;
    }
  }, []);

  const handlePress = useCallback((event: any) => {
    if (state.inCombat || settingsVisible) return;

    const { pageX, pageY } = event.nativeEvent;
    if (pageY > height - HUD_HEIGHT) return;

    const { tapCol, tapRow } = calculateTapPosition(pageX, pageY);
    const { row: playerRow, col: playerCol } = state.player.position;

    const direction = movementHandlerRef.current?.getMovementDirectionFromTap(
      tapRow, tapCol, playerRow, playerCol, MIN_MOVE_DISTANCE
    );

    if (!direction) return;
    performMove(direction); // single tap
  }, [state.inCombat, settingsVisible, calculateTapPosition, performMove]);

  const handleLongPress = useCallback((event: any) => {
    if (state.inCombat || settingsVisible) return;

    const { pageX, pageY } = event.nativeEvent;
    if (pageY > height - HUD_HEIGHT) return;

    const { tapCol, tapRow } = calculateTapPosition(pageX, pageY);
    const { row: playerRow, col: playerCol } = state.player.position;

    const direction = movementHandlerRef.current?.getMovementDirectionFromTap(
      tapRow, tapCol, playerRow, playerCol, MIN_MOVE_DISTANCE
    );

    if (!direction) return;
    startLongPressInterval(direction); // continuous move
  }, [state.inCombat, settingsVisible, calculateTapPosition, startLongPressInterval]);

  const handlePressOut = useCallback(() => stopLongPressInterval(), [stopLongPressInterval]);

  // -------------------
  // UI handlers
  // -------------------
  const handleGearPress = useCallback(() => {
    if (state.inCombat) showDialog("Cannot access settings during combat", 1500);
    else setSettingsVisible(true);
  }, [state.inCombat, showDialog]);

  const handleCloseSettings = useCallback(() => setSettingsVisible(false), []);

  const handleTurnPress = useCallback(() => {
    if (state.inCombat) {
      console.log("Game.handleTurnPress: Blocked due to inCombat");
      return;
    }
    console.log("Game.handleTurnPress: Dispatching PASS_TURN");
    gameLoopRef.current?.processTurn(stateRef.current, "PASS_TURN");
  }, [state.inCombat]);

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
        <GameBoard state={state} cameraOffset={cameraOffset} />
        <PositionDisplay position={state.player.position} level={state.level} />
        {state.inCombat && <View style={styles.combatOverlay} />}
        <PlayerHUD
          hp={state.player.hp}
          maxHP={state.player.maxHP}
          onGearPress={handleGearPress}
          onTurnPress={handleTurnPress}
        />
        <Settings visible={settingsVisible} onClose={handleCloseSettings} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  gameContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
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