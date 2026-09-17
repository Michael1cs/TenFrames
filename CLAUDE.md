# Ten Frames

Math app for children aged 4-7 (never write "4-6" anywhere), built on the
ten-frame method: a 2x5 grid the child fills with counters to see numbers
0-10. Most of the audience cannot read yet, so instructions are spoken and
navigation is by picture.

## What ships

- **iOS**, two editions from one codebase: consumer `com.tenframes.app`
  (free tier + one in-app unlock) and **School** `com.tenframes.school`
  (everything unlocked, no store code at all; flag `IS_SCHOOL_EDITION`,
  entry `index.school.js`, Xcode scheme "TenFrames School" builds with
  `-configuration Release-School`).
- **Android**, one app with the in-app unlock (built on the Windows laptop;
  see the current `ANDROID_*.md` for release steps).
- Languages RO / EN / DE. Device locale picks; anything else gets EN.

## Stack

React Native 0.84 CLI (no Expo), TypeScript, reanimated v4 + worklets,
react-native-gesture-handler, react-native-iap 15 (NitroIap), AsyncStorage
v3, react-i18next, react-native-sound, react-native-haptic-feedback. iOS
builds need Xcode 27 (UIScene life cycle in `AppDelegate.swift`; Podfile
lifts pods to iOS 15.1).

## Where things live

```
src/components/layout/GameShell.tsx     Free Play + navigation + all modals
src/components/adventure/               worlds grid, world map, level screen
src/components/game/                    the modes (Counting, Addition, Subtraction,
                                        Puzzle, NumberAnswer, Compare, Memory, FarmShare, Workshop)
src/components/common/                  AppText (Fredoka), Emoji, Bouncy, Mascot
src/config/adventureWorlds.ts           11 worlds / 98 levels, premium rule, next-playable rule
src/voice/script.ts                     every spoken line (id -> ro/en/de text)
src/voice/*Narration.ts                 which line plays when (pure, tested)
src/hooks/useVoice.ts                   the FIFO voice queue
src/hooks/usePremium.ts, useIAP.ts      free tier, daily limit, store
assets/audio/voice_<lang>_<id>.mp3      clips (also copied to android/.../res/raw)
assets/icons, assets/mascot             Mihai's clay art (512px); originals in assets/icons-source
```

## Rules that keep biting

- **The voice must never tell a child to do something the level marks
  wrong.** Every narration rule lives in `src/voice/*Narration.ts` with a
  test against the script and the shipped clips. Don't build voice ids
  inline in a screen.
- **Voice clips are bundled at build time.** After generating with
  `ELEVENLABS_API_KEY=... node scripts/gen-voice.mjs --ids=a,b`: copy to
  `android/app/src/main/res/raw/`, run `npx react-native-asset`, rebuild.
  Voice IDs/models per language are locked in the script — never mix.
  `__tests__/voiceCoverage.test.ts` fails on a missing clip.
- **One premium rule**: `isLevelPremiumLocked` / `nextPlayableLevel` in
  `adventureWorlds.ts`. Every way into a level goes through it. The price
  screen, settings and the parent dashboard sit behind `ParentalGate`.
- **Never save before boot has read storage** (the premium save is guarded
  by `bootLoaded`; a cold start once wiped paid unlocks).
- **Layout**: never mount/unmount elements inside a centred column —
  overlays and fixed slots only. Grids with computed widths use
  `Math.floor`.
- **Less talking.** One line per moment; nothing spoken over a child who is
  acting; the stall nudge (4s hand, 10s replay) is the only repetition.
- **No emoji as UI icons** where clay art exists; the mascot is the
  celebration (no generic confetti).
- Test with `npx tsc --noEmit && npx jest` (174 tests). Simulator: build
  Release for `iPhone 18 Pro Max` (iOS 27); `xcrun simctl` install/launch.
  DeviceHub replaced Simulator.app in Xcode 27.
