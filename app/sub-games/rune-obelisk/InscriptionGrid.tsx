import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const ROW_RANGES = [
  [0, 6],
  [6, 11],
  [11, 17],
  [17, 22],
  [22, 26],
] as const

const MAX_ROW_LENGTH = 6

interface InscriptionGridProps {
  text: string
  fontSize: number
  runic?: boolean
  testID: string
}

export function splitInscriptionGrid(text: string): string[] {
  return ROW_RANGES.map(([start, end]) => text.slice(start, end))
}

export function InscriptionGrid({ text, fontSize, runic = false, testID }: InscriptionGridProps) {
  return (
    <View pointerEvents="none" style={styles.grid} testID={testID}>
      {splitInscriptionGrid(text).map((row, rowIndex) => (
        <View
          key={rowIndex}
          testID={`${testID}-row-${rowIndex + 1}`}
          style={[styles.row, { width: `${(row.length / MAX_ROW_LENGTH) * 100}%` }]}
        >
          {[...row].map((character, columnIndex) => (
            <View
              key={`${rowIndex}-${columnIndex}`}
              testID={`${testID}-cell-${rowIndex}-${columnIndex}`}
              style={styles.cell}
            >
              <Text
                style={[
                  styles.character,
                  {
                    fontSize,
                    lineHeight: fontSize * 1.12,
                    fontFamily: runic ? 'NotoSansRunic' : 'Sofia',
                  },
                ]}
              >
                {character}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flex: 1, width: '88%', alignSelf: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignSelf: 'center', justifyContent: 'center' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  character: {
    color: '#e5fbff',
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
    textShadowColor: '#06111a',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
})
