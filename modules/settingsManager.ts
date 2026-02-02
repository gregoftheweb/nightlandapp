// modules/settingsManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@nightland_settings'

interface Settings {
  showCoordinates: boolean
}

class SettingsManager {
  private showCoordinates = false
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (stored) {
        const settings: Settings = JSON.parse(stored)
        this.showCoordinates = settings.showCoordinates ?? false
      }
      this.isInitialized = true

      if (__DEV__) {
        console.log('Settings initialized:', { showCoordinates: this.showCoordinates })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      this.isInitialized = true
    }
  }

  async setShowCoordinates(enabled: boolean) {
    this.showCoordinates = enabled

    try {
      const settings: Settings = {
        showCoordinates: enabled,
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

      if (__DEV__) {
        console.log('Settings saved:', settings)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  getShowCoordinates(): boolean {
    return this.showCoordinates
  }
}

// Export a singleton instance
export const settingsManager = new SettingsManager()
