import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer, AudioSource, AudioMode } from 'expo-audio';

export type SoundEffect = 'jump' | 'death';

class AudioManager {
  private backgroundMusic: AudioPlayer | null = null;
  private soundEffects: { [key in SoundEffect]?: AudioPlayer } = {};
  private isMuted = false;
  private musicVolume = 0.6;
  private effectsVolume = 0.8;

  async initialize() {
    try {
      // Configure audio mode for games
      await setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      } as Partial<AudioMode>);

      // Try to load audio files, but don't fail if they don't exist
      await this.loadSounds();
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
      console.log('Audio will fall back to programmatic sounds where available');
    }
  }

  private async loadSounds() {
    try {
      // Try to load background music - this will likely fail since it's a placeholder
      try {
        this.backgroundMusic = createAudioPlayer({
          assetId: require('@/assets/sounds/background-music.mp3')
        });
        this.backgroundMusic.volume = this.musicVolume;
        this.backgroundMusic.loop = true;
        console.log('Background music loaded successfully');
      } catch (error) {
        console.log('Background music file not available (placeholder), using programmatic music');
        this.backgroundMusic = null;
      }

      // Try to load jump sound effect
      try {
        this.soundEffects.jump = createAudioPlayer({
          assetId: require('@/assets/sounds/jump.mp3')
        });
        this.soundEffects.jump.volume = this.effectsVolume;
        console.log('Jump sound loaded successfully');
      } catch (error) {
        console.log('Jump sound file not available (placeholder), using programmatic sound');
        this.soundEffects.jump = undefined;
      }

      // Try to load death sound effect
      try {
        this.soundEffects.death = createAudioPlayer({
          assetId: require('@/assets/sounds/death.mp3')
        });
        this.soundEffects.death.volume = this.effectsVolume;
        console.log('Death sound loaded successfully');
      } catch (error) {
        console.log('Death sound file not available (placeholder), using programmatic sound');
        this.soundEffects.death = undefined;
      }

    } catch (error) {
      console.warn('Failed to load audio files, falling back to programmatic sounds:', error);
      // Keep the fallback programmatic sound functionality
    }
  }

  async playBackgroundMusic() {
    if (this.isMuted) return;

    try {
      if (this.backgroundMusic) {
        this.backgroundMusic.volume = this.musicVolume;
        this.backgroundMusic.play();
        console.log('Background music started playing');
      } else {
        console.log('Background music not loaded, would start playing');
        // For now, we'll just use silence since creating programmatic background music is complex
        // In the future, we could create a simple melody using Web Audio API
      }
    } catch (error) {
      console.warn('Failed to play background music:', error);
    }
  }

  async stopBackgroundMusic() {
    if (this.backgroundMusic) {
      try {
        this.backgroundMusic.pause();
        // Note: expo-audio players don't need to be "unloaded" like expo-av
        console.log('Background music stopped');
      } catch (error) {
        console.warn('Failed to stop background music:', error);
      }
    }
  }

  async playSoundEffect(effect: SoundEffect) {
    if (this.isMuted) return;

    try {
      const player = this.soundEffects[effect];
      if (player) {
        // Reset to beginning and play
        player.currentTime = 0;
        player.volume = this.effectsVolume;
        player.play();
        console.log(`Playing sound effect: ${effect}`);
      } else {
        // Fallback to programmatic sound for web or if file failed to load
        console.log(`Using programmatic sound for: ${effect}`);
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
        this.backgroundMusic.pause();
        console.log('Background music paused');
      } catch (error) {
        console.warn('Failed to pause background music:', error);
      }
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
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
    for (const player of Object.values(this.soundEffects)) {
      if (player) {
        try {
          player.pause();
          // Note: expo-audio players are automatically cleaned up
        } catch (error) {
          console.warn('Failed to cleanup sound effect:', error);
        }
      }
    }
    this.soundEffects = {};
    console.log('Audio manager cleaned up');
  }
}

// Export singleton instance
export const audioManager = new AudioManager();