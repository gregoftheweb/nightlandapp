// app/sub-games/aerowreckage-puzzle/index.tsx
import React, { useEffect, useRef } from 'react'
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { usePuzzleState } from './hooks/usePuzzleState'
import { THEME } from './theme'

export default function AeroWreckagePuzzleIndex() {
  const router = useRouter()
  const { isLoading } = usePuzzleState()

  const didRouteRef = useRef(false)

  useEffect(() => {
    if (didRouteRef.current) return
    if (isLoading) return

    didRouteRef.current = true

    if (__DEV__) console.log('[AeroWreckagePuzzle] Routing to entry (always)')
    router.replace('/sub-games/aerowreckage-puzzle/entry' as any)
  }, [isLoading, router])

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
