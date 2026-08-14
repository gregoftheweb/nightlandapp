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

import { GameState } from '@config/types'
import { saveCurrentGame } from './saveGame'

let saveTimeout: ReturnType<typeof setTimeout> | null = null
let activeSave: Promise<void> | null = null
let latestPendingState: GameState | null = null

const SAVE_THROTTLE_MS = 2000 // Save at most once per 2 seconds

/**
 * Request an autosave of the current game state.
 * This is throttled and non-blocking.
 *
 * @param state - The current game state
 */
export function requestAutoSave(state: GameState): void {
  // Always replace the pending snapshot so the trailing save reflects the
  // newest state observed during the throttle window.
  latestPendingState = state

  if (__DEV__) {
    console.log(
      '[AutoSave] Save requested, moveCount:',
      state.moveCount,
      'pendingTimeout:',
      saveTimeout !== null
    )
  }

  schedulePendingSave()
}

function schedulePendingSave(): void {
  // The active write drains any newer state in its finally block.
  if (saveTimeout !== null || activeSave !== null || latestPendingState === null) return

  saveTimeout = setTimeout(() => {
    saveTimeout = null
    void drainPendingSave()
  }, SAVE_THROTTLE_MS)
}

async function drainPendingSave(): Promise<void> {
  if (activeSave !== null || latestPendingState === null) return

  const state = latestPendingState
  latestPendingState = null
  activeSave = performAutoSave(state)

  try {
    await activeSave
  } finally {
    activeSave = null
    // A request may have arrived while AsyncStorage was writing. Give that
    // latest snapshot its own trailing throttle window instead of dropping it.
    schedulePendingSave()
  }
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

  latestPendingState = state

  // Preserve write ordering when a throttled save is already in flight.
  if (activeSave !== null) await activeSave

  // The completed write may have scheduled the pending state for later. A
  // forced save consumes it now, so remove that trailing timer.
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
  await drainPendingSave()
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

  try {
    await saveCurrentGame(state)

    if (__DEV__) {
      console.log('[AutoSave] Game autosaved successfully')
    }
  } catch (error) {
    console.error('[AutoSave] Failed to autosave:', error)
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
  latestPendingState = null
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
    hp: state.player.currentHP,
    inv: state.player.inventory.length,
    wpn: state.player.weapons.length,
    moves: state.moveCount,
    subGames: state.subGamesCompleted,
    waypoints: state.waypointSavesCreated,
    kills: state.monstersKilled,
    combat: state.inCombat,
  })
}
