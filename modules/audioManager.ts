import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio'
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native'

import { gameConfig } from '../config/gameConfig'

export class AudioManager {
  private backgroundSound: AudioPlayer | null = null
  private playbackStatus: AudioStatus | null = null
  private playbackSubscription: { remove(): void } | null = null
  private isEnabled = gameConfig.audio.backgroundMusicEnabled
  private isLoading = false
  private playbackRequested = false
  private operationGeneration = 0
  private appState: AppStateStatus = AppState.currentState ?? 'active'
  private appStateSubscription: NativeEventSubscription | null = null
  private resumeInFlight = false

  async initializeAudio(): Promise<void> {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        shouldPlayInBackground: false,
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      })

      this.subscribeToAppState()

      if (__DEV__) console.log('Audio mode set successfully')
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }

  async loadBackgroundMusic(): Promise<void> {
    const generation = ++this.operationGeneration
    this.isLoading = true
    const previousSound = this.backgroundSound
    this.backgroundSound = null
    this.playbackStatus = null
    this.playbackSubscription?.remove()
    this.playbackSubscription = null

    try {
      if (previousSound) {
        previousSound.remove()
      }

      if (generation !== this.operationGeneration) return

      if (__DEV__) console.log('Loading background music...')
      const sound = createAudioPlayer(require('../assets/sounds/ambient-background.mp3'), {
        downloadFirst: true,
        keepAudioSessionActive: true,
      })
      sound.loop = true
      sound.volume = gameConfig.audio.backgroundVolume * gameConfig.audio.masterVolume

      if (generation !== this.operationGeneration) {
        sound.remove()
        return
      }

      this.backgroundSound = sound
      this.applyPlaybackStatus(sound, generation, sound.currentStatus)
      this.playbackSubscription = sound.addListener('playbackStatusUpdate', (nextStatus) => {
        this.applyPlaybackStatus(sound, generation, nextStatus)
      })

      if (__DEV__) console.log('Background music loaded successfully')

      if (this.playbackRequested && this.isEnabled) await this.resumeRequestedPlayback()
    } catch (error) {
      if (generation === this.operationGeneration) {
        console.error('Failed to load background music:', error)
      }
    } finally {
      if (generation === this.operationGeneration) this.isLoading = false
    }
  }

  async playBackgroundMusic(): Promise<void> {
    this.playbackRequested = true

    if (__DEV__) {
      console.log(
        'playBackgroundMusic called, enabled:',
        this.isEnabled,
        'hasSound:',
        !!this.backgroundSound,
        'isPlaying:',
        this.getIsPlaying(),
        'isLoading:',
        this.isLoading
      )
    }

    if (!this.isEnabled || this.isLoading || !this.backgroundSound || this.getIsPlaying()) return
    await this.resumeRequestedPlayback()
  }

  async pauseBackgroundMusic(): Promise<void> {
    this.playbackRequested = false
    const sound = this.backgroundSound
    const generation = this.operationGeneration
    if (!sound || !this.getIsPlaying()) return

    try {
      sound.pause()
      this.applyPlaybackStatus(sound, generation, sound.currentStatus)
      if (__DEV__) console.log('Background music paused')
    } catch (error) {
      console.error('Failed to pause background music:', error)
    }
  }

  async stopBackgroundMusic(): Promise<void> {
    this.playbackRequested = false
    const sound = this.backgroundSound
    const generation = this.operationGeneration
    if (!sound) return

    try {
      sound.pause()
      await sound.seekTo(0)
      this.applyPlaybackStatus(sound, generation, sound.currentStatus)
      if (__DEV__) console.log('Background music stopped')
    } catch (error) {
      console.error('Failed to stop background music:', error)
    }
  }

  async setBackgroundMusicVolume(volume: number): Promise<void> {
    const sound = this.backgroundSound
    const generation = this.operationGeneration
    if (!sound) return

    try {
      const adjustedVolume = volume * gameConfig.audio.masterVolume
      sound.volume = adjustedVolume
      this.applyPlaybackStatus(sound, generation, sound.currentStatus)
    } catch (error) {
      console.error('Failed to set background music volume:', error)
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    if (!enabled) void this.pauseBackgroundMusic()
    else void this.playBackgroundMusic()
  }

  getIsEnabled(): boolean {
    return this.isEnabled
  }

  getIsPlaying(): boolean {
    return this.playbackStatus?.isLoaded === true && this.playbackStatus.playing
  }

  async cleanup(): Promise<void> {
    const generation = ++this.operationGeneration
    this.playbackRequested = false
    this.isLoading = false
    this.resumeInFlight = false
    this.appStateSubscription?.remove()
    this.appStateSubscription = null

    const sound = this.backgroundSound
    this.backgroundSound = null
    this.playbackStatus = null
    this.playbackSubscription?.remove()
    this.playbackSubscription = null
    if (!sound) return

    try {
      sound.remove()
    } catch (error) {
      if (generation === this.operationGeneration) {
        console.error('Failed to clean up background music:', error)
      }
    }
  }

  private subscribeToAppState(): void {
    if (this.appStateSubscription) return
    this.appState = AppState.currentState ?? 'active'
    this.appStateSubscription = AppState.addEventListener('change', (nextState) => {
      const wasActive = this.appState === 'active'
      this.appState = nextState
      if (!wasActive && nextState === 'active') void this.refreshStatusAndResume()
    })
  }

  private applyPlaybackStatus(sound: AudioPlayer, generation: number, status: AudioStatus): void {
    if (generation !== this.operationGeneration || sound !== this.backgroundSound) return
    this.playbackStatus = status

    if (
      status.isLoaded &&
      !status.playing &&
      this.appState === 'active' &&
      this.playbackRequested &&
      this.isEnabled
    ) {
      void this.resumeRequestedPlayback()
    }
  }

  private async refreshStatusAndResume(): Promise<void> {
    const sound = this.backgroundSound
    const generation = this.operationGeneration
    if (!sound || !this.playbackRequested || !this.isEnabled) return

    try {
      const status = sound.currentStatus
      this.applyPlaybackStatus(sound, generation, status)
      if (!this.getIsPlaying()) await this.resumeRequestedPlayback()
    } catch (error) {
      console.error('Failed to refresh background music status:', error)
    }
  }

  private async resumeRequestedPlayback(): Promise<void> {
    const sound = this.backgroundSound
    const generation = this.operationGeneration
    if (
      !sound ||
      this.resumeInFlight ||
      !this.playbackRequested ||
      !this.isEnabled ||
      this.appState !== 'active' ||
      this.getIsPlaying()
    ) {
      return
    }

    this.resumeInFlight = true
    try {
      sound.play()
      this.applyPlaybackStatus(sound, generation, sound.currentStatus)
      if (__DEV__ && this.getIsPlaying()) console.log('Background music started successfully')
    } catch (error) {
      if (generation === this.operationGeneration) {
        console.error('Failed to play background music:', error)
      }
    } finally {
      if (generation === this.operationGeneration) this.resumeInFlight = false
    }
  }
}

export const audioManager = new AudioManager()
