// modules/audioManager.ts
import { Audio } from 'expo-av';
import { gameConfig } from '../config/gameConfig';

class AudioManager {
  private backgroundSound: Audio.Sound | null = null;
  private isBackgroundPlaying = false;
  private isEnabled = gameConfig.audio.backgroundMusicEnabled;
  private isLoading = false;
  private shouldAutoPlay = false; // Flag to auto-play when loading completes

  async initializeAudio() {
    try {
      // Set audio mode for the app
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      
      console.log('Audio mode set successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  async loadBackgroundMusic() {
    if (this.isLoading) return; // Prevent multiple loading attempts
    
    try {
      this.isLoading = true;
      
      if (this.backgroundSound) {
        await this.backgroundSound.unloadAsync();
      }

      console.log('Loading background music...');
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/ambient-background.wav'),
        {
          isLooping: true,
          volume: gameConfig.audio.backgroundVolume * gameConfig.audio.masterVolume,
          shouldPlay: false,
        }
      );

      this.backgroundSound = sound;
      this.isLoading = false;
      console.log('Background music loaded successfully');
      
      // If we were requested to play before loading completed, play now
      if (this.shouldAutoPlay && this.isEnabled) {
        this.shouldAutoPlay = false;
        await this.playBackgroundMusic();
      }
      
    } catch (error) {
      console.error('Failed to load background music:', error);
      this.isLoading = false;
    }
  }

  async playBackgroundMusic() {
    console.log('playBackgroundMusic called, enabled:', this.isEnabled, 'hasSound:', !!this.backgroundSound, 'isPlaying:', this.isBackgroundPlaying, 'isLoading:', this.isLoading);
    
    if (!this.isEnabled) {
      console.log('Skipping playback - audio disabled');
      return;
    }

    // If still loading, set flag to auto-play when ready
    if (this.isLoading || !this.backgroundSound) {
      console.log('Audio still loading, will auto-play when ready');
      this.shouldAutoPlay = true;
      return;
    }

    if (this.isBackgroundPlaying) {
      console.log('Already playing');
      return;
    }

    try {
      console.log('Attempting to play background music...');
      await this.backgroundSound.playAsync();
      this.isBackgroundPlaying = true;
      console.log('Background music started successfully');
    } catch (error) {
      console.error('Failed to play background music:', error);
    }
  }

  async pauseBackgroundMusic() {
    if (!this.backgroundSound || !this.isBackgroundPlaying) {
      return;
    }

    try {
      await this.backgroundSound.pauseAsync();
      this.isBackgroundPlaying = false;
      console.log('Background music paused');
    } catch (error) {
      console.error('Failed to pause background music:', error);
    }
  }

  async stopBackgroundMusic() {
    if (!this.backgroundSound) {
      return;
    }

    try {
      await this.backgroundSound.stopAsync();
      this.isBackgroundPlaying = false;
      console.log('Background music stopped');
    } catch (error) {
      console.error('Failed to stop background music:', error);
    }
  }

  async setBackgroundMusicVolume(volume: number) {
    if (!this.backgroundSound) {
      return;
    }

    try {
      const adjustedVolume = volume * gameConfig.audio.masterVolume;
      await this.backgroundSound.setVolumeAsync(adjustedVolume);
    } catch (error) {
      console.error('Failed to set background music volume:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    
    if (!enabled && this.isBackgroundPlaying) {
      this.pauseBackgroundMusic();
    } else if (enabled && !this.isBackgroundPlaying) {
      this.playBackgroundMusic();
    }
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  getIsPlaying(): boolean {
    return this.isBackgroundPlaying;
  }

  async cleanup() {
    if (this.backgroundSound) {
      await this.backgroundSound.unloadAsync();
      this.backgroundSound = null;
      this.isBackgroundPlaying = false;
    }
  }
}

// Export a singleton instance
export const audioManager = new AudioManager();