import React, { useEffect, useState } from 'react'

import {
  HiddenImagePreloader,
  type ImagePreloadAsset,
  type ImagePreloadResult,
} from './HiddenImagePreloader'

export const ENCOUNTER_IMAGE_PRELOAD_TIMEOUT_MS = 4_000

interface PreloadRequest {
  requestId: number
  assets: readonly ImagePreloadAsset[]
  resolve: (result: ImagePreloadResult) => void
}

let nextRequestId = 0
let currentRequest: PreloadRequest | null = null
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export function requestEncounterImagePreload(
  assets: readonly ImagePreloadAsset[]
): Promise<ImagePreloadResult> {
  return new Promise((resolve) => {
    currentRequest?.resolve({ reason: 'timeout', loadedCount: 0, failedIds: [] })
    currentRequest = { requestId: ++nextRequestId, assets, resolve }
    notifyListeners()
  })
}

export function EncounterImagePreloadController() {
  const [, rerender] = useState(0)

  useEffect(() => {
    const listener = () => rerender((value) => value + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const request = currentRequest
  if (!request) return null

  return (
    <HiddenImagePreloader
      key={request.requestId}
      assets={request.assets}
      timeoutMs={ENCOUNTER_IMAGE_PRELOAD_TIMEOUT_MS}
      testIDPrefix="encounter-preload"
      warningPrefix="[sub-game preload]"
      onReady={(result) => {
        if (currentRequest?.requestId !== request.requestId) return
        currentRequest = null
        request.resolve(result)
        notifyListeners()
      }}
    />
  )
}

export function resetEncounterImagePreloadControllerForTests() {
  currentRequest = null
  nextRequestId = 0
  notifyListeners()
}
