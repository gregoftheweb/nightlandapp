export const GAME_CELL_SIZE = 32

export interface ViewportInsets {
  top: number
  right: number
  bottom: number
  left: number
}

export interface GameViewport {
  rows: number
  cols: number
  width: number
  height: number
  left: number
  top: number
}

export function calculateGameViewport(
  windowWidth: number,
  windowHeight: number,
  insets: ViewportInsets,
  cellSize: number = GAME_CELL_SIZE
): GameViewport {
  const availableWidth = Math.max(0, windowWidth - insets.left - insets.right)
  const availableHeight = Math.max(0, windowHeight - insets.top - insets.bottom)
  const cols = Math.max(1, Math.floor(availableWidth / cellSize))
  const rows = Math.max(1, Math.floor(availableHeight / cellSize))
  const width = cols * cellSize
  const height = rows * cellSize

  return {
    rows,
    cols,
    width,
    height,
    left: insets.left + (availableWidth - width) / 2,
    top: insets.top + (availableHeight - height) / 2,
  }
}
