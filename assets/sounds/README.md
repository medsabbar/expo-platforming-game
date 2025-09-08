# Audio System

This directory contains audio assets for the platforming game.

## Files

- `background-music.mp3` - Looping background music for the game
- `jump.mp3` - Sound effect played when the player jumps (including double jump)
- `death.mp3` - Sound effect played when the player dies (falls off screen)

## Usage

The audio system is managed by the `AudioManager` class in `/utils/AudioManager.ts`. It provides:

- Background music that loops continuously during gameplay
- Sound effects for game actions (jump, death)
- Volume controls for music and effects separately
- Mute/unmute functionality
- Proper cleanup and memory management
- Fallback to programmatic sounds on web platform

## Audio Manager Features

- **Platform Support**: Uses expo-av for native platforms with Web Audio API fallback
- **Lifecycle Management**: Automatically handles app state changes (background/foreground)
- **Error Handling**: Graceful fallbacks when audio files fail to load
- **Memory Management**: Proper cleanup of audio resources

## Integration

The audio system is integrated into the game at key points:
- Background music starts when the game component mounts
- Jump sounds play on both regular and double jumps
- Death sound plays when the player falls off screen
- Audio cleanup happens when the component unmounts

## Development Notes

Currently using placeholder audio files. In a production environment, these should be replaced with:
- High-quality, compressed audio files (MP3 or AAC)
- Proper loop points for background music
- Appropriate durations for sound effects (jump: ~0.2s, death: ~1s)
- Volume levels balanced across all audio assets