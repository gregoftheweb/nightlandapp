import React from 'react'
import { render } from '@testing-library/react-native'

import { WordGridLetterOverlay } from '../WordGridLetterOverlay'
import { parsedWordGridContentResult } from '../contentCatalog'
import { generateWordGridTiles, wordGridTilesToPixels } from '../geometry'

describe('WordGridLetterOverlay', () => {
  it.each([
    ['word-tile-crypt-01', ['ZTVAN', 'LGREY', 'WPSTH', 'DITOM', 'ECHRS']],
    ['word-tile-crypt-02', ['QAVNF', 'MXEBA', 'ULCYR', 'AHDJP', 'GSOAK']],
  ])('renders the authored letters for %s at the hit-test tile positions', (instanceId, rows) => {
    expect(parsedWordGridContentResult.success).toBe(true)
    if (!parsedWordGridContentResult.success) return

    const config = parsedWordGridContentResult.value[instanceId].shapeConfig
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
    const view = render(<WordGridLetterOverlay tiles={tiles} offsetX={3} offsetY={7} />)

    expect(tiles.map((tile) => tile.letter).join('')).toBe(rows.join(''))
    expect(view.getAllByTestId(/^word-grid-letter-/)).toHaveLength(25)

    const firstTile = tiles[0]
    expect(view.getByTestId('word-grid-letter-0-0').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          left: (firstTile.leftPx ?? 0) + 3,
          top: (firstTile.topPx ?? 0) + 7,
          width: firstTile.widthPx,
          height: firstTile.heightPx,
        }),
      ])
    )
  })
})
