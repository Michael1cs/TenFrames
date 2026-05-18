# TenFrames — Intro & Release Notes

Educational math app for ages 4–6 using the American Ten Frames method.
Currently shipping iOS first; Android is a port target.

## v1.6.0 — what's in this release

### Adventure (7 worlds, 65 levels)
- **Counting Meadow** — fill rows / fill-exactly, 10 levels
- **Addition Island** — themed ocean creatures, 12 levels with per-emoji
  voice nouns (shells, crabs, octopuses, …)
- **Subtraction Mountain** — themed space objects, 12 levels with
  per-emoji voice nouns (moons, rockets, planets, comets, aliens, …)
- **Make 10!** — number-bond drill (puzzle mode), 8 levels:
  progressive partner pairs 1+9 → 3+7 → 5+5 → 7+3 → 9+1, then mixed,
  plus 2 bonus levels. Shorter and less repetitive than 9 same-target
  levels in a row.
- **Doubles Castle** — N+N drill (1+1 through 5+5) with rotating ±1
  band per level, 7 levels, generic `doubles_N` narration
- **Memory Garden** — 7 levels, each themed from a different free-play
  theme (space, ocean, forest, farm, candy, unicorn, pixel)
- **Farm Share** — fair-share / equal grouping with animal+food pairs,
  8 levels (÷2 progression with ÷3 and ÷5 mixes)

freeLevels = 3 per world (gated to 3 free, the rest behind premium).

### Free play modes
- Counting (free)
- Workshop (free) — theme-emoji palette + ten frame as a sandbox
- Addition / Subtraction / Make 10 / Share — gated 5/day for free users

### Navigation & screens
- React Navigation native-stack (`@react-navigation/native-stack`) with
  iOS swipe-from-left back gesture on every screen. Stack lives in
  `GameShell.tsx`; routes: `Home` → `FreePlay` | `AdventureWorlds` →
  `AdventureLevels` → `AdventureLevel`.
- `Home` is the landing page — two cards (Adventure / Free Play), a 🏆
  badge top-left for the Parent Dashboard, and a ⚙️ Settings entry
  top-right alongside the language switcher.
- Settings panel: voice on/off, Premium upgrade row, About link. The
  Premium row stays visible even when `isPremium=true` (dev) so the
  upgrade UI is always discoverable.
- Premium offer screen now lists 6 features incl. all Adventure worlds,
  parent dashboard ("track your child's progress"), unlimited daily play.

### Voice
- 1268 EN audio clips, voice id `tapn1QwocNXk3viVSowa`,
  model: `eleven_multilingual_v2`.
- 1268 RO audio clips, voice id `gCte8DU5EgI3W1KcuLSA`,
  model: `eleven_v3`. Digits in RO text are written as gender-correct
  words ("Ai două rachete", "Ai cinci comete") to stop the TTS reading
  numbers in Italian/French (was: "doi rachete", "cinquo").
- 1268 DE audio clips, voice id `7eVMgwCnXydb3CikjV7a`,
  model: `eleven_v3`. Device locale German auto-selects DE.
- Voice ID + model defaults are pinned per-language in
  `scripts/gen-voice.mjs`. Do NOT regen a single clip with different
  settings without regenerating the whole language — the timbre drift
  is audible.
- Global voice queue lives at module level in `src/hooks/useVoice.ts`.
  All `play` / `playRandom` / `playSequence` calls from every screen
  serialize through one FIFO with a 250 ms gap between clips, so
  Adventure narration never overlaps GameShell's reward/praise chain.
- Per-level emoji noun narration ("Great! You have 5 octopuses!") for
  Addition Island, Subtraction Mountain, Counting Meadow, Doubles
  Castle praise.
- Inactivity replay: 5s without a tap re-plays the current problem's
  instruction.
- Result-then-praise ordering ("Five fish! → Awesome!") with ~40%
  praise frequency.
- Voice on/off toggle in Settings (⚙️ on Home) persists in PlayerData.

### Other
- 56 → 65 levels across the run.
- ProblemTransition badge between problems (~2.2s with sparkle confetti +
  star sound).
- Wrong-flash + tap-hint visual cues.
- ParentalGate wired in front of all IAP flows.
- IAP product: `com.tenframes.premium_unlock` (non-consumable).

## Release readiness — iOS (current target)

Ready:
- Bundle id, signing entry points, all required icon sizes,
  LaunchScreen.storyboard.
- 1294 EN + 1294 RO audio (~27 MB).
- `freeLevels=3` per world, `__DEV__` guards on premium/unlock loops,
  parental gate in front of IAP.
- No analytics SDKs (kids-compliant).
- i18n keys at parity across en.json / ro.json.

Outstanding before TestFlight upload:
- Xcode signing team must be set manually on this Mac before archive
  (Signing & Capabilities → Team).
- Bump CFBundleVersion (build number) per upload — the marketing
  version is now 1.6.0 (package.json).
- Confirm "Encryption Export Compliance" flag in App Store Connect
  (we use HTTPS / IAP only, no custom crypto — typically "No").
- App icon at 1024 is present; verify App Store Connect upload metadata.

## Android — what's needed for an Android version

The repo has an `android/` folder (RN-CLI Android project). It builds
but hasn't been audited / shipped this cycle.

Touchpoints to verify before publishing on Google Play:

- **Gradle / SDK targets.** RN 0.84.x defaults to compileSdk 35 / minSdk
  24; bump compileSdk to 36 for Play Store (current Play target SDK
  requirement). Check `android/build.gradle` + `android/app/build.gradle`.
- **applicationId.** Currently `com.tenframes`. Reserve the same on Play
  Console.
- **Signing.** Generate an upload keystore (`keytool -genkey -alias upload …`)
  and add it to `android/app/upload-keystore.jks` + `gradle.properties`
  (do NOT commit the keystore). Configure release signing in
  `android/app/build.gradle`.
- **App icons / adaptive icon.** Verify `android/app/src/main/res/mipmap-*`
  has the right adaptive-icon sources (foreground + background).
- **Permissions.** AndroidManifest should declare INTERNET only (RN
  default). No microphone, location, or other sensitive perms.
- **AsyncStorage native module.** Repo uses the KMP artifact via a
  local Maven repo override (see top of `CLAUDE.md`). Confirm the
  pinned version still resolves on a clean machine.
- **Audio assets.** Sync `assets/audio/voice_*.mp3` into
  `android/app/src/main/res/raw/` (we keep them mirrored — confirm with
  `ls android/app/src/main/res/raw | wc -l`; should be ~2588 mp3 files).
- **react-native-iap on Android.** Different product setup
  (Google Play Billing). Same product id `com.tenframes.premium_unlock`
  must be created on Play Console as a managed (one-time) product.
- **Designed for Families.** Google Play has a separate program with
  stricter targeted-ad / data-collection rules. Since we don't collect
  any data and don't use ads SDKs, qualifying should be straightforward;
  needs explicit declaration in Play Console.
- **AAB build.** `cd android && ./gradlew bundleRelease` →
  `app/build/outputs/bundle/release/app-release.aab` for Play Console.
- **Voice on Android.** react-native-sound bundles same mp3s — no code
  changes needed.

## Pending follow-ups (after release)

- Drag-and-drop alternative for Farm Share (current is +/− buttons,
  which already works for 4–6yo; drag is a polish step).
- Mascot Zee Lottie animation + per-world ambient music (B3 from prior
  session, deferred — needs art/audio assets).
- More worlds long-term (Compare, Twins, Skip-counting, Patterns).
- Two RO orphan voice IDs in the bundle: `Charlotte` was the gen-voice
  default historically; the 26 placeholder mp3s for removed Divide
  clips and orphan `instr_add_<theme>` (no-N) entries are EN copies
  acting as silent fallbacks. Clean up the xcodeproj references in a
  follow-up pass.

## Tools / process reminders

Generate voice (current settings):
```
ELEVENLABS_API_KEY=… \
VOICE_ID_EN=tapn1QwocNXk3viVSowa \
VOICE_ID_RO=gCte8DU5EgI3W1KcuLSA \
ELEVENLABS_MODEL=eleven_v3 \
node scripts/gen-voice.mjs --lang=ro
```

Build + install iPhone (after react-native-asset failure on stale state,
go direct):
```
cd ios && xcodebuild -workspace TenFrames.xcworkspace \
  -configuration Debug -scheme TenFrames \
  -destination 'id=00008120-0004454C2E87C01E' \
  -derivedDataPath build/ build
xcrun devicectl device install app --device 00008120-… \
  ios/build/Build/Products/Debug-iphoneos/TenFrames.app
xcrun devicectl device process launch --device 00008120-… com.tenframes.app
```

Reload Metro after JS-only changes:
```
curl -s -X POST http://localhost:8081/reload
```
