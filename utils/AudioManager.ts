import { Audio } from 'expo-av';
import { InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av/build/Audio.types';

export type SoundEffect = 'jump' | 'death';

class AudioManager {
  private backgroundMusic: Audio.Sound | null = null;
  private soundEffects: { [key in SoundEffect]?: Audio.Sound } = {};
  private isMuted = false;
  private musicVolume = 0.6;
  private effectsVolume = 0.8;

  async initialize() {
    try {
      // Configure audio mode for games
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });

      // Since we don't have audio files yet, we'll create simple programmatic sounds
      await this.loadSounds();
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }

  private async loadSounds() {
    try {
      // For now, we'll use a simple approach without external files
      // These will be replaced with actual audio files later
      console.log('Audio manager initialized - ready for sound files');
    } catch (error) {
      console.warn('Failed to load sounds:', error);
    }
  }

  async playBackgroundMusic() {
    if (this.isMuted || this.backgroundMusic) return;

    try {
      // For now, just log that we would play background music
      // This will be implemented with actual audio files
      console.log('Background music would start playing');
    } catch (error) {
      console.warn('Failed to play background music:', error);
    }
  }

  async stopBackgroundMusic() {
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.stopAsync();
        await this.backgroundMusic.unloadAsync();
        this.backgroundMusic = null;
      } catch (error) {
        console.warn('Failed to stop background music:', error);
      }
    }
  }

  async playSoundEffect(effect: SoundEffect) {
    if (this.isMuted) return;

    try {
      // For now, create a simple programmatic sound using Web Audio API
      // This will work in web version and provide immediate feedback
      this.playProgrammaticSound(effect);
    } catch (error) {
      console.warn(`Failed to play sound effect ${effect}:`, error);
    }
  }

  private playProgrammaticSound(effect: SoundEffect) {
    // Only works on web platform, but provides immediate feedback
    if (typeof window !== 'undefined' && window.AudioContext) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

        if (effect === 'jump') {
          // Quick ascending tone for jump
          oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.stop(audioContext.currentTime + 0.2);
        } else if (effect === 'death') {
          // Descending tone for death
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.5);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.stop(audioContext.currentTime + 0.5);
        }

        oscillator.start(audioContext.currentTime);
      } catch (error) {
        console.warn('Web Audio API not available:', error);
      }
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolumeAsync(this.musicVolume);
    }
  }

  setEffectsVolume(volume: number) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
  }

  async cleanup() {
    await this.stopBackgroundMusic();
    
    // Cleanup sound effects
    for (const sound of Object.values(this.soundEffects)) {
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.warn('Failed to cleanup sound effect:', error);
        }
      }
    }
    this.soundEffects = {};
  }
}

// Export singleton instance
export const audioManager = new AudioManager();