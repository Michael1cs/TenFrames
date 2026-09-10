# Android — bringing Play up to 1.7.0

Play still ships **1.6.1 (versionCode 11)**. The 1.6.3 update described in the old
`ANDROID_1.6.3.md` was never built, so Play now jumps straight to **1.7.0
(versionCode 14)** — the bump is already committed in `android/app/build.gradle`,
and versionCode 14 deliberately matches the iOS build number for 1.7.0.

Everything is merged into `main`. `git pull` on the Windows machine, `npm install`
(patch-package runs on postinstall), build.

---

## What Play picks up in this jump (1.6.1 → 1.7.0)

All shared-code work from three iOS releases, in one Android release:

### From 1.6.2–1.6.3 (was already documented for the cancelled 1.6.3 release)
- The stop-rule judge (`STOP_JUDGE_MS = 2000`): a child can finally be wrong —
  the board is judged where the tapping stops, not the instant it matches.
- The restored-route navigation trap fixed (Home is always seeded beneath).
  **Verify with the hardware back button and the back gesture** — iOS never
  exercises those paths.
- Tablet layouts for AdventureWorlds / ModeChoice / PlayerSetup (600 dp switch).
- High Five! world, difficulty curve repair, hint ladder, free tier no longer
  billed on wrong answers.

### From 1.6.4
- Free Play soft-lock fixed: retry after a wrong answer is judged again.

### New in 1.7.0
- **Answer mode** ("name the number"): 5 + 3 = ? and the missing addend
  3 + ? = 8, answered on a 0-10 number pad. Older profile only.
- **Compare mode** ("which has more?"): two mini frames, young profile included.
- **Number Town** — tenth Adventure world, 8 levels (90 levels total now).
- Voice line `instr_tap_number` in RO/EN/DE — the mp3s are already in
  `android/app/src/main/res/raw/`, nothing to copy.
- Celebration system rebuilt: one celebration at a time, cream cards with the
  ten-frame motif, theme-colored confetti, feedback sheet sliding over the play
  area (Duolingo-style), completed equation shown on every correct answer.
- Daily limit actually ends the session (dismiss lands in Counting).
- Problem generator never repeats a fact back-to-back; feedback pauses are
  tap-to-skip.
- Anti-repeat, tap-to-skip, celebration queue and the new modes are covered by
  the jest suite (94 tests) — `npx jest` should be green before building.

---

## Carried over, still unresolved from the 1.6.3 notes

1. **Font resolution** — `assets/fonts/` still holds both the variable pair
   (`Fredoka.ttf`, `Fredoka_bold.ttf`) and four static faces. The constant
   `FREDOKA_FAMILY = 'Fredoka'` matches the variable pair. Decide on the Windows
   machine with a real build: if the variable font renders, delete the four
   static faces from both asset folders; if not, keep them and `Platform.select`
   in `src/utils/fonts.ts`. (Note: iOS Info.plist now also registers
   `Fredoka_bold.ttf` — added by the asset linker in 1.7.0.)
2. **Back button / back gesture out of Adventure and Free Play** — never
   verified on Android since the navigation fix.

## Release checklist

1. `git pull`, `npm install`.
2. Settle the font question above.
3. Version is already bumped (`versionCode 14`, `versionName "1.7.0"`).
4. Build the AAB, test on a phone **and a tablet**. Beyond the 1.6.3 checks,
   verify the new surface:
   - Answer mode: build the frame, see the 👇 arrow after ~1s, hear
     "Now tap the number!", answer on the pad; wrong pick turns the bubble red.
   - Compare mode on the young profile.
   - Number Town appears after Doubles Castle, 0/24 stars.
   - A correct answer: frame does NOT move, sheet slides up from the bottom
     with stars + the completed equation.
5. Play Console → new release. What's New, three languages:
   - EN: Two new game modes — name the number and which has more — plus a
     brand-new Adventure world: Number Town! Reworked tablet layout and
     smoother celebrations.
   - RO: Două moduri de joc noi — numește numărul și care are mai multe — plus
     o lume nouă în Aventură: Orașul Numerelor! Layout refăcut pentru tablete
     și felicitări mai elegante.
   - DE: Zwei neue Spielmodi — Zahlen benennen und wo sind mehr — plus eine
     neue Abenteuer-Welt: Zahlenstadt! Überarbeitetes Tablet-Layout und
     schönere Feiermomente.

## School Edition on Play: still no

Unchanged conclusion from the 1.6.3 notes: Managed Google Play no longer sells
app licences, so the institutional case the iOS School Edition serves does not
exist on Android. One Play app, with the in-app unlock, remains correct.
