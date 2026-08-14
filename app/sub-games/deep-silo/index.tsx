// app/sub-games/deep-silo/index.tsx
// Main entry point for the deep-silo sub-game - routes to first screen
import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function DeepSiloIndex() {
  const router = useRouter()

  useEffect(() => {
    if (__DEV__) {
      console.log('[DeepSilo] Routing to screen 1')
    }
    router.replace('/sub-games/deep-silo/screen1' as any)
  }, [router])

  return null
}
