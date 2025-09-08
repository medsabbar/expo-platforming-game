# 2D Platformer Game 🎮

A beautiful endless 2D platformer game built with React Native and Expo, featuring dynamic biomes, day/night cycles, and smooth Skia-powered graphics.

## ✨ Features

- **Endless Gameplay**: Jump through procedurally generated platforms
- **Dynamic Biomes**: Experience different environments including grass, desert, snow, volcanic, and alien biomes
- **Day/Night Cycle**: Beautiful transitions with dynamic lighting and particle effects
- **Score Tracking**: Track your current score and persistent best score
- **Double Jump**: Master the double-jump mechanic for advanced platforming
- **Weather Effects**: Enjoy atmospheric particles like snow and volcanic embers
- **Responsive Design**: Optimized for mobile devices with landscape orientation

## 🎯 How to Play

- **Tap anywhere** on the screen to jump
- **Double-tap** quickly for a double jump while airborne
- Navigate through platforms and avoid falling
- Score points by passing platforms
- Try to beat your best score!

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- iOS Simulator, Android Emulator, or physical device

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/medsabbar/expo-platforming-game.git
   cd expo-platforming-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Use the Expo CLI to run on your preferred platform:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan the QR code with Expo Go app on your device

### Building for Production

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android
```

## 🛠️ Technical Details

### Built With

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and toolchain
- **@shopify/react-native-skia** - High-performance 2D graphics
- **AsyncStorage** - Persistent local storage for best scores
- **TypeScript** - Type-safe development

### Project Structure

```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── game.tsx       # Main game screen
│   │   └── index.tsx      # Home screen
│   └── _layout.tsx        # Root layout
├── components/
│   ├── game/              # Game components
│   │   ├── PlatformerGame.tsx  # Main game component
│   │   ├── engine/        # Game logic and physics
│   │   └── render/        # Rendering components
│   └── ui/                # UI components
├── utils/
│   └── storage.ts         # Storage utilities for best score
└── assets/                # Images and other assets
```

### Game Architecture

The game uses a component-based architecture with:

- **Game Loop**: RequestAnimationFrame-based game loop for smooth 60fps rendering
- **Physics Engine**: Custom gravity and collision detection system
- **Rendering**: Skia Canvas for high-performance 2D graphics
- **State Management**: React refs for game state to avoid re-renders
- **Biome System**: Dynamic environment changes with cross-fade transitions

## 🎨 Game Mechanics

### Biomes
- **Grass**: Classic green environment with moderate difficulty
- **Desert**: Sandy terrain with warm colors
- **Snow**: Winter landscape with falling snowflakes and wind effects
- **Volcanic**: Lava environment with rising ember particles
- **Alien**: Mysterious otherworldly terrain

### Physics
- Realistic gravity with jump apex smoothing
- Double-jump mechanics with reduced force on second jump
- Platform collision detection with tolerance for smooth gameplay
- Player squash and stretch animation based on velocity

## 📱 Supported Platforms

- iOS (iPhone/iPad)
- Android (Phone/Tablet)
- Web (via Expo for Web)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev) for rapid development
- Graphics powered by [React Native Skia](https://shopify.github.io/react-native-skia/)
- Inspired by classic 2D platformer games
