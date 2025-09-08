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
      // Load background music
      const { sound: backgroundMusic } = await Audio.Sound.createAsync(
        require('@/assets/sounds/background-music.mp3'),
        { 
          shouldPlay: false, 
          isLooping: true,
          volume: this.musicVolume 
        }
      );
      this.backgroundMusic = backgroundMusic;

      // Load jump sound effect
      const { sound: jumpSound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/jump.mp3'),
        { 
          shouldPlay: false, 
          volume: this.effectsVolume 
        }
      );
      this.soundEffects.jump = jumpSound;

      // Load death sound effect
      const { sound: deathSound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/death.mp3'),
        { 
          shouldPlay: false, 
          volume: this.effectsVolume 
        }
      );
      this.soundEffects.death = deathSound;

      console.log('Audio files loaded successfully');
    } catch (error) {
      console.warn('Failed to load audio files, falling back to programmatic sounds:', error);
      // Keep the fallback programmatic sound functionality
    }
  }

  async playBackgroundMusic() {
    if (this.isMuted) return;

    try {
      if (this.backgroundMusic) {
        await this.backgroundMusic.setVolumeAsync(this.musicVolume);
        await this.backgroundMusic.playAsync();
        console.log('Background music started playing');
      } else {
        console.log('Background music not loaded, would start playing');
      }
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
      const sound = this.soundEffects[effect];
      if (sound) {
        // Reset to beginning and play
        await sound.setPositionAsync(0);
        await sound.setVolumeAsync(this.effectsVolume);
        await sound.playAsync();
      } else {
        // Fallback to programmatic sound for web or if file failed to load
        this.playProgrammaticSound(effect);
      }
    } catch (error) {
      console.warn(`Failed to play sound effect ${effect}:`, error);
      // Fallback to programmatic sound
      this.playProgrammaticSound(effect);
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
      this.pauseBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
  }

  async pauseBackgroundMusic() {
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.pauseAsync();
      } catch (error) {
        console.warn('Failed to pause background music:', error);
      }
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

  async handleAppStateChange(nextAppState: string) {
    if (nextAppState === 'background') {
      await this.pauseBackgroundMusic();
    } else if (nextAppState === 'active' && !this.isMuted) {
      await this.playBackgroundMusic();
    }
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