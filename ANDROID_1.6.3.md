# Android — bringing Play up to 1.6.3

Play currently ships **1.6.1 (versionCode 11)**. iOS is at **1.6.3 (12)**, in review.
Everything below is already merged into `main` (commit `ce56786`) and pushed.

The two machines had diverged since v1.6.0 and met again on 2026-08-29. The merge
kept the iOS project file, `index.js` and `Info.plist` from the iOS side; everything
Android-specific came across untouched. Read "Font resolution" below before building —
it is the one thing the merge could not decide.

---

## What changed in shared code since the Android port

Twelve commits touched `src/` and `index.js`. Grouped by what they mean for Android:

### 1. Two bugs that affect every platform

**The child could never be wrong.** Both Free Play and Adventure submitted the answer
~350 ms after the placed count *matched* the target. A child counting onward toward a
larger, wrong number was stopped and congratulated exactly as they passed through the
right one — overshooting was impossible, and every such problem was recorded as
first-try correct. Replaced with a single debounce that judges wherever the child stops.
`src/config/timing.ts` holds the constant (`STOP_JUDGE_MS = 2000`); tune it against a
real 4–6 year old on a device, since a slower tapper needs longer.

**A returning child could be trapped.** Restoring the last mode used made that screen the
navigation stack's `initialRouteName`, leaving it the only entry. Every way out of
Adventure is a pop — both ✕ buttons, the level back arrow, the watchdog — and a pop with
nothing beneath it is a silent no-op. Free Play was worse: it has no home button at all,
so the edge-swipe was the only exit and that needs a screen underneath too. Fixed in
`GameShell.tsx` by seeding the stack with Home beneath the restored route.
**This one is worth verifying on Android**, because the back gesture and the hardware
back button behave differently from iOS.

### 2. Content and difficulty

- New Adventure world **High Five!** — the five-structure, built from existing voice lines.
- Nine worlds, **82 levels** total (64 regular + 18 bonus).
- Difficulty curve repaired; the operand colour pair now meets contrast guidance.
- Free tier no longer bills the child for wrong answers.
- A three-rung hint ladder in Adventure: rephrase → dim and pulse the cells that need
  changing → walk the answer through one cell at a time, awarding one star.

### 3. iPad-shaped layout work (harmless on phones, useful on tablets)

Three screens picked their geometry from a phone. All three now read the shortest edge and
switch at 600 dp, which is the same threshold `useLayout.ts` already used:

- `AdventureWorldsScreen` — 2 columns on a phone, 3 on a tablet.
- `ModeChoice` — card column widens from 360 to 620, type and brand mark scale with it.
- `PlayerSetup` — modal widens from 420 to 860, theme grid goes 4-across to 5-across so the
  ten themes fill two rows exactly.

**Android tablets get this for free** and should be checked — a 10" tablet crosses the same
600 dp threshold as an iPad.

Also fixed here: the selected language was marked with a translucent white border, which
reads over the dark artwork of the top bar but is invisible inside the white setup modal.
`LanguageSwitcher` now takes `onLight` and `large`.

### 4. School Edition scaffolding — iOS only, but it touches shared files

`src/config/edition.ts` reads a build-time global. `IS_SCHOOL_EDITION` appears in
`GameShell`, `useIAP`, `usePremium`, `SettingsModal` and `AboutTenFrames`. On Android the
flag is simply never set, so all of it evaluates false and behaves exactly as before.
**No Android work is needed for this** — see the Play section at the bottom.

---

## Font resolution — decide this before building

The merge left **six** files in `assets/fonts/` and in `android/app/src/main/assets/fonts/`:

```
Fredoka.ttf          Fredoka_bold.ttf            <- from the iOS line (variable font)
Fredoka-Regular.ttf  Fredoka-Medium.ttf
Fredoka-SemiBold.ttf Fredoka-Bold.ttf            <- from the Android port (static faces)
```

iOS is settled: `Info.plist` registers only `Fredoka.ttf`, and the variable font exposes all
five instances through the family name `Fredoka`. Verified rendering on device.

Android resolves `fontFamily` from the **asset filename**, so the two sets imply different
values for `FREDOKA_FAMILY` in `src/utils/fonts.ts`, which is currently `'Fredoka'`:

- Keeping `Fredoka.ttf` + `Fredoka_bold.ttf` → family `Fredoka` works, weights come from the
  two files. This matches the current constant and needs no code change.
- Using the four static faces → they would resolve as `Fredoka-Regular` etc., and the
  constant would have to change, which would then break iOS.

**Recommendation: delete the four static faces from both asset folders** and keep the pair
the constant already points at. But this was never built or run on Android here, so confirm
on the Windows machine before deleting anything — if the static faces were added precisely
because the variable font failed to render on Android, keep them and instead give
`fonts.ts` a `Platform.select`.

---

## Release checklist

1. `git pull` — you will get 23 commits.
2. `npm install` (applies `patches/react-native-sound+0.13.0.patch` via patch-package).
3. Settle the font question above.
4. Bump `android/app/build.gradle`: `versionCode 12`, `versionName "1.6.3"`.
5. Build the AAB and test on a phone **and a tablet**.
6. Verify specifically:
   - the hardware back button and the back gesture out of Adventure and Free Play
   - that closing the app inside Adventure and reopening still lands somewhere you can leave
   - a wrong answer is actually recorded as wrong (place more counters than asked, wait 2 s)
   - Fredoka renders, in all three languages
7. Play Console → new release. What's New, three languages:
   - Layout reworked for tablets
   - Getting back to the home screen now works from anywhere in the app
   - New Adventure world: High Five!

`android/app/release/app-release.aab` was removed from git and added to `.gitignore` on your
branch — that is correct, keep it that way.

---

## Does Play need a School Edition? No.

**Google removed the purchasing channel that makes a School Edition worth building.**

Google's own documentation is explicit:

> "Managed Google Play no longer supports the ability to purchase app licenses. Your
> organization can still manage the app licenses it already owns, however it won't be
> possible to purchase any additional licenses."
>
> — [Manage app licenses, Managed Google Play Help](https://support.google.com/googleplay/work/answer/6150398)

The iOS School Edition exists for one specific reason: Apple School Manager buys **app
licences, not in-app purchases**, so a school that installed the free app got it with the
content locked and no institutional way to unlock it. A separate paid binary was the only
way to sell them the whole product.

On Play that reasoning has nothing to attach to. There is no bulk licence purchase to serve
— not for a paid app, not for anything. Google Play for Education, which did offer purchase
orders and bulk delivery, was shut down years ago. A school on Android can be *given* the
free app through managed Google Play, but cannot buy licences for a paid one.

So a paid "Ten Frames School Edition" on Play would be a second listing with no channel
behind it: no volume purchasing, no education discount mechanism, and a school buyer with no
way to pay for 30 devices at once.

**What to do on Android instead:** treat it as a consumer market. Parents, the free app, the
premium unlock. If institutional interest does appear there, the realistic routes are
direct licensing outside the store, or a promo-code batch — both manual, both worth doing
only once someone actually asks.

Reassess if Google restores bulk purchasing. Nothing suggests it will.
