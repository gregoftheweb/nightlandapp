// app/sub-games/tesseract/__tests__/tiles.test.ts
import {
  GRID_RECT,
  generateTilesFromGridRect,
  tilesToPixelCoords,
  getTileAtPoint,
  type Tile,
} from '../tiles'

describe('Tesseract Tiles', () => {
  describe('GRID_RECT', () => {
    it('should have valid normalized coordinates', () => {
      expect(GRID_RECT.left).toBeGreaterThanOrEqual(0)
      expect(GRID_RECT.left).toBeLessThan(1)
      expect(GRID_RECT.top).toBeGreaterThanOrEqual(0)
      expect(GRID_RECT.top).toBeLessThan(1)
      expect(GRID_RECT.right).toBeGreaterThan(0)
      expect(GRID_RECT.right).toBeLessThanOrEqual(1)
      expect(GRID_RECT.bottom).toBeGreaterThan(0)
      expect(GRID_RECT.bottom).toBeLessThanOrEqual(1)
    })

    it('should have right > left and bottom > top', () => {
      expect(GRID_RECT.right).toBeGreaterThan(GRID_RECT.left)
      expect(GRID_RECT.bottom).toBeGreaterThan(GRID_RECT.top)
    })
  })

  describe('generateTilesFromGridRect', () => {
    it('should generate 25 tiles for a 5x5 grid', () => {
      const tiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)
      expect(tiles).toHaveLength(25)
    })

    it('should generate tiles with correct row and column indices', () => {
      const tiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)

      // Check first tile (0,0)
      expect(tiles[0].row).toBe(0)
      expect(tiles[0].col).toBe(0)
      expect(tiles[0].id).toBe('tile-0-0')

      // Check last tile (4,4)
      expect(tiles[24].row).toBe(4)
      expect(tiles[24].col).toBe(4)
      expect(tiles[24].id).toBe('tile-4-4')

      // Check middle tile (2,2)
      const middleTile = tiles.find((t) => t.row === 2 && t.col === 2)
      expect(middleTile).toBeDefined()
      expect(middleTile?.id).toBe('tile-2-2')
    })

    it('should generate tiles within the grid rect bounds', () => {
      const tiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)

      tiles.forEach((tile) => {
        expect(tile.left).toBeGreaterThanOrEqual(GRID_RECT.left)
        expect(tile.right).toBeLessThanOrEqual(GRID_RECT.right)
        expect(tile.top).toBeGreaterThanOrEqual(GRID_RECT.top)
        expect(tile.bottom).toBeLessThanOrEqual(GRID_RECT.bottom)
      })
    })

    it('should respect gap parameter', () => {
      const gap = 0.01
      const tiles = generateTilesFromGridRect(GRID_RECT, 5, 5, gap)

      // Tiles should be slightly smaller due to gap
      const tilesNoGap = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)

      expect(tiles[0].right - tiles[0].left).toBeLessThan(tilesNoGap[0].right - tilesNoGap[0].left)
    })

    it('should generate tiles in row-major order', () => {
      const tiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)

      // First row should be indices 0-4
      expect(tiles[0].row).toBe(0)
      expect(tiles[4].row).toBe(0)
      expect(tiles[4].col).toBe(4)

      // Second row should be indices 5-9
      expect(tiles[5].row).toBe(1)
      expect(tiles[5].col).toBe(0)
      expect(tiles[9].row).toBe(1)
      expect(tiles[9].col).toBe(4)
    })
  })

  describe('tilesToPixelCoords', () => {
    it('should convert normalized coords to pixel coords', () => {
      const tiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)
      const imageWidth = 1000
      const imageHeight = 1000

      const pixelTiles = tilesToPixelCoords(tiles, imageWidth, imageHeight)

      expect(pixelTiles[0].leftPx).toBe(tiles[0].left * imageWidth)
      expect(pixelTiles[0].topPx).toBe(tiles[0].top * imageHeight)
      expect(pixelTiles[0].rightPx).toBe(tiles[0].right * imageWidth)
      expect(pixelTiles[0].bottomPx).toBe(tiles[0].bottom * imageHeight)
    })

    it('should calculate width and height in pixels', () => {
      const tiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)
      const imageWidth = 1000
      const imageHeight = 1000

      const pixelTiles = tilesToPixelCoords(tiles, imageWidth, imageHeight)

      expect(pixelTiles[0].widthPx).toBe((tiles[0].right - tiles[0].left) * imageWidth)
      expect(pixelTiles[0].heightPx).toBe((tiles[0].bottom - tiles[0].top) * imageHeight)
    })
  })

  describe('getTileAtPoint', () => {
    it('should return tile when point is inside tile bounds', () => {
      const tiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)
      const pixelTiles = tilesToPixelCoords(tiles, 1000, 1000)

      // Get first tile and test a point in its center
      const firstTile = pixelTiles[0]
      const centerX = (firstTile.leftPx! + firstTile.rightPx!) / 2
      const centerY = (firstTile.topPx! + firstTile.bottomPx!) / 2

      const result = getTileAtPoint(pixelTiles, centerX, centerY)
      expect(result).toBe(firstTile)
    })

    it('should return null when point is outside all tiles', () => {
      const tiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)
      const pixelTiles = tilesToPixelCoords(tiles, 1000, 1000)

      // Test point at (0, 0) which should be in the border area
      const result = getTileAtPoint(pixelTiles, 0, 0)
      expect(result).toBeNull()
    })

    it('should return correct tile for different grid positions', () => {
      const tiles = generateTilesFromGridRect(GRID_RECT, 5, 5, 0)
      const pixelTiles = tilesToPixelCoords(tiles, 1000, 1000)

      // Test middle tile (2, 2) - should be at index 12
      const middleTile = pixelTiles[12]
      const centerX = (middleTile.leftPx! + middleTile.rightPx!) / 2
      const centerY = (middleTile.topPx! + middleTile.bottomPx!) / 2

      const result = getTileAtPoint(pixelTiles, centerX, centerY)
      expect(result?.row).toBe(2)
      expect(result?.col).toBe(2)
    })
  })
})
