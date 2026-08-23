import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

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

interface InscriptionTextProps {
  text: string
  fontSize: number
  runic?: boolean
  testID: string
}

export function InscriptionText({ text, fontSize, runic = false, testID }: InscriptionTextProps) {
  const outlineScale = Math.max(1, Math.min(1.6, fontSize * 0.045))
  const shared = {
    fontSize,
    lineHeight: fontSize * 1.35,
    fontFamily: runic ? 'NotoSansRunic' : 'Sofia',
  }

  return (
    <View pointerEvents="none" style={styles.container} testID={testID}>
      {OUTLINE_OFFSETS.map(([x, y]) => (
        <Text
          key={`${x}-${y}`}
          style={[
            styles.text,
            styles.outline,
            shared,
            { transform: [{ translateX: x * outlineScale }, { translateY: y * outlineScale }] },
          ]}
        >
          {text}
        </Text>
      ))}
      <Text style={[styles.text, styles.face, shared]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: {
    position: 'absolute',
    width: '100%',
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  outline: {
    color: '#06111a',
    textShadowColor: 'rgba(0, 0, 0, 0.98)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  face: {
    color: '#e5fbff',
    textShadowColor: 'rgba(76, 218, 255, 0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
})
