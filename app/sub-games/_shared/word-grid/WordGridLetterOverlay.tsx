import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import type { WordGridTile } from './types'

const OUTLINE_OFFSETS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const

interface WordGridLetterOverlayProps {
  tiles: readonly WordGridTile[]
  offsetX: number
  offsetY: number
}

export function WordGridLetterOverlay({ tiles, offsetX, offsetY }: WordGridLetterOverlayProps) {
  return (
    <>
      {tiles.map((tile) => {
        const width = tile.widthPx ?? 0
        const height = tile.heightPx ?? 0
        const fontSize = Math.max(12, Math.min(width, height) * 0.48)
        const outlineScale = Math.max(1, Math.min(1.6, fontSize * 0.045))

        return (
          <View
            key={`letter-${tile.id}`}
            testID={`word-grid-letter-${tile.row}-${tile.col}`}
            pointerEvents="none"
            style={[
              styles.letterCell,
              {
                left: (tile.leftPx ?? 0) + offsetX,
                top: (tile.topPx ?? 0) + offsetY,
                width,
                height,
              },
            ]}
          >
            {OUTLINE_OFFSETS.map(([x, y]) => (
              <Text
                key={`${x}-${y}`}
                style={[
                  styles.letter,
                  styles.letterOutline,
                  {
                    fontSize,
                    lineHeight: fontSize * 1.08,
                    transform: [{ translateX: x * outlineScale }, { translateY: y * outlineScale }],
                  },
                ]}
              >
                {tile.letter}
              </Text>
            ))}
            <Text
              style={[styles.letter, styles.letterFace, { fontSize, lineHeight: fontSize * 1.08 }]}
            >
              {tile.letter}
            </Text>
          </View>
        )
      })}
    </>
  )
}

const styles = StyleSheet.create({
  letterCell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    position: 'absolute',
    color: '#dff8ff',
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    includeFontPadding: false,
  },
  letterOutline: {
    color: '#071522',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  letterFace: {
    color: '#dff8ff',
    textShadowColor: 'rgba(74, 205, 255, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
})
