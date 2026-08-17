import {
  generateWordGridTiles,
  getWordGridTileAtPoint,
  validateWordGridGeometry,
  wordGridTilesToPixels,
} from '../../_shared/word-grid/geometry'
import { tesseractWordGridConfig } from '../wordGridConfig'

describe('Tesseract word-grid instance geometry', () => {
  it('retains the calibrated 5x5 grid and exact letters', () => {
    const config = tesseractWordGridConfig
    expect(() =>
      validateWordGridGeometry(config.gridRect, config.rows, config.columns, config.letters)
    ).not.toThrow()

    const tiles = generateWordGridTiles(
      config.gridRect,
      config.rows,
      config.columns,
      config.gap,
      config.letters
    )
    expect(tiles).toHaveLength(25)
    expect(tiles.map((tile) => tile.letter)).toEqual(config.letters.flat())
    expect(tiles[0]).toMatchObject({ id: 'tile-0-0', row: 0, col: 0, letter: 'Z' })
    expect(tiles[24]).toMatchObject({ id: 'tile-4-4', row: 4, col: 4, letter: 'S' })
  })

  it('retains normalized-to-pixel hit testing', () => {
    const config = tesseractWordGridConfig
    const tiles = wordGridTilesToPixels(
      generateWordGridTiles(
        config.gridRect,
        config.rows,
        config.columns,
        config.gap,
        config.letters
      ),
      config.intrinsicSize.width,
      config.intrinsicSize.height
    )
    const target = tiles[12]
    const hit = getWordGridTileAtPoint(
      tiles,
      ((target.leftPx ?? 0) + (target.rightPx ?? 0)) / 2,
      ((target.topPx ?? 0) + (target.bottomPx ?? 0)) / 2
    )

    expect(hit).toBe(target)
    expect(getWordGridTileAtPoint(tiles, 0, 0)).toBeNull()
  })
})
