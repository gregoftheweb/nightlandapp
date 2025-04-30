import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { gameState } from '../../config/gameState';
import { levelState } from '../../config/levelState';
import { movePlayer, calculateCameraOffset } from '../../game/gameLogic';

const { width, height } = Dimensions.get('window');
const GRID_SIZE = 10;
const CELL_SIZE = Math.min(width, height) / GRID_SIZE;

export default function GameplayScreen() {
  const [playerPosition, setPlayerPosition] = useState(gameState.player.position);
  const [cameraOffset, setCameraOffset] = useState(calculateCameraOffset(playerPosition));

  const handlePress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    console.log(`Screen dimensions: width=${width}, height=${height}`);
    console.log(`CELL_SIZE: ${CELL_SIZE}`);
    console.log(`Camera offset: x=${cameraOffset.offsetX}, y=${cameraOffset.offsetY}`);
    console.log(`Tap at screen coords: pageX=${pageX}, pageY=${pageY}`);

    // Calculate grid's top-left corner (centered on screen)
    const gridLeft = (width - GRID_SIZE * CELL_SIZE) / 2;
    const gridTop = (height - GRID_SIZE * CELL_SIZE) / 2;
    console.log(`Grid position: left=${gridLeft}, top=${gridTop}`);

    // Log raw calculations
    const rawCol = (pageX - gridLeft) / CELL_SIZE + cameraOffset.offsetX;
    const rawRow = (pageY - gridTop) / CELL_SIZE + cameraOffset.offsetY;
    console.log(`Raw grid coords: rawRow=${rawRow}, rawCol=${rawCol}`);

    // Calculate tap position in grid coordinates
    const tapCol = Math.floor(rawCol);
    const tapRow = Math.floor(rawRow);
    console.log(`Tap at grid coords: row=${tapRow}, col=${tapCol}`);

    // Get Christos' current position
    const { row: playerRow, col: playerCol } = playerPosition;
    console.log(`Player position: row=${playerRow}, col=${playerCol}`);

    let direction: 'up' | 'down' | undefined;

    // Check if tap is in the same column as Christos (with tolerance)
    if (Math.abs(tapCol - playerCol) <= 1) {
      console.log(`Row comparison: tapRow=${tapRow}, playerRow=${playerRow}`);
      // Check if tap is above or below Christos
      if (tapRow > playerRow) {
        direction = 'up'; // Tap below moves up
      } else if (tapRow < playerRow) {
        direction = 'down'; // Tap above moves down
      } else {
        console.log('Tap in same row as player, no movement');
      }
    } else {
      console.log(`Column mismatch: tapCol=${tapCol}, playerCol=${playerCol}`);
    }

    console.log(`Direction: ${direction || 'none'}`);

    if (direction) {
      const newPosition = movePlayer(direction);
      console.log(`New player position: row=${newPosition.row}, col=${newPosition.col}`);
      setPlayerPosition(newPosition);
      setCameraOffset(calculateCameraOffset(newPosition));
    }
  };

  const renderGrid = () => {
    const grid = levelState.levels[0].grid;
    const tiles = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const isPlayer = row === playerPosition.row && col === playerPosition.col;
        tiles.push(
          <View
            key={`${row}-${col}`}
            style={[
              styles.cell,
              {
                left: (col - cameraOffset.offsetX) * CELL_SIZE,
                top: (row - cameraOffset.offsetY) * CELL_SIZE,
                backgroundColor: isPlayer ? '#333' : '#111',
              },
            ]}
          >
            {isPlayer && (
              <Image
                source={require('../../assets/images/christos.png')}
                style={styles.player}
                resizeMode="contain"
              />
            )}
          </View>
        );
      }
    }
    return tiles;
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        <View style={styles.gridContainer}>{renderGrid()}</View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    width: GRID_SIZE * CELL_SIZE,
    height: GRID_SIZE * CELL_SIZE,
    position: 'relative',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#222',
  },
  player: {
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    position: 'absolute',
    left: CELL_SIZE * 0.1,
    top: CELL_SIZE * 0.1,
  },
});