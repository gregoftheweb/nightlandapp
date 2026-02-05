// app/sub-games/aerowreckage-puzzle/entry.tsx
// Screen [1]: New main entry screen - fuselage interior with 3-way choice
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { exitSubGame } from '@modules/subGames'
import { BackgroundImage } from '../_shared/BackgroundImage'
import { BottomActionBar } from '../_shared/BottomActionBar'
import { subGameTheme } from '../_shared/subGameTheme'
import { usePuzzleState } from './hooks/usePuzzleState'
import { THEME } from './theme'

const bgFuselage = require('@assets/images/backgrounds/subgames/aerowreck-safe4.webp')

export default function AeroWreckageEntry() {
  const router = useRouter()
  const { resetPuzzle } = usePuzzleState()

  const handleExploreCockpit = () => {
    if (__DEV__) {
      console.log('[AeroWreckageEntry] Exploring cockpit')
    }
    router.push('/sub-games/aerowreckage-puzzle/cockpit' as any)
  }

  const handleExitWithoutExploring = () => {
    if (__DEV__) {
      console.log('[AeroWreckageEntry] Exiting without exploring')
    }
    exitSubGame({ completed: false })
  }

  const handleExploreRear = () => {
    if (__DEV__) {
      console.log('[AeroWreckageEntry] Exploring rear section')
    }
    router.push('/sub-games/aerowreckage-puzzle/rear-entry' as any)
  }

  const handleResetPuzzle = async () => {
    if (__DEV__) {
      console.log('[AeroWreckageEntry] Resetting puzzle for testing')
    }
    await resetPuzzle()
    // Stay on entry screen after reset
  }

  return (
    <BackgroundImage source={bgFuselage}>
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <View
            style={{
              flex: 1,
              alignSelf: 'stretch',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              paddingTop: '10%',
            }}
          >
            <Text style={styles.flavorText}>
              Christos stands in the ruined interior of an ancient aerocraft. The hull is torn open
              in places, revealing glimpses of the desolate wasteland beyond. Ancient panels hang
              askew, brass fittings dulled by ages of dust. Wires dangle from broken fixtures, and
              holes in the fuselage let in an eerie silence broken only by distant winds.
            </Text>
          </View>
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
              onPress={handleExploreCockpit}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Explore cockpit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleExitWithoutExploring}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Exit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleExploreRear}
              activeOpacity={0.7}
            >
              <Text style={styles.primaryButtonText}>Explore the rear</Text>
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
