import { calculateGameViewport } from '../viewport'
import { calculateCameraOffset } from '../utils'
import { GAMEBOARD_ZOOM_MULTIPLIERS, getRenderedGameBoardTileSize } from '../gameboardZoom'

describe('calculateGameViewport', () => {
  it('fits whole cells inside the safe area and centers the board', () => {
    expect(calculateGameViewport(390, 844, { top: 47, right: 0, bottom: 34, left: 0 })).toEqual({
      rows: 23,
      cols: 12,
      width: 384,
      height: 736,
      left: 3,
      top: 60.5,
    })
  })

  it('recalculates rows and columns for a landscape safe area', () => {
    expect(calculateGameViewport(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })).toEqual({
      rows: 11,
      cols: 23,
      width: 736,
      height: 352,
      left: 54,
      top: 8.5,
    })
  })

  it('changes rendered tile size, visible tile count, and camera edge bounds together', () => {
    const playerAtFarEdge = { row: 399, col: 399 }
    const expected = {
      Near: { tileSize: 41.6, rows: 19, cols: 9, offsetX: 391, offsetY: 381 },
      Mid: { tileSize: 32, rows: 25, cols: 12, offsetX: 388, offsetY: 375 },
      Far: { tileSize: 16, rows: 50, cols: 24, offsetX: 376, offsetY: 350 },
    }

    for (const level of ['Near', 'Mid', 'Far'] as const) {
      const tileSize = getRenderedGameBoardTileSize(32, GAMEBOARD_ZOOM_MULTIPLIERS[level])
      const viewport = calculateGameViewport(
        390,
        844,
        { top: 20, right: 0, bottom: 24, left: 0 },
        tileSize
      )
      const camera = calculateCameraOffset(playerAtFarEdge, viewport.cols, viewport.rows, 400, 400)

      expect({ tileSize, rows: viewport.rows, cols: viewport.cols, ...camera }).toEqual(
        expected[level]
      )
    }
  })

  it('never gives the camera a negative origin when the viewport exceeds a small map', () => {
    expect(calculateCameraOffset({ row: 2, col: 2 }, 20, 20, 5, 5)).toEqual({
      offsetX: 0,
      offsetY: 0,
    })
  })
})
