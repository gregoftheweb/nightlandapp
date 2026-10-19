// modules/settingsManager.ts
//
// AsyncStorage is imported lazily (inside initialize()/persist()) rather than
// at module load time. Several combat/movement/effects modules now import
// this file just to read the synchronous `monstersDisabled` debug flag, and
// many of their Jest unit tests never mock @react-native-async-storage -
// a static top-level import would break all of them the moment this module
// is required, even though they never call anything that touches storage.

const STORAGE_KEY = '@nightland_settings'

interface Settings {
  showCoordinates: boolean
  monstersDisabled?: boolean
}

class SettingsManager {
  private showCoordinates = false
  // Debug-only "walkthrough mode": suppresses monster spawning, movement,
  // ranged attacks, and melee-collision combat triggers so the game can be
  // played/tested encounter-free. Read synchronously by combat/movement/
  // effects modules - see their `settingsManager.getMonstersDisabled()` call
  // sites for the actual enforcement.
  private monstersDisabled = false
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored) {
        const settings: Settings = JSON.parse(stored)
        this.showCoordinates = settings.showCoordinates ?? false
        this.monstersDisabled = settings.monstersDisabled ?? false
      }
      this.isInitialized = true

      if (__DEV__) {
        console.log('Settings initialized:', {
          showCoordinates: this.showCoordinates,
          monstersDisabled: this.monstersDisabled,
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      this.isInitialized = true
    }
  }

  private async persist() {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default
      const settings: Settings = {
        showCoordinates: this.showCoordinates,
        monstersDisabled: this.monstersDisabled,
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

      if (__DEV__) {
        console.log('Settings saved:', settings)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  async setShowCoordinates(enabled: boolean) {
    this.showCoordinates = enabled
    await this.persist()
  }

  getShowCoordinates(): boolean {
    return this.showCoordinates
  }

  async setMonstersDisabled(disabled: boolean) {
    this.monstersDisabled = disabled
    await this.persist()
  }

  getMonstersDisabled(): boolean {
    return this.monstersDisabled
  }
}

// Export a singleton instance
export const settingsManager = new SettingsManager()
