// app/sub-games/_subgame-template/index.tsx
// Main entry point for the sub-game template - routes to main screen
import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useSubGameLifecycle } from '../_shared'
import { SUB_GAME_INSTANCE_ID } from './lifecycleConfig'

export default function SubGameTemplateIndex() {
  const router = useRouter()
  const lifecycle = useSubGameLifecycle(SUB_GAME_INSTANCE_ID)

  useEffect(() => {
    const route = lifecycle.resolveEntryRoute()
    if (route) router.replace(route as any)
    else void lifecycle.failSubGame()
  }, [lifecycle, router])

  return null
}
