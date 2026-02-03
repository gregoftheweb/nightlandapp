// modules/autoSave.ts
/**
 * Autosave Controller
 *
 * Manages automatic saving of the current game state with throttling
 * to avoid performance degradation.
 *
 * Features:
 * - Throttled saves (max once per 2 seconds)
 * - Dirty flag tracking to avoid unnecessary saves
 * - Non-blocking async saves
 * - Mutex to prevent overlapping writes
 */

import { GameState } from '@/config/types'
import { saveCurrentGame } from './saveGame'

let saveTimeout: ReturnType<typeof setTimeout> | null = null
let isSaving = false
let pendingSave = false

const SAVE_THROTTLE_MS = 2000 // Save at most once per 2 seconds

/**
 * Request an autosave of the current game state.
 * This is throttled and non-blocking.
 *
 * @param state - The current game state
 */
export function requestAutoSave(state: GameState): void {
  // Mark that we have a pending save
  pendingSave = true

  if (__DEV__) {
    console.log(
      '[AutoSave] Save requested, moveCount:',
      state.moveCount,
      'pendingTimeout:',
      saveTimeout !== null
    )
  }

  // If already scheduled, do nothing (the pending flag will trigger a save when the timeout fires)
  if (saveTimeout !== null) {
    return
  }

  // Schedule save
  saveTimeout = setTimeout(() => {
    saveTimeout = null

    // Only save if we have pending changes and not currently saving
    if (pendingSave && !isSaving) {
      performAutoSave(state)
    }
  }, SAVE_THROTTLE_MS)
}

/**
 * Force an immediate autosave (bypasses throttling).
 * Use sparingly, only for critical moments like level transitions.
 *
 * @param state - The current game state
 */
export async function forceAutoSave(state: GameState): Promise<void> {
  // Clear any pending throttled save
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }

  await performAutoSave(state)
}

/**
 * Internal function to perform the actual save.
 */
async function performAutoSave(state: GameState): Promise<void> {
  // Don't save if already dead
  if (state.gameOver) {
    if (__DEV__) {
      console.log('[AutoSave] Skipping autosave - player is dead')
    }
    return
  }

  // Don't save initial state (moveCount=0 means no gameplay has happened yet)
  // This prevents saving a fresh state that would be useless on load
  if (state.moveCount === 0) {
    if (__DEV__) {
      console.log('[AutoSave] Skipping autosave - no gameplay yet (moveCount=0)')
    }
    return
  }

  // Prevent overlapping saves
  if (isSaving) {
    if (__DEV__) {
      console.log('[AutoSave] Save already in progress, queuing...')
    }
    // Re-queue the save request
    requestAutoSave(state)
    return
  }

  try {
    isSaving = true
    pendingSave = false

    await saveCurrentGame(state)

    if (__DEV__) {
      console.log('[AutoSave] Game autosaved successfully')
    }
  } catch (error) {
    console.error('[AutoSave] Failed to autosave:', error)
  } finally {
    isSaving = false
  }
}

/**
 * Cancel any pending autosave.
 * Use when the game is being shut down or reset.
 */
export function cancelAutoSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
  pendingSave = false
}

/**
 * Generate a compact fingerprint of game state for change detection.
 * Returns a string that changes when important game state changes.
 * This is used to trigger autosaves only when meaningful changes occur.
 */
export function getStateSaveFingerprint(state: GameState): string {
  // Include only the fields that should trigger a save when they change
  return JSON.stringify({
    level: state.currentLevelId,
    pos: state.player.position,
    hp: state.player.hp,
    inv: state.player.inventory.length,
    wpn: state.player.weapons.length,
    moves: state.moveCount,
    subGames: state.subGamesCompleted,
    waypoints: state.waypointSavesCreated,
    kills: state.monstersKilled,
    combat: state.inCombat,
  })
}
