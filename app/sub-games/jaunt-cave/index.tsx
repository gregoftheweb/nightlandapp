// app/sub-games/jaunt-cave/index.tsx
// Main entry point for the jaunt-cave sub-game - routes to main screen
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function JauntCaveIndex() {
  const router = useRouter()

  useEffect(() => {
    if (__DEV__) {
      console.log('[jaunt-cave] Routing to main screen')
    }
    router.replace('/sub-games/jaunt-cave/main' as any)
  }, [])

  return null
}
