// app/sub-games/tesseract/index.tsx
// Main entry point for the tesseract sub-game - routes to main screen
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useGameContext } from '@/context/GameContext'

const SUB_GAME_NAME = 'tesseract'

export default function TesseractIndex() {
  const router = useRouter()
  const { state } = useGameContext()

  useEffect(() => {
    // Check if tesseract is already completed
    const isCompleted = state.subGamesCompleted?.[SUB_GAME_NAME] === true

    if (isCompleted) {
      if (__DEV__) {
        console.log('[Tesseract] Already completed - routing to success screen')
      }
      // If already completed, go directly to the success screen
      router.replace('/sub-games/tesseract/screen4' as any)
    } else {
      if (__DEV__) {
        console.log('[Tesseract] Not completed - routing to main screen')
      }
      router.replace('/sub-games/tesseract/main' as any)
    }
  }, [router, state.subGamesCompleted])

  return null
}
