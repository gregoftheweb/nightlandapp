// app/sub-games/tesseract/index.tsx
// Main entry point for the tesseract sub-game - routes to main screen
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function TesseractIndex() {
  const router = useRouter()

  useEffect(() => {
    if (__DEV__) {
      console.log('[Tesseract] Routing to main screen')
    }
    router.replace('/sub-games/tesseract/main' as any)
  }, [])

  return null
}
