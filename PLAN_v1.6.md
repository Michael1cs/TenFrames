# Plan v1.6 — „Smile Quest" (iOS Release)

> **Scop:** Atac global pe feedback-ul Google Play Education (21 apr 2026) folosit ca standard de calitate pentru lansarea iOS. Țintim Apple App Store cu accent pe „Made for Kids" și `Editor's Choice — Education`.
>
> **Mascotă:** **Zee** (stea pufoasă, schimbă culoarea după temă).
> **Voce:** ElevenLabs pre-generat, RO + EN.
> **Platforme:** iOS only pentru v1.6. Android rămâne pe v1.5 (re-submit Google în v1.7 după ce avem aprobare Apple ca semnal).

## Criterii de succes (acceptance la nivel de release)

- [ ] Toate cele 11 puncte de feedback Google adresate cu schimbări concrete și testabile
- [ ] Aplicația complet utilizabilă fără citire (audio + iconițe pentru profilul „5 și sub")
- [ ] Cel puțin 240 clipuri audio (≥120 RO + ≥120 EN) integrate
- [ ] Audit complet text RO/EN, fără greșeli de gramatică/ortografie
- [ ] Mascotă Zee prezentă în onboarding, Adventure, level complete și pop-up-uri
- [ ] Workshop mode funcțional cu min. 4 paleți tematice
- [ ] Daily Challenge generează 3 provocări/zi cu reset la miezul nopții local
- [ ] Beta TestFlight cu min. 5 părinți de copii 5-8 ani, fără bug-uri blocking raportate
- [ ] VoiceOver (iOS) trece audit pe toate ecranele principale
- [ ] App Store screenshots și promo text actualizate

---

## Pachet 1 — Text, font, profile vârstă (Săptămâna 1)

**Țintește:** Amount of text · Legibility · Grammar/spelling · Engagement for target age

### 1.1 Audit text RO/EN — ✅ DONE
- [x] Re-citire `src/i18n/locales/ro.json`:
  - „bilețele" → „bile" peste tot (consistent)
  - „Pădurea Număratului" → „Lunca numerelor"
  - Sentence case în titluri/butoane RO (corect gramatical)
  - Achievements lowercase: „Stea strălucitoare", „Campion la numărare" etc.
- [x] Re-citire `src/i18n/locales/en.json` (subtitle simplificat, descrieri scurte)
- [x] Reducere text în-joc:
  - `additionDesc`: „Sunt deja {{n}} bile..." → „Sunt {{n}} bile..."
  - `subtractionHint`/`additionHint`: forme mai scurte
  - `puzzleDesc`: mai natural „Câte mai trebuie până la 10?"
- [x] Plurale i18next (`_one`/`_other`) pentru: `youHave`, `starsReached`, `fillExactly`, `newStars`
- [x] Feedback pozitiv: `wrong` reformulat „Aproape! Mai încearcă!" (RO) / „Almost! Try again!" (EN)
- [x] Pagina `AboutTenFrames.tsx` rescrisă în 2 tabs (vezi 1.5)

### 1.2 Font nou (Fredoka) — ✅ DONE (cod), 🟡 LINKING TODO
- [x] Decizie font: **Fredoka** (rotunjit, prietenos, suport diacritice RO complete)
- [x] Variable font descărcat în [assets/fonts/Fredoka.ttf](assets/fonts/Fredoka.ttf) (de pe github.com/google/fonts)
- [x] [react-native.config.js](react-native.config.js) configurat cu `assets: ['./assets/fonts/']`
- [x] [src/utils/fonts.ts](src/utils/fonts.ts) — helper `getFredokaFamily(weight)` ce mapează fontWeight la PostScript name (Fredoka-Regular/Medium/SemiBold/Bold)
- [x] [src/utils/installFredoka.ts](src/utils/installFredoka.ts) — patch global pe `Text.render` + `TextInput.defaultProps` să injecteze fontFamily corect
- [x] Apelat în [index.js](index.js) înainte de `AppRegistry.registerComponent`
- [ ] **Linking nativ TODO** (rulezi tu):
  ```sh
  npx react-native-asset
  cd ios && pod install && cd ..
  npx react-native run-ios
  ```
  După linking, Info.plist va conține `UIAppFonts: [Fredoka.ttf]` și fontul va apărea în app.
- [ ] Verificare vizuală diacritice RO (ă, â, î, ș, ț) după linking

### 1.3 Mărimi & contrast — ✅ DONE (text bumps)
- [x] Bump fontSize +15-20% în componente cheie:
  - `CountingMode`: 22→26 (titlu), 14→18 (feedback), 28→32 (button), 56→64 (icon)
  - `NumberDisplay`: 36→44 (number), 28→34 (emoji)
  - `AdditionMode` + `SubtractionMode`: 18→21 (level), 24→28 (problem), 13→16 (hint), 36→40 (submit), 14→17 (feedback)
  - `PuzzleMode`: 14→18 (question), 13→16 (hint), 36→40 (submit), 13→16 (answer)
  - `ModeSelector` (vertical+bottom): 11→13 / 13→15 (labels), 18→22 (emoji), 9→11 (badges)
  - `MapNode`: 11→13, 24→28 (emoji), 10→13 (stars)
  - `WorldSelector`: 11→13, 10→12 (stars)
  - `AchievementsScreen`: 20→22 (title), 14→16 (progress), 14→16 (name), 11→13 (desc)
  - `StickerBook`: 20→22, 14→17 (category), 28→32 (emoji), 56→64 (cell), 8→10 (req)
  - `AchievementPopup`: 16→18 (label), 12→14 (desc)
  - `GameShell`: 15→17 (title), 10→12 (subtitle), 13→15 (badge/theme button)
  - `AdventureLevelScreen`: 14→17 (instruction)
  - `LevelCompleteScreen`: 14→16 (newBest, secondaryBtn)
  - `ModeChoice`: 13→15 (cardDesc)
  - `PlayerSetup`: bump general în task 1.4 + 18pt input, 22pt title
- [x] Mărire dimensiune target tap: `useLayout.cellSize` max 64→72pt pe telefon
- [x] `useAgeProfile.cellMinSize`: 64pt pentru young, 56pt pentru older (consumat în Pachet 4 pentru sandbox)
- [ ] Verificare contrast WCAG AA per temă — TODO (audit vizual când pornim app pe device)

### 1.4 Două profile vârstă în onboarding — ✅ DONE
- [x] `AgeGroup = 'young' | 'older'` adăugat în [src/types/game.ts](src/types/game.ts)
- [x] `PlayerData.ageGroup` cu default `'older'` (backwards compat) în [usePersistence.ts](src/hooks/usePersistence.ts)
- [x] State + setter în [useGameState.ts](src/hooks/useGameState.ts)
- [x] UI cards în [PlayerSetup.tsx](src/components/onboarding/PlayerSetup.tsx) (🐣 5 sau sub / 🚀 6-8 ani)
- [x] Hook [useAgeProfile.ts](src/hooks/useAgeProfile.ts) cu: `compact`, `autoVoice`, `showHints`, `availableModes`, `fontScale`, `cellMinSize`
- [x] [ModeSelector.tsx](src/components/layout/ModeSelector.tsx) acceptă `availableModes` și filtrează
- [x] [GameShell.tsx](src/components/layout/GameShell.tsx) load/save ageGroup, pasează la PlayerSetup și ModeSelector
- [x] Fallback automat: dacă `gameMode` nu e în `availableModes`, revine la `counting`

### 1.5 Refactor pagină „Despre" — ✅ DONE
- [x] [AboutTenFrames.tsx](src/components/info/AboutTenFrames.tsx) cu 2 taburi (Pentru copii / Pentru părinți)
- [x] Tab Kids: text simplu, font mai mare (17pt), o linie intro + 4 cards scurte
- [x] Tab Parents: textul academic actual (full content)
- [x] Chei i18n migrate sub `info.kids.*` și `info.parents.*`
- [x] Tabs cu state local + culoare accent activă

**Acceptance Pachet 1:**
- Onboarding cere vârsta înainte să porneasc
- Profile „5-" vede doar Counting + Workshop, fără text vizibil în joc
- Toate textele trec audit RO + EN fără erori
- Font Fredoka activ pe toate ecranele

---

## Pachet 2 — Voce ElevenLabs + sistem `useVoice` (Săptămânile 1-2)

**Țintește:** Words/sounds · Sound quality · Engagement · Usefulness of sound effects

### 2.1 Script complet pentru voce
- [ ] Generare `voice-script-ro.json` și `voice-script-en.json` cu toate replicile organizate pe categorii:
  - **numbers** (0-10, plus formă numărată „un', doi', trei'…")
  - **counting-rhythmic** (numărare rapidă 1-10 pentru levelup)
  - **instructions-counting** (3 variante)
  - **instructions-addition** (parametrizate „Sunt {{n}}, mai adaugă {{m}}")
  - **instructions-subtraction**
  - **instructions-puzzle**
  - **instructions-workshop**
  - **feedback-correct** (10 variante: „Bravo!", „Super!", „Așa!", „Ce repede!"…)
  - **feedback-try-again** (5 variante, fără cuvântul „greșit": „Mai încearcă!", „Ești aproape!"…)
  - **mascot-greeting** (intro Zee la onboarding)
  - **mascot-cheer** (la level complete)
  - **mascot-thinking** (când copilul stă mult fără acțiune)
  - **world-intro-counting** (poveste 6s pentru Lunca)
  - **world-intro-addition** (Insula)
  - **world-intro-subtraction** (Muntele)
  - **achievements-unlock** (10 variante scurte)
- [ ] Estimare totală: ~120 clipuri × 2 limbi = 240

### 2.2 Generare ElevenLabs
- [ ] Selecție voce RO (recomandat: voce feminină tânără, „Charlotte" sau „Alice" cu setting RO)
- [ ] Selecție voce EN (recomandat: voce copil-friendly, „Rachel" sau „Bella")
- [ ] Script de batch generation (Node script local cu API ElevenLabs)
- [ ] Output: `assets/audio/{ro,en}/{category}/{key}.mp3` (~3-5KB per fișier la bitrate 64kbps mono)
- [ ] Total estimat: ~3-5MB asset audio

### 2.3 Hook `useVoice`
- [ ] Creare `src/hooks/useVoice.ts`:
  - Pre-load lista (lazy per categorie)
  - Queue cu interrupt (replică nouă oprește pe cea veche)
  - Suport `play(key, params?)` și `playSequence([keys])`
  - Detectare limbă activă din i18n
  - Mute global (citit din settings)
  - Music ducking când vocea cântă (integrare cu `useSound` music layer)
- [ ] Integrare în `App.tsx` ca provider
- [ ] Înlocuire toate `Alert` și text-only feedback cu `voice.play(...)` + text scurt opțional

### 2.4 Setting voce
- [ ] Adăugare toggle „🔊 Voce" în onboarding (default ON)
- [ ] Buton mic 🔊 în header pentru toggle rapid
- [ ] Persistență `@tenframes_voiceEnabled`

### 2.5 Auto-voice per profil
- [ ] Profile „5-": la fiecare ecran nou, voce automat (fără intervenție)
- [ ] Profile „6-8": voce manuală (buton 🔊 lângă text), excepție feedback corect/greșit care e mereu auto

**Acceptance Pachet 2:**
- Toate ecranele au voce funcțională în RO și EN
- Schimbarea limbii din header schimbă imediat vocea
- Profilul „5-" e jucabil 100% fără citire
- Mute funcționează pe toate clipurile

---

## Pachet 3 — Mascot Zee (Săptămâna 2)

**Țintește:** Appeal · Creativity/imagination · Engagement

### 3.1 Asset mascotă
- [ ] Decidere format: **Lottie** (recomandat — animații fluide, ~50KB total)
- [ ] Generare/comandare 8 expresii Zee:
  - `idle.json` (loop blând, mișcă antene/ochi)
  - `happy.json` (sărit de bucurie)
  - `thinking.json` (își freacă bărbia/se uită în sus)
  - `cheer.json` (mâini sus, confetti)
  - `wave.json` (face cu mâna — pentru intro)
  - `encourage.json` (zâmbet blând, dă din cap)
  - `surprised.json` (când deblochezi achievement)
  - `sleeping.json` (pentru ecran inactiv lung)
- [ ] Asset path: `assets/mascot/zee/{state}.json`
- [ ] Color tinting per temă (Zee schimbă culoarea — folosim `lottie-react-native` cu color filter)

### 3.2 Componentă `Mascot`
- [ ] `src/components/mascot/Mascot.tsx` cu props:
  - `state: ZeeState`
  - `position: 'corner' | 'center' | 'hidden'`
  - `onPress?: () => void` (tap pentru a-l face să vorbească)
- [ ] State machine: tranziții fluide între expresii (auto-revine la `idle` după 2s)
- [ ] Bubble dialog opțional cu text scurt + voce sincronizată

### 3.3 Integrare Zee în UX
- [ ] Onboarding: Zee se prezintă (`mascot-greeting`)
- [ ] Adventure Map: Zee în colțul stânga-jos, react la tap pe nod
- [ ] Game screens: Zee mic în colț, react la corect (cheer) / try-again (encourage)
- [ ] Level Complete: Zee mare central cu animație victory
- [ ] Pop-up achievement / new sticker: Zee surprised
- [ ] Workshop: Zee comentează creațiile

### 3.4 Mini-cinematice intro lume
- [ ] Pe primul intro într-o lume nouă, joacă o secvență de 6s:
  - Zee + asset background lume + text scurt + voce
- [ ] Skip button după 1s
- [ ] Persistență „seenIntro" per lume

**Acceptance Pachet 3:**
- Zee apare în min. 5 contexte distincte
- Animațiile sunt fluide pe iPad și iPhone
- Tap pe Zee îi declanșează replică audio + animație

---

## Pachet 4 — Workshop Mode (sandbox creativ) (Săptămâna 2-3)

**Țintește:** Creativity · Critical thinking · Imaginative play · Replayability

### 4.1 Componentă `WorkshopMode`
- [ ] `src/components/game/WorkshopMode.tsx`
- [ ] Layout: ten frame mare în centru + paletă emoji jos
- [ ] Paletă cu 8 emoji-uri din tema activă (ex: tema Forest → 🦊🐰🐻🦔🌲🌺🍄🦋)
- [ ] Tap pe emoji → selectează „pensula"
- [ ] Tap pe celulă → pune emoji-ul selectat (sau înlocuiește)
- [ ] Long-press celulă → șterge

### 4.2 Întrebări reflecție
- [ ] După 3-5 secunde de activitate, Zee întreabă vocal:
  - „Câți {{emoji}} ai pus?"
  - „Mai poți adăuga 3?"
  - „Câte celule sunt goale?"
- [ ] Sistem de prompts în `src/utils/workshopPrompts.ts`

### 4.3 Galerie creații
- [ ] Buton 📸 „Salvează" → screenshot ten frame + emoji-uri
- [ ] Persistență max 20 creații în AsyncStorage (`@tenframes_workshop_gallery`)
- [ ] Galerie în RewardsHub (tab nou „Atelierul meu")
- [ ] Replay creație: încarcă starea exactă

### 4.4 Daily Workshop Challenge
- [ ] 3 provocări/zi generate de `src/utils/dailyChallenges.ts`:
  - „Fă un model cu 5 stele"
  - „Umple doar rândul de jos"
  - „Folosește exact 3 culori"
- [ ] Sticker special „Eroul Zilei" la completare

**Acceptance Pachet 4:**
- Workshop accesibil din ModeSelector (și pentru profile „5-")
- Min. 8 emoji per temă (×8 teme = 64 emoji-uri)
- Galerie persistă creații după restart
- 3 daily challenges noi în fiecare dimineață

---

## Pachet 5 — Daily Challenges + Replay objectives (Săptămâna 3)

**Țintește:** Replayability · Engagement

### 5.1 Daily Challenges screen
- [ ] `src/components/rewards/DailyChallenges.tsx`
- [ ] Card per challenge cu progres + recompensă
- [ ] Reset la 00:00 local (`useEffect` cu interval check)
- [ ] Notificare local push opțional „🌟 3 provocări noi te așteaptă!" (`@react-native-community/push-notification-ios`)

### 5.2 Replay objectives în Adventure
- [ ] Niveluri completate primesc 2 obiective bonus:
  - **Speed Run**: termină în <30s → ⭐ #4
  - **No Mistakes**: 0 încercări greșite → ⭐ #5
- [ ] Vizibile în `LevelCompleteScreen` și `MapNode`
- [ ] Total stele crește de la 3 la 5 per nivel

### 5.3 Calendar streak vizual
- [ ] Tab nou „🔥 Calendar" în RewardsHub
- [ ] Calendar lunar cu zile bifate (🔥 pe zile cu activitate)
- [ ] Highlight pentru streak activ
- [ ] Recompensă streak: 7 zile = sticker bonus, 30 zile = mascotă specială

### 5.4 Personalizare Zee
- [ ] Magazin Zee cu accesorii deblocabile cu stele:
  - Pălărie pirat (10 ⭐), coroană (25 ⭐), ochelari (15 ⭐), eșarfă (5 ⭐)…
  - Min. 12 items
- [ ] Asset path: `assets/mascot/accessories/{name}.png`
- [ ] Componentă `Mascot` acceptă prop `accessories: string[]`
- [ ] UI selecție în Settings sau ecran nou „Garderoba lui Zee"

**Acceptance Pachet 5:**
- 3 daily challenges generate corect cu reset la miezul nopții
- Niveluri vechi pot fi re-jucate pentru stele 4-5
- Min. 12 accesorii Zee deblocabile
- Calendar afișează corect streak-ul curent

---

## Pachet 6 — Sound design refresh (Săptămâna 3)

**Țintește:** Sound quality · Usefulness of sound effects

### 6.1 Înlocuire SFX
- [ ] Sursă: Pixabay / Mixkit / Freesound CC0
- [ ] Pachete noi:
  - 3 variante `tap_*.mp3` (folosim aleator)
  - `correct_1.mp3`, `correct_2.mp3`, `correct_3.mp3` (tonuri ascendente per consecutive corecte)
  - `try_again.mp3` (înlocuiește `wrong.wav` — sunet jucăuș, nu de eșec)
  - `star.mp3` cu sparkle layer
  - `levelup.mp3` cu fanfară mai bogată
  - `sticker_unlock.mp3` (nou)
  - `achievement_unlock.mp3` (nou)
  - `streak_milestone.mp3` (nou)
- [ ] Update `src/hooks/useSound.ts` cu noile categorii și random pick

### 6.2 Muzică ambient per lume
- [ ] 3 loop-uri ~30s, low volume:
  - `assets/music/meadow.mp3` (folk vesel pentru Lunca)
  - `assets/music/island.mp3` (ukulele tropical pentru Insula)
  - `assets/music/mountain.mp3` (clinchete-aventură pentru Muntele)
- [ ] 1 loop pentru meniu/onboarding: `assets/music/menu.mp3`
- [ ] Hook nou `useMusic` cu fade-in/fade-out și ducking când voce cântă

### 6.3 Settings audio
- [ ] Trei toggle-uri separate: 🔊 SFX / 🎙️ Voce / 🎵 Muzică
- [ ] Sliders volume (3 nivele: low/medium/high)

**Acceptance Pachet 6:**
- Tap-ul nu mai sună identic la apăsări succesive
- Muzica face fade când Zee vorbește
- Toate cele 3 toggle-uri persistă și funcționează independent

---

## Pachet 7 — Polish & QA (Săptămâna 4)

### 7.1 Beta TestFlight
- [ ] Identificare 5-10 părinți cu copii 5-8 ani
- [ ] Build TestFlight v1.6.0 build 1
- [ ] Form Google Forms cu întrebări structurate (ușurință, voce, mascotă, ce le-a plăcut)
- [ ] 1 săptămână de testare
- [ ] Triaj feedback și fix iteration → build 2

### 7.2 Audit accesibilitate iOS
- [ ] VoiceOver pe toate ecranele principale (onboarding, adventure, game, rewards)
- [ ] Toate butoanele cu `accessibilityLabel`
- [ ] Test cu Reduce Motion ON (anim. mascotă rămân safe)
- [ ] Test cu Increase Contrast ON

### 7.3 Apple App Store assets
- [ ] Screenshot-uri noi (6.7" iPhone + 12.9" iPad):
  - Frame 1: Onboarding cu Zee
  - Frame 2: Adventure Map cu mascotă în colț
  - Frame 3: Workshop creație cu emoji
  - Frame 4: Level complete cu stele
  - Frame 5: Galerie sticker book + Zee
- [ ] Promo text rescris cu accent pe „voice narration" și „creative sandbox"
- [ ] Update privacy nutrition labels (verificare că mascotă nu adaugă tracking)
- [ ] App preview video opțional 15-30s

### 7.4 Submit App Store
- [ ] Final QA pe iPad și iPhone fizic
- [ ] Submit pentru review
- [ ] Pregătire răspuns la întrebări App Review

**Acceptance Pachet 7:**
- Build TestFlight verificat de min. 5 părinți
- Aprobat App Store review

---

## Stack tehnic adăugat (dependențe noi)

| Lib | Scop |
|---|---|
| `lottie-react-native` | Animații Zee |
| `@react-native-community/push-notification-ios` | Daily challenge reminders |
| ElevenLabs API (extern) | Generare voci RO/EN one-time |

## Riscuri și mitigări

| Risc | Mitigare |
|---|---|
| ElevenLabs RO calitate slabă | Test cu voce „Charlotte"/„Alice" + cumpărare 1 lună credit pro dacă nevoie |
| Lottie performance pe device-uri vechi | Profilăm pe iPhone 8/iPad Air 2; fallback PNG dacă <30fps |
| Mărimea APK/IPA crește mult | Audit final; folosim mp3 64kbps mono pentru voce (~3-5KB per clip) |
| App Store respinge ca prea similar cu v1.5 | Highlight în notes „Major rewrite: voice narration, mascot, sandbox mode" |
| Prea multe schimbări → bug-uri | Fiecare pachet merge într-o branch separată, merge după QA |

## Roadmap post-v1.6

- **v1.7**: Re-submit Google Play Education + Android parity
- **v1.8**: Mai multe sandbox-uri (multiplicare timpurie cu ten frames duble?)
- **v1.9**: Multilingvism extins (ES, FR, DE — piețele EU)
