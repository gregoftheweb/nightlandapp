import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

import type { ObeliskWinPhase } from './useObeliskWinSequence'

interface ObeliskCompletionButtonProps {
  phase: ObeliskWinPhase
  onComplete: () => void
}

export function ObeliskCompletionButton({ phase, onComplete }: ObeliskCompletionButtonProps) {
  if (phase !== 'settled') return null

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Return to the Night Land"
      style={styles.button}
      onPress={onComplete}
    >
      <Text style={styles.text}>Return to the Night Land</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    bottom: '8%',
    zIndex: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dffaff',
    backgroundColor: '#17485e',
  },
  text: { color: '#fff', fontFamily: 'Sofia', fontSize: 13, textAlign: 'center' },
})
