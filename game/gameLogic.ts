import { gameState } from '../config/gameState';

export const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
  const { row, col } = gameState.player.position;
  const newPosition = { row, col };

  switch (direction) {
    case 'up':
      if (row > 0) newPosition.row -= 1;
      break;
    case 'down':
      if (row < gameState.gameBoardSize.rows - 1) newPosition.row += 1;
      break;
    case 'left':
      if (col > 0) newPosition.col -= 1;
      break;
    case 'right':
      if (col < gameState.gameBoardSize.cols - 1) newPosition.col += 1;
      break;
  }

  gameState.player.position = newPosition;
  return newPosition;
};

export const calculateCameraOffset = (playerPos: { row: number; col: number }) => {
  const { rows, cols } = gameState.gameBoardSize;
  const viewportSize = { width: 10, height: 10 }; // 10x10 grid visible

  // Center camera on player, but clamp to grid edges
  const offsetX = Math.max(
    0,
    Math.min(cols - viewportSize.width, playerPos.col - Math.floor(viewportSize.width / 2))
  );
  const offsetY = Math.max(
    0,
    Math.min(rows - viewportSize.height, playerPos.row - Math.floor(viewportSize.height / 2))
  );

  console.log(`Calculate camera: playerPos.row=${playerPos.row}, playerPos.col=${playerPos.col}, rows=${rows}, cols=${cols}, offsetX=${offsetX}, offsetY=${offsetY}`);

  return { offsetX, offsetY };
};