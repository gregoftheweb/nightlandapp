export type GameBoardZoomLevel = 'Near' | 'Mid' | 'Far'

export const DEFAULT_GAMEBOARD_ZOOM_LEVEL: GameBoardZoomLevel = 'Mid'
export const GAMEBOARD_ZOOM_MULTIPLIERS: Record<GameBoardZoomLevel, number> = {
  Near: 1.3,
  Mid: 1,
  Far: 0.5,
}

export function getRenderedGameBoardTileSize(
  logicalTileSize: number,
  zoomMultiplier: number
): number {
  return logicalTileSize * zoomMultiplier
}

const ZOOM_LEVELS: readonly GameBoardZoomLevel[] = ['Far', 'Mid', 'Near']

export function isGameBoardZoomLevel(value: unknown): value is GameBoardZoomLevel {
  return typeof value === 'string' && ZOOM_LEVELS.includes(value as GameBoardZoomLevel)
}

export function stepGameBoardZoom(
  current: GameBoardZoomLevel,
  direction: 'in' | 'out'
): GameBoardZoomLevel {
  const currentIndex = ZOOM_LEVELS.indexOf(current)
  const delta = direction === 'in' ? 1 : -1
  const nextIndex = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, currentIndex + delta))
  return ZOOM_LEVELS[nextIndex]
}

export function screenPointToTile(
  pageX: number,
  pageY: number,
  viewportLeft: number,
  viewportTop: number,
  cameraOffset: { offsetX: number; offsetY: number },
  renderedTileSize: number
): { tapCol: number; tapRow: number } {
  return {
    tapCol: Math.floor((pageX - viewportLeft) / renderedTileSize + cameraOffset.offsetX),
    tapRow: Math.floor((pageY - viewportTop) / renderedTileSize + cameraOffset.offsetY),
  }
}
