# Ten Frames - React Native Android App

## Project Overview
Educational math app for children (grades 0-1, ages 6-7) using the American **Ten Frames** method.
A 2x5 grid where children place objects to visualize numbers 0-10.

## Tech Stack
- **React Native CLI** (not Expo) — Android only
- **TypeScript**
- `react-native-reanimated` v4 + `react-native-worklets` — animations
- `react-native-linear-gradient` v3 (beta) — theme backgrounds
- `@react-native-async-storage/async-storage` v3 — persistence (uses local Maven repo for KMP artifact)
- `react-i18next` — bilingual (Romanian + English, RO is fallback)

## Game Modes
1. **Counting** — free toggle, tap cells to fill/empty
2. **Addition** — pre-fills num1 as color1 (locked), child adds num2 as color2
3. **Subtraction** — pre-fills num1 as color1, child taps to remove
4. **Puzzle** — pre-fills N as color1 (locked), child fills remaining with color2 to reach 10

## Key Architecture Decisions
- **2-color cell system**: `CellState = 'empty' | 'filled' | 'color1' | 'color2'` — educationally correct, shows operands in different colors
- **useRef pattern** in `useGameState.ts` to prevent stale closures in callbacks
- **useLayout hook** for responsive design (phone portrait + tablet landscape)
- **Landscape mode**: sidebar (header+stats+modes) left, game area right
- **Portrait mode**: vertical stack with ScrollView

## Themes
8 visual themes, each with unique color1/color2 pairs, gradient backgrounds, and floating emoji animations:
- **Space** 🚀 — indigo/purple gradients
- **Forest** 🌲 — green/emerald gradients
- **Ocean** 🐳 — blue/cyan gradients
- **Farm** 🐄 — yellow/orange gradients
- **Dino** 🦕 — teal/green gradients (dinosaur theme)
- **Candy** 🍬 — pink/magenta gradients (sweets theme)
- **Unicorn** 🦄 — purple/pink pastel gradients
- **Pixel** 👾 — dark/neon retro gaming theme

## Reward System
Motivational reward system designed for children (no penalties, effort-based praise):
- **Stars**: 3 stars for first-try correct, 1 star otherwise
- **Sticker Book**: 36 stickers across 6 categories (Numbers, Animals, Space, Nature, Food, Sports), unlocked at star thresholds
- **Achievements**: 14 achievements (star milestones, daily streaks, mode completion, perfect runs, sticker collection)
- **Daily Streak**: tracks consecutive days of practice
- **Milestones**: celebration animations at 10, 25, 50, 100 stars
- Data persisted via AsyncStorage (`@tenframes_rewards` key)

## Build Notes
- Gradle 8.13 (not 9.0 — incompatible with current plugins)
- JDK 17+ required (JetBrains Runtime 21 bundled with Android Studio works)
- Open `d:\Tenframes\android` in Android Studio to build
- Metro bundler: `npx react-native start` from project root

## Project Structure
```
src/
├── components/
│   ├── game/         # TenFrame, TenFrameCell, CountingMode, AdditionMode, SubtractionMode, PuzzleMode, NumberDisplay
│   ├── layout/       # GameShell, ModeSelector, LanguageSwitcher, BackgroundEmojis
│   ├── feedback/     # CorrectAnimation, WrongAnimation, StarsDisplay, MilestoneAnimation, NewStickerPopup, AchievementPopup
│   ├── rewards/      # StickerBook, AchievementsScreen
│   └── onboarding/   # PlayerSetup
├── hooks/            # useGameState, useTheme, useLayout, usePersistence, useRewards
├── i18n/locales/     # ro.json, en.json
├── types/            # game.ts
└── utils/            # mathProblems.ts, scoring.ts, rewardData.ts
```
