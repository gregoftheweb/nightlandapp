import {
  generateWordGridTiles,
  getWordGridTileAtPoint,
  validateWordGridGeometry,
  wordGridTilesToPixels,
} from '../geometry'
import { appendWordGridLetter } from '../sequence'

const testGrid = {
  rect: { left: 0.1, top: 0.2, right: 0.9, bottom: 0.8 },
  rows: 2,
  columns: 3,
  gap: 0.01,
  letters: [
    ['N', 'I', 'G'],
    ['H', 'T', 'X'],
  ],
  target: ['N', 'I', 'G', 'H', 'T'],
} as const

describe('generic word-grid shape logic', () => {
  it('generates configured geometry and performs hit testing without game-specific data', () => {
    expect(() =>
      validateWordGridGeometry(testGrid.rect, testGrid.rows, testGrid.columns, testGrid.letters)
    ).not.toThrow()
    const normalized = generateWordGridTiles(
      testGrid.rect,
      testGrid.rows,
      testGrid.columns,
      testGrid.gap,
      testGrid.letters
    )
    expect(normalized).toHaveLength(6)
    expect(normalized.map((tile) => tile.letter)).toEqual(['N', 'I', 'G', 'H', 'T', 'X'])

    const pixels = wordGridTilesToPixels(normalized, 600, 400)
    const tile = pixels[4]
    expect(
      getWordGridTileAtPoint(
        pixels,
        ((tile.leftPx ?? 0) + (tile.rightPx ?? 0)) / 2,
        ((tile.topPx ?? 0) + (tile.bottomPx ?? 0)) / 2
      )
    ).toBe(tile)
  })

  it('matches a configured target sequence and rejects a mismatch', () => {
    let sequence: string[] = []
    for (const [index, letter] of testGrid.target.entries()) {
      const result = appendWordGridLetter(sequence, letter, testGrid.target)
      sequence = result.sequence
      expect(result.outcome).toBe(index === testGrid.target.length - 1 ? 'success' : 'continue')
    }
    expect(appendWordGridLetter(['N'], 'X', testGrid.target).outcome).toBe('failure')
  })

  it('rejects a letter matrix that does not match configured dimensions', () => {
    expect(() => validateWordGridGeometry(testGrid.rect, 2, 2, testGrid.letters)).toThrow(
      'must exactly match'
    )
  })
})
