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
import { GameState, GameSnapshot } from '@/config/types'
import { toSnapshot } from './gameState'

// ===== STORAGE KEYS =====
const CURRENT_GAME_KEY = 'nightland:save:current:v1'
const WAYPOINT_INDEX_KEY = 'nightland:save:waypoints:index:v1'
const WAYPOINT_ITEM_PREFIX = 'nightland:save:waypoint:v1:'

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

    if (__DEV__) {
      console.log('[SaveGame] === SAVING CURRENT GAME ===')
      console.log('[SaveGame] State currentLevelId:', state.currentLevelId)
      console.log('[SaveGame] State player position:', state.player?.position)
      console.log('[SaveGame] State player HP:', state.player?.hp)
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
    if (__DEV__) {
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
      if (__DEV__) {
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

    if (__DEV__) {
      console.log('[SaveGame] === LOADING CURRENT GAME ===')
      console.log('[SaveGame] Save version:', savedGame.version)
      console.log('[SaveGame] Saved at:', savedGame.savedAt)
      console.log('[SaveGame] Snapshot currentLevelId:', savedGame.snapshot.currentLevelId)
      console.log('[SaveGame] Snapshot player position:', savedGame.snapshot.player?.position)
      console.log('[SaveGame] Snapshot player HP:', savedGame.snapshot.player?.hp)
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
    if (__DEV__) {
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
  try {
    const snapshot = toSnapshot(state)

    // Check for ALL existing waypoints with the same name and delete them
    const index = await loadWaypointIndex()
    const existingWaypoints = index.filter((item) => item.name === waypointName)

    if (existingWaypoints.length > 0) {
      if (__DEV__) {
        console.log(
          `[SaveGame] Replacing ${existingWaypoints.length} existing waypoint(s):`,
          waypointName
        )
      }

      // Delete ALL old waypoint data
      for (const waypoint of existingWaypoints) {
        const oldWaypointKey = WAYPOINT_ITEM_PREFIX + waypoint.id
        await AsyncStorage.removeItem(oldWaypointKey)
        if (__DEV__) {
          console.log('[SaveGame] Deleted waypoint ID:', waypoint.id)
        }
      }

      // Remove ALL from index (we'll add the new one below)
      const filteredIndex = index.filter((item) => item.name !== waypointName)
      await saveWaypointIndex(filteredIndex)
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
    const waypointKey = WAYPOINT_ITEM_PREFIX + id
    await AsyncStorage.setItem(waypointKey, JSON.stringify(record))

    // Update index with new waypoint
    const updatedIndex = await loadWaypointIndex()
    updatedIndex.push(metadata)
    await saveWaypointIndex(updatedIndex)

    if (__DEV__) {
      console.log('[SaveGame] Waypoint saved:', waypointName, 'ID:', id)
    }

    return id
  } catch (error) {
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

    if (__DEV__) {
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

    if (__DEV__) {
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
  try {
    // Delete the waypoint data
    const waypointKey = WAYPOINT_ITEM_PREFIX + id
    await AsyncStorage.removeItem(waypointKey)

    // Update index
    const index = await loadWaypointIndex()
    const newIndex = index.filter((item) => item.id !== id)
    await saveWaypointIndex(newIndex)

    if (__DEV__) {
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
  try {
    const index = await loadWaypointIndex()

    // Delete all waypoint items
    for (const item of index) {
      const waypointKey = WAYPOINT_ITEM_PREFIX + item.id
      await AsyncStorage.removeItem(waypointKey)
    }

    // Clear index
    await saveWaypointIndex([])

    if (__DEV__) {
      console.log('[SaveGame] All waypoint saves deleted')
    }
  } catch (error) {
    console.error('[SaveGame] Failed to delete all waypoint saves:', error)
  }
}

/**
 * Debug utility to inspect current save in AsyncStorage.
 * Only available in development mode.
 */
export async function debugInspectCurrentSave(): Promise<void> {
  if (!__DEV__) return

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
async function loadWaypointIndex(): Promise<WaypointSaveMetadata[]> {
  try {
    const data = await AsyncStorage.getItem(WAYPOINT_INDEX_KEY)
    if (!data) {
      return []
    }
    return JSON.parse(data)
  } catch (error) {
    console.error('[SaveGame] Failed to load waypoint index:', error)
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
