// app/sub-games/deep-silo/index.tsx
// Main entry point for the deep-silo sub-game - routes to first screen
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useSubGameLifecycle } from '../_shared/lifecycle'

export default function DeepSiloIndex() {
  const router = useRouter()
  const lifecycle = useSubGameLifecycle('deep-silo')

  useEffect(() => {
    if (__DEV__) {
      console.log('[DeepSilo] Resolving entry route')
    }
    const route = lifecycle.resolveEntryRoute()
    if (route) router.replace(route as never)
  }, [lifecycle, router])

  return null
}
