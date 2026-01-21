// app/sub-games/aerowreckage-puzzle/components/InstructionOverlay.tsx
// Flavor text and instructions

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { THEME } from '../theme'

interface InstructionOverlayProps {
  isOpened: boolean
}

export function InstructionOverlay({ isOpened }: InstructionOverlayProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Dead Dial</Text>
      <Text style={styles.description}>
        {isOpened
          ? 'The ancient safe groans open, revealing a faint luminescence within...'
          : 'An art-deco safe, its brass dial cold to the touch. Three numbers, each requiring a direction change. Listen for the click.'}
      </Text>
      {!isOpened && (
        <Text style={styles.hint}>
          Rotate the dial slowly. Pause on each target number until you feel the lock engage.
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.brassDark,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.brassLight,
    marginBottom: 12,
    letterSpacing: 2,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: THEME.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
})
