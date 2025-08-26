// app/game/index.tsx
import React, { useState, useEffect, useReducer } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import { handleMovePlayer } from "../../modules/playerUtils";
import {
  GameState,
  createInitialGameState,
  deserializeGameState,
} from "../../config/gameState";
import { Monster } from "@/config/types";
import { PositionDisplay } from "../../components/PositionDisplay"; // adjust path if needed
import { useGameContext } from "../context/GameContext";

const { width, height } = Dimensions.get("window");
const VIEWPORT_SIZE = 10;
const CELL_SIZE = Math.min(width, height) / VIEWPORT_SIZE;

interface GameplayScreenProps {
  // No props needed since initialGameState comes from context
}

// Move deserializeState function here to avoid hoisting issues
const deserializeState = (stateString: string): GameState => {
  const state = deserializeGameState(stateString);
  return state || createInitialGameState(); // Fallback to default state if deserialization fails
};

const gameReducer = (state: GameState, action: any): GameState => {
  console.log("Reducer processing action:", action); // Debug: Log the action
  switch (action.type) {
    case "MOVE_PLAYER":
      const newState = {
        ...state,
        player: {
          ...state.player,
          position: { ...action.payload.position }, // Explicitly set the new position
        },
      };
      console.log("Reducer new state:", newState.player.position); // Debug: Log new position
      return newState;
    default:
      return state;
  }
};

export default function Game() {
  const { dispatch: contextDispatch, showDialog, setOverlay, setDeathMessage, initialGameState } = useGameContext();
  const [state, localDispatch] = useReducer(gameReducer, initialGameState ? deserializeState(initialGameState) : createInitialGameState());

  // Override dispatch to sync with local state
  const dispatch = (action: any) => {
    console.log("Dispatch called with action:", action); // Debug: Log dispatch call
    contextDispatch(action); // Propagate to context
    localDispatch(action); // Update local state
  };

  // Camera offsets
  const calculateCameraOffset = (playerPos: { row: number; col: number }) => {
    const halfViewport = Math.floor(VIEWPORT_SIZE / 2);
    return {
      offsetX: Math.max(
        0,
        Math.min(state.gridWidth - VIEWPORT_SIZE, playerPos.col - halfViewport)
      ),
      offsetY: Math.max(
        0,
        Math.min(state.gridHeight - VIEWPORT_SIZE, playerPos.row - halfViewport)
      ),
    };
  };

  const [cameraOffset, setCameraOffset] = useState(
    calculateCameraOffset(state.player.position)
  );

  useEffect(() => {
    console.log("useEffect triggered, updating camera offset:", state.player.position); // Debug: Log position update
    setCameraOffset(calculateCameraOffset(state.player.position));
  }, [state.player.position]);

  // Calculate tap direction
  const calculateDirection = (
    tapRow: number,
    tapCol: number,
    playerRow: number,
    playerCol: number
  ): "up" | "down" | "left" | "right" | null => {
    const rowDiff = tapRow - playerRow;
    const colDiff = tapCol - playerCol;

    if (Math.abs(rowDiff) > Math.abs(colDiff))
      return rowDiff < 0 ? "up" : "down";
    if (Math.abs(colDiff) > 0) return colDiff < 0 ? "left" : "right";
    return null;
  };

  const handlePress = (event: any) => {
    if (state.inCombat) return;

    const { pageX, pageY } = event.nativeEvent;
    const gridLeft = (width - VIEWPORT_SIZE * CELL_SIZE) / 2;
    const gridTop = (height - VIEWPORT_SIZE * CELL_SIZE) / 2;
    const rawCol = (pageX - gridLeft) / CELL_SIZE + cameraOffset.offsetX;
    const rawRow = (pageY - gridTop) / CELL_SIZE + cameraOffset.offsetY;
    const tapCol = Math.floor(rawCol);
    const tapRow = Math.floor(rawRow);
    const { row: playerRow, col: playerCol } = state.player.position;

    const direction = calculateDirection(tapRow, tapCol, playerRow, playerCol);
    console.log("Tap detected at:", { tapRow, tapCol }, "Direction:", direction); // Debug: Log tap and direction

    if (direction) {
      handleMovePlayer(
        state,
        dispatch,
        direction,
        setOverlay,
        showDialog,
        setDeathMessage
      );
    }
  };

  const renderGrid = () => {
    console.log("Rendering grid with player at:", state.player.position); // Debug: Log rendering position
    const tiles = [];
    for (let row = 0; row < VIEWPORT_SIZE; row++) {
      for (let col = 0; col < VIEWPORT_SIZE; col++) {
        const worldRow = row + cameraOffset.offsetY;
        const worldCol = col + cameraOffset.offsetX;
        const isPlayer =
          worldRow === state.player.position.row &&
          worldCol === state.player.position.col;

        const monsterAtPosition = state.activeMonsters.find(
          (monster: Monster) =>
            monster.position?.row === worldRow &&
            monster.position.col === worldCol
        );

        tiles.push(
          <View
            key={`${worldRow}-${worldCol}`}
            style={[
              styles.cell,
              {
                left: col * CELL_SIZE,
                top: row * CELL_SIZE,
                backgroundColor: getCellBackgroundColor(
                  worldRow,
                  worldCol,
                  isPlayer,
                  monsterAtPosition
                ),
              },
            ]}
          >
            {isPlayer && (
              <Image
                source={require("../../assets/images/christos.png")}
                style={styles.character}
                resizeMode="contain"
              />
            )}
            {monsterAtPosition && !isPlayer && (
              <Image
                source={getMonsterImage(monsterAtPosition.shortName)}
                style={styles.character}
                resizeMode="contain"
              />
            )}
          </View>
        );
      }
    }
    return tiles;
  };

  const getCellBackgroundColor = (
    row: number,
    col: number,
    isPlayer: boolean,
    hasMonster: any
  ) => {
    if (isPlayer) return "#444";
    if (hasMonster) return "#622";
    if (state.inCombat) return "#331";
    return "#111";
  };

  const getMonsterImage = (shortName: string) => {
    const monsterImages: { [key: string]: any } = {
      abhuman: require("../../assets/images/abhuman.png"),
      night_hound: require("../../assets/images/nighthound.png"),
    };
    return monsterImages[shortName] || require("../../assets/images/abhuman.png");
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.gridContainer}>{renderGrid()}</View>
          <PositionDisplay position={state.player.position} />
          {state.inCombat && (
            <View style={styles.combatOverlay}>{/* Combat UI */}</View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  gridContainer: {
    width: VIEWPORT_SIZE * CELL_SIZE,
    height: VIEWPORT_SIZE * CELL_SIZE,
    position: "relative",
    borderWidth: 2,
    borderColor: "#444",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: "absolute",
    borderWidth: 0.5,
    borderColor: "#222",
  },
  character: {
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    position: "absolute",
    left: CELL_SIZE * 0.1,
    top: CELL_SIZE * 0.1,
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