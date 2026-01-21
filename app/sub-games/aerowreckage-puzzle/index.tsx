// app/sub-games/aerowreckage-puzzle/index.tsx
// Main entry point for the aerowreckage puzzle - routes to appropriate screen
import React, { useEffect } from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { usePuzzleState } from './hooks/usePuzzleState'
import { THEME } from './theme'

export default function AeroWreckagePuzzleIndex() {
  const router = useRouter()
  const { state, isLoading } = usePuzzleState()

  useEffect(() => {
    if (!isLoading) {
      if (state.isOpened) {
        // If puzzle already completed, go to success screen
        if (__DEV__) {
          console.log('[AeroWreckagePuzzle] Puzzle already opened, routing to success')
        }
        router.replace('/sub-games/aerowreckage-puzzle/success' as any)
      } else {
        // Otherwise, go to the new entry screen
        if (__DEV__) {
          console.log('[AeroWreckagePuzzle] Routing to entry screen')
        }
        router.replace('/sub-games/aerowreckage-puzzle/entry' as any)
      }
    }
  }, [isLoading, state.isOpened])

  // Show loading while determining route
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={THEME.brass} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    color: THEME.textSecondary,
  },
})
