// app/sub-games/tesseract/tiles.ts
// Tile grid configuration and utilities for tesseract puzzle board

/**
 * Tile represents a single cell in the 5x5 puzzle grid
 */
export interface Tile {
  id: string
  row: number
  col: number
  // Normalized coordinates (0..1) relative to the full image
  left: number
  top: number
  right: number
  bottom: number
  // Pixel coordinates relative to the image container
  // (set when image size is known)
  leftPx?: number
  topPx?: number
  rightPx?: number
  bottomPx?: number
  widthPx?: number
  heightPx?: number
}

/**
 * GridRect defines the normalized bounds of the inner tile field
 * within the puzzle board image.
 * 
 * IMPORTANT: These values are tuned to match teseract-puzzle-board.png
 * The 5x5 letter tile area does NOT extend to the image edges.
 * There is an outer stone/brick border and margin.
 * 
 * Coordinates are normalized 0..1 relative to the full image bounds.
 */
export interface GridRect {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * GRID_RECT: The calibrated inner grid bounds
 * 
 * These values define where the letter tile field sits within the puzzle board image.
 * Tuned to match the visual layout of teseract-puzzle-board.png
 * 
 * The puzzle board has a stone/brick border around a 5x5 grid of letter tiles.
 * These normalized coordinates (0..1) define the bounds of the inner tile field:
 * - left: 0.095 (~9.5% from left edge to start of first tile column)
 * - top: 0.29 (~29% from top edge to start of first tile row)
 * - right: 0.90 (~10% from right edge to end of last tile column)
 * - bottom: 0.70 (~30% from bottom edge to end of last tile row)
 * 
 * Note: These values were visually calibrated using DEBUG mode in screen2.tsx.
 */
export const GRID_RECT: GridRect = {
  left: 0.095,
  top: 0.29,
  right: 0.90,
  bottom: 0.70,
}

/**
 * Generate the 25 tiles by subdividing the gridRect into a rows x cols grid
 * 
 * @param gridRect - The normalized inner grid bounds
 * @param rows - Number of rows (default: 5)
 * @param cols - Number of columns (default: 5)
 * @param gapN - Optional normalized gap between tiles (default: 0)
 * @returns Array of 25 Tile objects with normalized coordinates
 */
export function generateTilesFromGridRect(
  gridRect: GridRect,
  rows: number = 5,
  cols: number = 5,
  gapN: number = 0
): Tile[] {
  const tiles: Tile[] = []
  
  // Calculate grid dimensions within the gridRect
  const gridWidth = gridRect.right - gridRect.left
  const gridHeight = gridRect.bottom - gridRect.top
  
  // Calculate tile dimensions (including gap)
  const tileW = gridWidth / cols
  const tileH = gridHeight / rows
  
  // Generate tiles row by row
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tileIndex = row * cols + col
      
      // Calculate normalized coordinates
      const left = gridRect.left + col * tileW + gapN
      const top = gridRect.top + row * tileH + gapN
      const right = gridRect.left + (col + 1) * tileW - gapN
      const bottom = gridRect.top + (row + 1) * tileH - gapN
      
      tiles.push({
        id: `tile-${row}-${col}`,
        row,
        col,
        left,
        top,
        right,
        bottom,
      })
    }
  }
  
  return tiles
}

/**
 * Convert normalized tile coordinates to pixel coordinates
 * based on the actual rendered image dimensions
 * 
 * @param tiles - Array of tiles with normalized coordinates
 * @param imageWidth - Actual rendered image width in pixels
 * @param imageHeight - Actual rendered image height in pixels
 * @returns Array of tiles with pixel coordinates added
 */
export function tilesToPixelCoords(
  tiles: Tile[],
  imageWidth: number,
  imageHeight: number
): Tile[] {
  return tiles.map(tile => ({
    ...tile,
    leftPx: tile.left * imageWidth,
    topPx: tile.top * imageHeight,
    rightPx: tile.right * imageWidth,
    bottomPx: tile.bottom * imageHeight,
    widthPx: (tile.right - tile.left) * imageWidth,
    heightPx: (tile.bottom - tile.top) * imageHeight,
  }))
}

/**
 * Find which tile (if any) contains the given point
 * 
 * @param tiles - Array of tiles with pixel coordinates
 * @param x - X coordinate in pixels (relative to image)
 * @param y - Y coordinate in pixels (relative to image)
 * @returns The tile containing the point, or null if none
 */
export function getTileAtPoint(tiles: Tile[], x: number, y: number): Tile | null {
  for (const tile of tiles) {
    if (
      tile.leftPx !== undefined &&
      tile.topPx !== undefined &&
      tile.rightPx !== undefined &&
      tile.bottomPx !== undefined &&
      x >= tile.leftPx &&
      x <= tile.rightPx &&
      y >= tile.topPx &&
      y <= tile.bottomPx
    ) {
      return tile
    }
  }
  return null
}
