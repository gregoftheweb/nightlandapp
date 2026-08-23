import React from 'react'
import { StyleSheet } from 'react-native'
import { render } from '@testing-library/react-native'

import { InscriptionGrid, splitInscriptionGrid } from '../InscriptionGrid'
import { toRunicInscription } from '../puzzleState'

describe('InscriptionGrid', () => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  test('splits every position exactly once into fixed 6/5/6/5/4 rows', () => {
    const rows = splitInscriptionGrid(alphabet)
    expect(rows).toEqual(['ABCDEF', 'GHIJK', 'LMNOPQ', 'RSTUV', 'WXYZ'])
    expect(rows.join('')).toBe(alphabet)
    expect(rows.reduce((count, row) => count + row.length, 0)).toBe(26)
  })

  test.each([
    ['english', alphabet, false],
    ['rune', toRunicInscription(alphabet), true],
  ] as const)('renders the correct fixed rows for the %s panel', (testID, text, runic) => {
    const screen = render(
      <InscriptionGrid text={text} fontSize={18} runic={runic} testID={testID} />
    )
    const expectedRows = splitInscriptionGrid(text)

    expectedRows.forEach((row, index) => {
      expect(screen.getByTestId(`${testID}-row-${index + 1}`).props.children).toHaveLength(
        row.length
      )
    })
    expectedRows.forEach((row, index) => {
      expect(
        StyleSheet.flatten(screen.getByTestId(`${testID}-row-${index + 1}`).props.style)
      ).toEqual(
        expect.objectContaining({
          width: `${(row.length / 6) * 100}%`,
          alignSelf: 'center',
        })
      )
    })
  })
})
