import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
import { useRouter } from "expo-router";
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
import { Monster, LevelObjectInstance, Item, GreatPower } from "@/config/types";
import { audioManager } from "../../modules/audioManager";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const MIN_MOVE_DISTANCE = 1;
const HUD_HEIGHT = 60;
const MOVEMENT_INTERVAL = 150;

type Direction = "up" | "down" | "left" | "right" | "stay" | null;

export default function Game() {
  const { state, dispatch, setOverlay } = useGameContext();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [targetId, setTargetId] = useState<string | undefined>();
  const router = useRouter();

  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Start background music when game screen is focused
  useFocusEffect(
    useCallback(() => {
      audioManager.playBackgroundMusic();

      return () => {
        // Pause when screen loses focus (optional)
        audioManager.pauseBackgroundMusic();
      };
    }, [])
  );

  useEffect(() => {
    if (state.gameOver) {
      console.log("Game Over detected, navigating to death screen");
      audioManager.pauseBackgroundMusic();

      // Small delay to show death message in InfoBox (handled by GameBoard)
      setTimeout(() => {
        dispatch({ type: "RESET_GAME" });
        router.push("/princess");
      }, 4000); // Match the InfoBox display time
    }
  }, [state.gameOver, router, dispatch]);

  useEffect(() => {
    if (state.activeMonsters.length === 0 && state.moveCount === 0) {
      console.log("Initializing starting monsters");
      initializeStartingMonsters(state, dispatch);
    }
  }, [state.activeMonsters.length, state.moveCount, state, dispatch]);

  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentDirection = useRef<Direction>(null);

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

      if (absRow < minDistance && absCol < minDistance) {
        return null;
      }

      if (absRow > absCol) {
        return deltaRow > 0 ? "down" : "up";
      } else if (absCol > absRow) {
        return deltaCol > 0 ? "right" : "left";
      } else {
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

  const performMove = useCallback(
    (direction: Direction) => {
      if (!direction || stateRef.current.inCombat) return;

      handleMovePlayer(
        stateRef.current,
        dispatch,
        direction,
        setOverlay
      );
    },
    [dispatch, setOverlay]
  );

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
      if (state.inCombat || settingsVisible || inventoryVisible) return;
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
    [
      state.inCombat,
      settingsVisible,
      inventoryVisible,
      calculateTapPosition,
      getMovementDirectionFromTap,
      performMove,
    ]
  );

  const handleLongPress = useCallback(
    (event: any) => {
      if (state.inCombat || settingsVisible || inventoryVisible) return;
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
      inventoryVisible,
      calculateTapPosition,
      getMovementDirectionFromTap,
      startLongPressInterval,
    ]
  );

  const handlePressOut = useCallback(
    () => stopLongPressInterval(),
    [stopLongPressInterval]
  );

  const handleGearPress = useCallback(() => {
    if (!state.inCombat) setSettingsVisible(true);
  }, [state.inCombat]);

  const handleCloseSettings = useCallback(() => setSettingsVisible(false), []);

  const handleInventoryPress = useCallback(() => {
    if (!state.inCombat) setInventoryVisible(true);
  }, [state.inCombat]);

  const handleCloseInventory = useCallback(
    () => setInventoryVisible(false),
    []
  );

  const handleTurnPress = useCallback(() => {
    if (state.inCombat) {
      //early return
      return;
    }

    handlePassTurn(state, dispatch);
  }, [state, dispatch]);

  const handleAttackPress = useCallback(() => {
    if (!state.inCombat) {
      //early return
      return;
    }
    const targetMonster = targetId
      ? state.attackSlots?.find((m) => m.id === targetId)
      : state.attackSlots?.[0];
    if (!targetMonster) {
      console.warn("No target monster in attack slots");
      return;
    }

    handleCombatAction(
      state,
      dispatch,
      "attack",
      targetMonster.id,
    );
  }, [state, dispatch, targetId]);

  const handleMonsterTap = useCallback(
    (monster: Monster) => {
      if (state.inCombat) {
        console.log(
          "Monster tapped during combat:",
          monster.name,
          "ID:",
          monster.id
        );
        setTargetId(monster.id);
      }
    },
    [state.inCombat]
  );

  const handleGreatPowerTap = useCallback(
    (greatPower: GreatPower) => {
      console.log(
        "Great Power tapped:",
        greatPower.name,
        "awakened:",
        greatPower.awakened
      );

      const playerPos = state.player.position;
      const powerPos = greatPower.position;
      const distance =
        Math.abs(playerPos.row - powerPos.row) +
        Math.abs(playerPos.col - powerPos.col);

      if (!greatPower.awakened && distance <= 3) {
        if (greatPower.awakenCondition === "player_within_range") {
          console.log("Awakening Great Power:", greatPower.name);
          dispatch({
            type: "AWAKEN_GREAT_POWER",
            payload: { greatPowerId: greatPower.id },
          });
        }
      } else if (!greatPower.awakened) {
        //do nothing
      }
    },
    [state.player.position, dispatch]
  );

  const handlePlayerTap = useCallback(() => {
    // InfoBox is handled in GameBoard.tsx
  }, []);

  const handleBuildingTap = useCallback((building: LevelObjectInstance) => {
    // InfoBox is handled in GameBoard.tsx
  }, []);

  const handleItemTap = useCallback((item: Item) => {
    // InfoBox is handled in GameBoard.tsx
  }, []);

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
  container: { flex: 1, backgroundColor: "#000" },
  gameContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  combatOverlay: {
    position: "absolute",
    top: 25,
    left: 5,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 2,
    borderColor: "#990000",
    padding: 10,
    borderRadius: 8,
    maxWidth: "50%",
  },
});
