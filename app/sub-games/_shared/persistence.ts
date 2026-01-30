// app/sub-games/_shared/persistence.ts
// Shared persistence layer for sub-games using AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage'
import { SubGameSaveData } from './types'

const SUB_GAME_STORAGE_PREFIX = '@nightland:subgame:'

/**
 * Get saved data for a sub-game
 * @param key - Unique key for the sub-game (e.g., 'aerowreckage-puzzle')
 * @returns Saved data or null if not found
 */
export async function getSubGameSave<T = any>(key: string): Promise<SubGameSaveData<T> | null> {
  try {
    const storageKey = `${SUB_GAME_STORAGE_PREFIX}${key}`
    const jsonValue = await AsyncStorage.getItem(storageKey)

    if (jsonValue === null) {
      return null
    }

    const parsed = JSON.parse(jsonValue) as SubGameSaveData<T>

    // if (__DEV__) {
    //   console.log(`[SubGamePersistence] Loaded save for ${key}:`, parsed)
    // }

    return parsed
  } catch (error) {
    if (__DEV__) {
      console.error(`[SubGamePersistence] Error loading save for ${key}:`, error)
    }
    return null
  }
}

/**
 * Save data for a sub-game
 * @param key - Unique key for the sub-game (e.g., 'aerowreckage-puzzle')
 * @param data - Data to save
 * @param version - Version number for save data format (default: 1)
 */
export async function setSubGameSave<T = any>(
  key: string,
  data: T,
  version: number = 1
): Promise<void> {
  try {
    const storageKey = `${SUB_GAME_STORAGE_PREFIX}${key}`
    const saveData: SubGameSaveData<T> = {
      version,
      timestamp: Date.now(),
      data,
    }

    const jsonValue = JSON.stringify(saveData)
    await AsyncStorage.setItem(storageKey, jsonValue)

    // if (__DEV__) {
    //   console.log(`[SubGamePersistence] Saved data for ${key}:`, saveData)
    // }
  } catch (error) {
    if (__DEV__) {
      console.error(`[SubGamePersistence] Error saving data for ${key}:`, error)
    }
  }
}

/**
 * Clear saved data for a sub-game
 * @param key - Unique key for the sub-game (e.g., 'aerowreckage-puzzle')
 */
export async function clearSubGameSave(key: string): Promise<void> {
  try {
    const storageKey = `${SUB_GAME_STORAGE_PREFIX}${key}`
    await AsyncStorage.removeItem(storageKey)

    // if (__DEV__) {
    //   console.log(`[SubGamePersistence] Cleared save for ${key}`)
    // }
  } catch (error) {
    if (__DEV__) {
      console.error(`[SubGamePersistence] Error clearing save for ${key}:`, error)
    }
  }
}

/**
 * Clear all sub-game saves
 * This should be called when the game is reset (e.g., on player death)
 */
export async function clearAllSubGameSaves(): Promise<void> {
  try {
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys()

    // Filter keys that start with our sub-game prefix
    const subGameKeys = allKeys.filter((key) => key.startsWith(SUB_GAME_STORAGE_PREFIX))

    if (subGameKeys.length > 0) {
      // Remove all sub-game saves
      await AsyncStorage.multiRemove(subGameKeys)

      if (__DEV__) {
        console.log(
          `[SubGamePersistence] Cleared ${subGameKeys.length} sub-game save(s):`,
          subGameKeys
        )
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[SubGamePersistence] Error clearing all sub-game saves:', error)
    }
  }
}

/**
 * Check if a save exists for a sub-game
 * @param key - Unique key for the sub-game
 * @returns True if save exists, false otherwise
 */
export async function hasSubGameSave(key: string): Promise<boolean> {
  const save = await getSubGameSave(key)
  return save !== null
}
