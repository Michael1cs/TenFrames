# Android — shipping the 1.7.x line

Play last shipped **1.6.3 (versionCode 12)** from the Windows machine. Since
then the main line gained 1.7.0 (Answer/Compare modes, Number Town, the
celebration rebuild), 1.7.1 (crowns + graduated free tier, Hungry Monsters,
99 voice lines, Xcode 27 / UIScene fixes on the iOS side) and the
`feature/adventure-visuals` work (world illustrations, mascot, haptics,
the audit fixes). None of it has shipped anywhere yet — 1.7.1 build 16 was
rejected by Apple for an iOS 27 launch crash and the next submission
includes everything.

`android/app/build.gradle` is at **versionCode 16, versionName "1.7.1"**. If
a 14 or 16 was already uploaded to Play from the laptop, bump versionCode.

## What changed for the Android build specifically

- `npm install` brings **react-native-haptic-feedback** (autolinked; its
  manifest carries the VIBRATE permission — nothing to add).
- Phones are locked to portrait, tablets keep both orientations:
  `res/values/bools.xml` + `res/values-sw600dp/bools.xml` +
  `MainActivity.onCreate`. No manifest change.
- `assets/fonts/Fredoka*.ttf` now contain ă ș ț (patched with
  `scripts/add-romanian-glyphs.py`); `npx react-native-asset` copies them to
  `android/app/src/main/assets/fonts/`.
- Every new voice clip is already in `android/app/src/main/res/raw/`.
- AsyncStorage 3.1.1 (local Maven KMP artifact, as before).

## Release checklist

1. `git pull`, `npm install`.
2. Build the AAB, test on a phone **and a tablet**. Verify:
   - the premium unlock end-to-end on Play Billing 9.1 / react-native-iap 15
     (the first release on it), then force-quit and relaunch: premium must
     survive the restart
   - a crowned level opens the parental gate first, never the price
   - Adventure → Ferma (Farm Share): give by tapping a basket
   - a correct answer: the mascot hops on the feedback card, no confetti
   - Romanian text: ă ș ț in the app font
   - phone stays portrait; tablet rotates
3. Play Console → new release. What's New (keep it positive, no bug talk):
   - EN: A brand-new Adventure world — Hungry Monsters — and a friendly new
     mascot who cheers every right answer. Clearer spoken instructions, new
     world illustrations, and a smoother, quieter game throughout.
   - RO: O lume nouă în Aventură — Monștri flămânzi — și o mascotă prietenoasă
     care se bucură la fiecare răspuns corect. Instrucțiuni vocale mai clare,
     ilustrații noi pentru lumi și un joc mai lin și mai liniștit peste tot.
   - DE: Eine brandneue Abenteuer-Welt — Hungrige Monster — und ein
     freundliches Maskottchen, das jede richtige Antwort feiert. Klarere
     Anweisungen, neue Welt-Illustrationen und ein ruhigeres, flüssigeres
     Spiel überall.

## School Edition on Play: still no

Managed Google Play no longer sells app licences, so the institutional case
the iOS School Edition serves does not exist on Android. One Play app, with
the in-app unlock, remains correct.
