// lib/subGames.ts
// Sub-game navigation and coordination helper

import { router } from 'expo-router'
import { SubGameResult } from '@config/types'
import { getSubGameDefinition } from '@config/subGames'
import { logIfDev } from './utils'
import {
  parsedWordGridContentResult,
  WORD_GRID_SHAPE_ADAPTER,
} from '@/app/sub-games/_shared/word-grid/contentCatalog'
import {
  parsedTimedEncounterContentResult,
  TIMED_ENCOUNTER_SHAPE_ADAPTER,
} from '@/app/sub-games/_shared/timed-encounter/contentCatalog'
import {
  CURRENT_LOOM_SHAPE_ADAPTER,
  parsedCurrentLoomContentResult,
} from '@/app/sub-games/_shared/current-loom/contentCatalog'
import { requestEncounterImagePreload } from '@components/preload/EncounterImagePreloadController'
import { resolveSubGameImageAssets } from './subGameImageAssets'

let entryAttemptGeneration = 0
let entryPreloadInFlight = false

function resolveSubGameEntryRoute(instanceId: string): string {
  if (
    parsedWordGridContentResult.success &&
    parsedWordGridContentResult.value[instanceId]?.definition.shapeId === 'word-grid'
  ) {
    return WORD_GRID_SHAPE_ADAPTER.routes(instanceId).entry
  }

  if (
    parsedTimedEncounterContentResult.success &&
    parsedTimedEncounterContentResult.value[instanceId]?.definition.shapeId === 'timed-encounter'
  ) {
    return TIMED_ENCOUNTER_SHAPE_ADAPTER.routes(instanceId).entry
  }

  if (
    parsedCurrentLoomContentResult.success &&
    parsedCurrentLoomContentResult.value[instanceId]?.definition.shapeId === 'current-loom'
  ) {
    return CURRENT_LOOM_SHAPE_ADAPTER.routes(instanceId).entry
  }

  return getSubGameDefinition(instanceId).entryRoute
}

/**
 * Enter a sub-game by navigating to its intro route from the registry
 * @param instanceId - Stable registered encounter identifier (e.g., 'word-tile-crypt-01')
 * @param context - Optional context data (e.g., objectId)
 */
export function enterSubGame(instanceId: string, context?: { objectId?: string }) {
  if (entryPreloadInFlight) {
    logIfDev(`⏳ Ignoring repeated sub-game entry while images preload: ${instanceId}`)
    return
  }

  logIfDev(`🎯 Entering sub-game instance: ${instanceId}`, context)
  const route = resolveSubGameEntryRoute(instanceId)
  const assets = resolveSubGameImageAssets(instanceId)
  const attempt = ++entryAttemptGeneration
  entryPreloadInFlight = true

  void requestEncounterImagePreload(assets).then((result) => {
    if (attempt !== entryAttemptGeneration) return
    entryPreloadInFlight = false
    if (__DEV__ && result.reason !== 'loaded') {
      console.warn(`[sub-game preload] Continuing into '${instanceId}'`, result)
    }
    router.replace(route as any)
  })
}

/**
 * Exit a sub-game and return to the RPG
 * @param result - Optional result data from the sub-game
 */
export function exitSubGame(result?: SubGameResult) {
  logIfDev(`🔙 Exiting sub-game`, result)

  // Invalidate any late preload completion before navigating elsewhere.
  entryAttemptGeneration += 1
  entryPreloadInFlight = false
  router.replace('/game')
}

export function resetSubGameEntryStateForTests() {
  entryAttemptGeneration += 1
  entryPreloadInFlight = false
}

/**
 * Signal the RPG to refresh/resume after returning from a sub-game
 * This is handled via the resume nonce in GameContext
 */
export function signalRpgResume() {
  logIfDev('▶️  Signaling RPG resume')
  // The resume signal is managed by incrementing resumeNonce in GameContext
  // This will be triggered by the sub-game when it exits
}
