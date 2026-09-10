# Android — shipping 1.7.0

State after the 2026-09-10 merge: Play ships **1.6.3 (versionCode 12)** — the
Windows machine landed that line (plus the react-native-iap 15.6.2 / Play
Billing 9.1 migration and the Fredoka font cleanup) and it is now merged with
the 1.7.0 feature work. `android/app/build.gradle` is already at
**versionCode 14, versionName "1.7.0"** (13 was prepared on the Windows side
but never released; 14 also matches the iOS build number for 1.7.0).

`git pull`, `npm install`, build. No open questions left from the 1.6.3 notes:
the font decision is settled (static faces deleted, variable `Fredoka.ttf` +
`Fredoka_bold.ttf` kept), and the billing migration is merged.

---

## What 1.7.0 adds on top of the shipped 1.6.3

- **Answer mode** ("name the number"): 5 + 3 = ? and the missing addend
  3 + ? = 8, answered on a 0-10 number pad. Older profile only.
- **Compare mode** ("which has more?"): two mini frames, young profile included.
- **Number Town** — tenth Adventure world, 8 levels (90 levels total now).
- Voice line `instr_tap_number` in RO/EN/DE — the mp3s are already in
  `android/app/src/main/res/raw/`, nothing to copy.
- Celebration system rebuilt: one celebration at a time, cream cards with the
  ten-frame motif, theme-colored confetti, feedback sheet sliding over the play
  area (Duolingo-style), completed equation shown on every correct answer.
- Free Play retry soft-lock fixed (the 1.6.4 iOS fix); daily limit actually
  ends the session (dismiss lands in Counting).
- Problem generator never repeats a fact back-to-back; feedback pauses are
  tap-to-skip.
- Teachers/premium copy updated to ten worlds / 90 levels in all three
  languages.
- `tsconfig.json`: react-native-iap 15 exposes its TS source through the
  "react-native" condition; the typecheck now points at the shipped
  declarations instead (plus `skipLibCheck`). `npx tsc --noEmit` and
  `npx jest` (94 tests) are both green after the merge.

## Release checklist

1. `git pull`, `npm install`.
2. Build the AAB, test on a phone **and a tablet**. Verify:
   - the premium unlock end-to-end — this is the FIRST release on Play
     Billing 9.1 / react-native-iap 15, so the purchase flow is the top risk
   - Answer mode: build the frame, see the 👇 arrow after ~1s, hear
     "Now tap the number!", answer on the pad; wrong pick turns the bubble red
   - Compare mode on the young profile
   - Number Town appears after Doubles Castle, 0/24 stars
   - a correct answer: the frame does NOT move, the sheet slides up from the
     bottom with stars + the completed equation
   - hardware back button / back gesture out of Adventure and Free Play
3. Play Console → new release, 1.7.0 (14). What's New, three languages:
   - EN: Two new game modes — name the number and which has more — plus a
     brand-new Adventure world: Number Town! Smoother celebrations throughout.
   - RO: Două moduri de joc noi — numește numărul și care are mai multe — plus
     o lume nouă în Aventură: Orașul Numerelor! Felicitări mai elegante peste tot.
   - DE: Zwei neue Spielmodi — Zahlen benennen und wo sind mehr — plus eine
     neue Abenteuer-Welt: Zahlenstadt! Schönere Feiermomente überall.

## Note for the iOS side of this merge

The billing migration is shared code: iOS now also runs react-native-iap 15.
Before archiving 1.7.0 for Apple, run `cd ios && pod install` and re-test the
premium purchase in the StoreKit sandbox.

## School Edition on Play: still no

Unchanged conclusion from the 1.6.3 notes: Managed Google Play no longer sells
app licences, so the institutional case the iOS School Edition serves does not
exist on Android. One Play app, with the in-app unlock, remains correct.
