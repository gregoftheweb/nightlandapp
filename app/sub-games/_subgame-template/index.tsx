// app/sub-games/_subgame-template/index.tsx
// Main entry point for the sub-game template - routes to main screen
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function SubGameTemplateIndex() {
  const router = useRouter()

  useEffect(() => {
    if (__DEV__) {
      console.log('[SubGameTemplate] Routing to main screen')
    }
    router.replace('/sub-games/_subgame-template/main' as any)
  }, [])

  return null
}
