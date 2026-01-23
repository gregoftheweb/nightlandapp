// app/sub-games/aerowreckage-puzzle/rear-entry.tsx
// Screen [A]: Rear section entry - safe discovery screen
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { usePuzzleState } from './hooks/usePuzzleState'
import { THEME } from './theme'

const bgIntro = require('@/assets/images/aerowreck-safe1.png')

export default function AeroWreckageRearEntry() {
  const router = useRouter()
  const { resetPuzzle } = usePuzzleState()

  const handleAttemptOpen = () => {
    if (__DEV__) {
      console.log('[AeroWreckageRearEntry] Attempting to open safe')
    }
    router.push('/sub-games/aerowreckage-puzzle/safe' as any)
  }

  const handleLeaveTreasure = () => {
    if (__DEV__) {
      console.log('[AeroWreckageRearEntry] Leaving treasure untouched, returning to entry')
    }
    router.back()
  }

  const handleResetPuzzle = async () => {
    if (__DEV__) {
      console.log('[AeroWreckageRearEntry] Resetting puzzle for testing')
    }
    await resetPuzzle()
    router.replace('/sub-games/aerowreckage-puzzle/entry' as any)
  }

  return (
    <BackgroundImage source={bgIntro}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <Text style={styles.flavorText}>
            Christos finds a dust covered safe under some strewn wreckage of the ancient craft.
          </Text>
          <Text style={styles.flavorTextSecondary}>Christos ponders the treasure within?</Text>
        </View>

        <BottomActionBar>
          {__DEV__ && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPuzzle}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>🔄 Reset Puzzle (Dev Only)</Text>
            </TouchableOpacity>
          )}

          <View style={styles.buttonRow}>
          

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLeaveTreasure}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Leave It</Text>
            </TouchableOpacity>

              <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAttemptOpen}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Open It</Text>
            </TouchableOpacity>
          </View>
        </BottomActionBar>
      </View>
    </BackgroundImage>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 20,
  },
  flavorText: {
    fontSize: 18,
    color: THEME.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  flavorTextSecondary: {
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: subGameTheme.red,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    shadowColor: subGameTheme.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: subGameTheme.black,
    textAlign: 'center',
  },
  resetButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: subGameTheme.blue,
    marginBottom: 10,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: subGameTheme.blue,
    textAlign: 'center',
  },
})
