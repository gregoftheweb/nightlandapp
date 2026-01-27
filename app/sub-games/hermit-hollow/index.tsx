// app/sub-games/hermit-hollow/index.tsx
// Main entry point for the hermit-hollow sub-game - routes to main screen
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function HermitHollowIndex() {
  const router = useRouter()

  useEffect(() => {
    if (__DEV__) {
      console.log('[HermitHollow] Routing to main screen')
    }
    router.replace('/sub-games/hermit-hollow/main' as any)
  }, [])

  return null
}
