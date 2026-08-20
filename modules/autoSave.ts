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
import { deleteCurrentGame, saveCurrentGame } from './saveGame'
import { DEBUG_PERSISTENCE } from './persistenceDebug'

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

  if (DEBUG_PERSISTENCE) {
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
    if (DEBUG_PERSISTENCE) {
      console.log('[AutoSave] Skipping autosave - player is dead')
    }
    return
  }

  // Don't save initial state (moveCount=0 means no gameplay has happened yet)
  // This prevents saving a fresh state that would be useless on load
  if (state.moveCount === 0) {
    if (DEBUG_PERSISTENCE) {
      console.log('[AutoSave] Skipping autosave - no gameplay yet (moveCount=0)')
    }
    return
  }

  try {
    await saveCurrentGame(state)

    if (DEBUG_PERSISTENCE) {
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
 * Invalidate pending autosaves and delete the current save without allowing an
 * already-running write to recreate it afterward.
 */
export async function invalidateAutoSaveAndDeleteCurrentGame(): Promise<void> {
  cancelAutoSave()

  // AsyncStorage writes cannot be cancelled once started. Serialize deletion
  // behind the active write so removal is guaranteed to be the final operation.
  const writeInFlight = activeSave
  if (writeInFlight !== null) await writeInFlight

  await deleteCurrentGame()
}

/**
 * Compare only the fields that historically participated in the autosave
 * fingerprint. Reducers replace the two map fields immutably, so reference
 * comparison keeps this check constant-time as those maps grow.
 */
export function hasSaveRelevantChanges(
  previousState: GameState | null,
  currentState: GameState
): boolean {
  if (previousState === null) return true

  return (
    previousState.currentLevelId !== currentState.currentLevelId ||
    previousState.player.position.row !== currentState.player.position.row ||
    previousState.player.position.col !== currentState.player.position.col ||
    previousState.player.currentHP !== currentState.player.currentHP ||
    previousState.player.inventory.length !== currentState.player.inventory.length ||
    previousState.player.weapons.length !== currentState.player.weapons.length ||
    previousState.weaponUpgrades !== currentState.weaponUpgrades ||
    previousState.moveCount !== currentState.moveCount ||
    previousState.subGamesCompleted !== currentState.subGamesCompleted ||
    previousState.waypointSavesCreated !== currentState.waypointSavesCreated ||
    previousState.monstersKilled !== currentState.monstersKilled ||
    previousState.inCombat !== currentState.inCombat
  )
}
