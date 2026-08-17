// modules/saveGame.ts
/**
 * Save Game Module
 *
 * Handles all save/load operations for the game:
 * - Autosave (current game)
 * - Waypoint saves (hard saves at specific locations)
 *
 * Storage Strategy:
 * - Current save: Single slot that gets overwritten on each autosave
 * - Waypoint saves: Multiple indexed saves with metadata
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { GameState, GameSnapshot } from '@config/types'
import { toSnapshot } from './gameState'
import { DEBUG_PERSISTENCE } from './persistenceDebug'

// ===== STORAGE KEYS =====
const CURRENT_GAME_KEY = 'nightland:save:current:v1'
const WAYPOINT_INDEX_KEY = 'nightland:save:waypoints:index:v1'
const WAYPOINT_ITEM_PREFIX = 'nightland:save:waypoint:v1:'

// AsyncStorage has no transaction primitive. Serialize every waypoint index
// mutation so each read-modify-write sequence observes the prior commit.
let waypointMutationQueue: Promise<void> = Promise.resolve()

function enqueueWaypointMutation<T>(mutation: () => Promise<T>): Promise<T> {
  const result = waypointMutationQueue.then(mutation, mutation)
  waypointMutationQueue = result.then(
    () => undefined,
    () => undefined
  )
  return result
}

// ===== TYPES =====

export interface SavedGameV1 {
  version: 'v1'
  snapshot: GameSnapshot
  savedAt: string // ISO timestamp
}

export interface WaypointSaveMetadata {
  id: string // unique ID (timestamp + random)
  name: string // e.g., "hermit-hollow waypoint"
  createdAt: string // ISO timestamp
  // Optional display metadata
  levelId?: string
  playerPosition?: { row: number; col: number }
  playerHP?: number
  playerMaxHP?: number
}

export interface WaypointSaveRecord extends WaypointSaveMetadata {
  snapshot: GameSnapshot
}

// ===== CURRENT GAME (AUTOSAVE) =====

/**
 * Save the current game state (autosave).
 * Overwrites any existing current save.
 */
export async function saveCurrentGame(state: GameState): Promise<void> {
  try {
    const snapshot = toSnapshot(state)
    const savedGame: SavedGameV1 = {
      version: 'v1',
      snapshot,
      savedAt: new Date().toISOString(),
    }

    if (DEBUG_PERSISTENCE) {
      console.log('[SaveGame] === SAVING CURRENT GAME ===')
      console.log('[SaveGame] State currentLevelId:', state.currentLevelId)
      console.log('[SaveGame] State player position:', state.player?.position)
      console.log('[SaveGame] State player HP:', state.player?.currentHP)
      console.log('[SaveGame] State moveCount:', state.moveCount)
      // Count only actual sub-games (keys without colons are main sub-games)
      const mainSubGames = Object.keys(state.subGamesCompleted || {}).filter(
        (key) => !key.includes(':')
      )
      console.log('[SaveGame] State subGamesCompleted (main):', mainSubGames.length, mainSubGames)
      console.log('[SaveGame] Included subGames keys:', Object.keys(state.subGamesCompleted || {}))
      console.log('[SaveGame] SubGames detail:', state.subGamesCompleted)
    }

    await AsyncStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(savedGame))
    if (DEBUG_PERSISTENCE) {
      console.log('[SaveGame] Current game saved successfully')
    }
  } catch (error) {
    console.error('[SaveGame] Failed to save current game:', error)
    throw error
  }
}

/**
 * Load the current game state (autosave).
 * Returns null if no save exists or if corrupted.
 */
export async function loadCurrentGame(): Promise<GameSnapshot | null> {
  try {
    const data = await AsyncStorage.getItem(CURRENT_GAME_KEY)
    if (!data) {
      if (DEBUG_PERSISTENCE) {
        console.log('[SaveGame] No current game save found')
      }
      return null
    }

    const savedGame: SavedGameV1 = JSON.parse(data)

    // Validate version
    if (savedGame.version !== 'v1') {
      console.warn('[SaveGame] Unsupported save version:', savedGame.version)
      return null
    }

    if (DEBUG_PERSISTENCE) {
      console.log('[SaveGame] === LOADING CURRENT GAME ===')
      console.log('[SaveGame] Save version:', savedGame.version)
      console.log('[SaveGame] Saved at:', savedGame.savedAt)
      console.log('[SaveGame] Snapshot currentLevelId:', savedGame.snapshot.currentLevelId)
      console.log('[SaveGame] Snapshot player position:', savedGame.snapshot.player?.position)
      console.log('[SaveGame] Snapshot player HP:', savedGame.snapshot.player?.currentHP)
      console.log('[SaveGame] Snapshot moveCount:', savedGame.snapshot.moveCount)
      // Count only actual sub-games (keys without colons are main sub-games)
      const mainSubGames = Object.keys(savedGame.snapshot.subGamesCompleted || {}).filter(
        (key) => !key.includes(':')
      )
      console.log(
        '[SaveGame] Snapshot subGamesCompleted (main):',
        mainSubGames.length,
        mainSubGames
      )
      console.log(
        '[SaveGame] Restored subGames keys:',
        Object.keys(savedGame.snapshot.subGamesCompleted || {})
      )
      console.log('[SaveGame] SubGames detail:', savedGame.snapshot.subGamesCompleted)
    }

    return savedGame.snapshot
  } catch (error) {
    console.error('[SaveGame] Failed to load current game:', error)
    // If corrupted, delete it
    await deleteCurrentGame()
    return null
  }
}

/**
 * Delete the current game save.
 * Called on death or when starting a new game.
 */
export async function deleteCurrentGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CURRENT_GAME_KEY)
    if (DEBUG_PERSISTENCE) {
      console.log('[SaveGame] Current game deleted')
    }
  } catch (error) {
    console.error('[SaveGame] Failed to delete current game:', error)
  }
}

/**
 * Check if a current game save exists.
 */
export async function hasCurrentGame(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(CURRENT_GAME_KEY)
    return data !== null
  } catch (error) {
    console.error('[SaveGame] Failed to check current game existence:', error)
    return false
  }
}

// ===== WAYPOINT SAVES =====

/**
 * Save a waypoint (hard save).
 * Creates a new waypoint save with the given name.
 * If waypoint(s) with the same name already exist, ALL will be replaced.
 * This ensures only ONE waypoint save per waypoint type.
 * Returns the ID of the created waypoint.
 */
export async function saveWaypoint(state: GameState, waypointName: string): Promise<string> {
  return enqueueWaypointMutation(() => saveWaypointTransaction(state, waypointName))
}

async function saveWaypointTransaction(state: GameState, waypointName: string): Promise<string> {
  let newWaypointKey: string | null = null

  try {
    const snapshot = toSnapshot(state)

    // Re-check uniqueness inside the mutation queue. Callers may have passed a
    // stale UI-level "already created" check before reaching this boundary.
    const index = await loadWaypointIndex(true)
    const existingWaypoints = index.filter((item) => item.name === waypointName)

    if (existingWaypoints.length > 0) {
      if (DEBUG_PERSISTENCE) {
        console.log(
          `[SaveGame] Replacing ${existingWaypoints.length} existing waypoint(s):`,
          waypointName
        )
      }

      // Superseded records remain valid until the replacement is fully
      // written and its index commit succeeds.
    }

    // Generate unique ID using timestamp and high-precision random
    // Collision probability is virtually zero given timestamp + 9-char random string
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${Math.random().toString(36).substring(2, 11)}`

    // Create metadata
    const metadata: WaypointSaveMetadata = {
      id,
      name: waypointName,
      createdAt: new Date().toISOString(),
      levelId: state.currentLevelId,
      playerPosition: state.player.position,
      playerHP: state.player.currentHP,
      playerMaxHP: state.player.maxHP,
    }

    // Create full record
    const record: WaypointSaveRecord = {
      ...metadata,
      snapshot,
    }

    // Save the waypoint data
    newWaypointKey = WAYPOINT_ITEM_PREFIX + id
    await AsyncStorage.setItem(newWaypointKey, JSON.stringify(record))

    // Commit one index derived from the read performed inside this transaction.
    const updatedIndex = [...index.filter((item) => item.name !== waypointName), metadata]
    await saveWaypointIndex(updatedIndex)

    // The committed index now points at the replacement. Old records are
    // unreachable and can be cleaned up without risking loss of the waypoint.
    for (const waypoint of existingWaypoints) {
      const oldWaypointKey = WAYPOINT_ITEM_PREFIX + waypoint.id
      try {
        await AsyncStorage.removeItem(oldWaypointKey)
        if (DEBUG_PERSISTENCE) console.log('[SaveGame] Deleted waypoint ID:', waypoint.id)
      } catch (cleanupError) {
        console.error('[SaveGame] Failed to clean up superseded waypoint:', cleanupError)
      }
    }

    if (DEBUG_PERSISTENCE) {
      console.log('[SaveGame] Waypoint saved:', waypointName, 'ID:', id)
    }

    return id
  } catch (error) {
    // If the index was not committed, preserve the previously indexed save and
    // best-effort remove the unreferenced replacement record.
    if (newWaypointKey) {
      try {
        await AsyncStorage.removeItem(newWaypointKey)
      } catch (cleanupError) {
        console.error('[SaveGame] Failed to clean up uncommitted waypoint:', cleanupError)
      }
    }
    console.error('[SaveGame] Failed to save waypoint:', error)
    throw error
  }
}

/**
 * Load a waypoint save by ID.
 * Returns the snapshot, or null if not found.
 */
export async function loadWaypoint(id: string): Promise<GameSnapshot | null> {
  try {
    const waypointKey = WAYPOINT_ITEM_PREFIX + id
    const data = await AsyncStorage.getItem(waypointKey)

    if (!data) {
      console.warn('[SaveGame] Waypoint not found:', id)
      return null
    }

    const record: WaypointSaveRecord = JSON.parse(data)

    if (DEBUG_PERSISTENCE) {
      console.log('[SaveGame] Waypoint loaded:', record.name, 'ID:', id)
    }

    return record.snapshot
  } catch (error) {
    console.error('[SaveGame] Failed to load waypoint:', error)
    return null
  }
}

/**
 * List all waypoint saves.
 * Returns metadata for all waypoints (for display in UI).
 */
export async function listWaypointSaves(): Promise<WaypointSaveMetadata[]> {
  try {
    const index = await loadWaypointIndex()

    if (DEBUG_PERSISTENCE) {
      console.log('[SaveGame] Listed', index.length, 'waypoint saves')
    }

    return index
  } catch (error) {
    console.error('[SaveGame] Failed to list waypoint saves:', error)
    return []
  }
}

/**
 * Delete a waypoint save by ID.
 */
export async function deleteWaypoint(id: string): Promise<void> {
  return enqueueWaypointMutation(() => deleteWaypointTransaction(id))
}

async function deleteWaypointTransaction(id: string): Promise<void> {
  try {
    const index = await loadWaypointIndex(true)
    const newIndex = index.filter((item) => item.id !== id)
    await saveWaypointIndex(newIndex)

    // Commit the index first. A failed cleanup leaves only an unreachable
    // record instead of an index entry that points to missing data.
    const waypointKey = WAYPOINT_ITEM_PREFIX + id
    await AsyncStorage.removeItem(waypointKey)

    if (DEBUG_PERSISTENCE) {
      console.log('[SaveGame] Waypoint deleted:', id)
    }
  } catch (error) {
    console.error('[SaveGame] Failed to delete waypoint:', error)
  }
}

/**
 * Delete all waypoint saves.
 * Utility function, not exposed in UI.
 */
export async function deleteAllWaypointSaves(): Promise<void> {
  return enqueueWaypointMutation(deleteAllWaypointSavesTransaction)
}

async function deleteAllWaypointSavesTransaction(): Promise<void> {
  try {
    const index = await loadWaypointIndex(true)

    // Make every record unreachable before best-effort cleanup.
    await saveWaypointIndex([])

    for (const item of index) {
      const waypointKey = WAYPOINT_ITEM_PREFIX + item.id
      await AsyncStorage.removeItem(waypointKey)
    }

    if (DEBUG_PERSISTENCE) {
      console.log('[SaveGame] All waypoint saves deleted')
    }
  } catch (error) {
    console.error('[SaveGame] Failed to delete all waypoint saves:', error)
  }
}

/**
 * Debug utility to inspect current save in AsyncStorage.
 * Runs only when verbose persistence diagnostics are explicitly enabled.
 */
export async function debugInspectCurrentSave(): Promise<void> {
  if (!DEBUG_PERSISTENCE) return

  try {
    console.log('[SaveGame] ===== DEBUG INSPECT CURRENT SAVE =====')
    const data = await AsyncStorage.getItem(CURRENT_GAME_KEY)

    if (!data) {
      console.log('[SaveGame] No save found in storage')
      return
    }

    const parsed = JSON.parse(data)
    console.log('[SaveGame] Save exists!')
    console.log('[SaveGame] Version:', parsed.version)
    console.log('[SaveGame] Saved at:', parsed.savedAt)

    if (parsed.snapshot) {
      console.log('[SaveGame] Snapshot currentLevelId:', parsed.snapshot.currentLevelId)
      console.log('[SaveGame] Snapshot moveCount:', parsed.snapshot.moveCount)
      console.log('[SaveGame] Snapshot player position:', parsed.snapshot.player?.position)
      console.log('[SaveGame] Snapshot player HP:', parsed.snapshot.player?.hp)
      console.log(
        '[SaveGame] Snapshot subGamesCompleted keys:',
        Object.keys(parsed.snapshot.subGamesCompleted || {})
      )
    }

    console.log('[SaveGame] Raw save data length:', data.length)
    console.log('[SaveGame] ===== END DEBUG INSPECT =====')
  } catch (error) {
    console.error('[SaveGame] Failed to inspect save:', error)
  }
}

// ===== INTERNAL HELPERS =====

/**
 * Load the waypoint index.
 * Returns empty array if no index exists.
 */
async function loadWaypointIndex(strict = false): Promise<WaypointSaveMetadata[]> {
  try {
    const data = await AsyncStorage.getItem(WAYPOINT_INDEX_KEY)
    if (!data) {
      return []
    }
    return JSON.parse(data)
  } catch (error) {
    console.error('[SaveGame] Failed to load waypoint index:', error)
    if (strict) throw error
    return []
  }
}

/**
 * Save the waypoint index.
 */
async function saveWaypointIndex(index: WaypointSaveMetadata[]): Promise<void> {
  try {
    await AsyncStorage.setItem(WAYPOINT_INDEX_KEY, JSON.stringify(index))
  } catch (error) {
    console.error('[SaveGame] Failed to save waypoint index:', error)
    throw error
  }
}
