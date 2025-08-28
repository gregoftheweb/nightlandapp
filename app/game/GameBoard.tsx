import React from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { Monster } from "@/config/types";

const { width, height } = Dimensions.get("window");

// Calculate how many cells actually fit on screen
const CELL_SIZE = 32; // Fixed cell size - adjust this to your preference
const VIEWPORT_COLS = Math.floor(width / CELL_SIZE);
const VIEWPORT_ROWS = Math.floor(height / CELL_SIZE);

interface GameBoardProps {
  state: any;
  cameraOffset: { offsetX: number; offsetY: number };
}

export default function GameBoard({ state, cameraOffset }: GameBoardProps) {
  const renderGrid = () => {
    const tiles = [];
    for (let row = 0; row < VIEWPORT_ROWS; row++) {
      for (let col = 0; col < VIEWPORT_COLS; col++) {
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
                  isPlayer,
                  monsterAtPosition,
                  state.inCombat
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

  return <View style={styles.gridContainer}>{renderGrid()}</View>;
}

const getCellBackgroundColor = (
  isPlayer: boolean,
  hasMonster: any,
  inCombat: boolean
) => {
  if (isPlayer) return "#444";
  if (hasMonster) return "#622";
  if (inCombat) return "#331";
  return "#111";
};

const getMonsterImage = (shortName: string) => {
  const monsterImages: { [key: string]: any } = {
    abhuman: require("../../assets/images/abhuman.png"),
    night_hound: require("../../assets/images/nighthound.png"),
  };
  return monsterImages[shortName] || require("../../assets/images/abhuman.png");
};

const styles = StyleSheet.create({
  gridContainer: {
    width: width,
    height: height,
    position: "relative",
    backgroundColor: "#111",
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
});

export { VIEWPORT_ROWS, VIEWPORT_COLS, CELL_SIZE };