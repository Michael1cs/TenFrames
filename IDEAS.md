# Ideas — the app family after Ten Frames

Running list. Nothing here is committed to; the point is to keep the reasoning
attached to each idea so we don't re-litigate it later.

---

## The strategy: one engine, several manipulatives

Ship separate, narrowly-named apps that share almost all their code, mascot,
voice, rewards and UI — Ten Frames, Base Ten, Number Bonds, Rekenrek, Fraction
Lab. A teacher searching *"rekenrek app"* finds exactly the tool they wanted,
not a 50-game bundle with menus.

**The reuse claim is real — measured, not estimated.** Counting `src/` today:

| | lines | share |
|---|---|---|
| Shell — layout, rewards, feedback, premium, onboarding, adventure map, themes, persistence, voice queue, i18n, IAP, School Edition | **11,097** | **68.6%** |
| Mechanic-specific — `components/game`, `mathProblems`, `adventureWorlds`, `voice/script` | 4,638 | 28.7% |
| Other | 434 | 2.7% |

And 1,364 of those "mechanic" lines are `voice/script.ts`, which is a data
file, not logic. **Actual ten-frame-specific logic is ~20% of the codebase.**

So a second app is realistically: keep the shell, swap the board renderer, swap
the problem generator, write a new world config, record new voice.

**What has to be extracted first** (none of it is hard, all of it is work):
`GameShell` currently hard-codes the seven game modes and the ten-frame board;
`AdventureLevelScreen` hard-codes `gameMode` branches; `TenFrame` is imported
directly rather than injected. Before app #2, the shell needs the board and
the problem generator to become props, not imports. Estimate: 3–5 days, and it
should be done *as part of* app #2 rather than speculatively.

---

## The constraint that decides the order: voice

The voice library is 1,275 clips **per language**, 3,810 files, ~56 MB, all
generated with a pinned ElevenLabs voice per language. Every new spoken line
costs 3× generation and has to match the existing library exactly.

**Verified today: `num_*` clips exist only for 0–10. Nothing above ten.** No
`tens`, `ones`, `regroup`, or any teen/decade word in any language.

That single fact reorders the roadmap, because each concept needs a different
number range:

| Concept | Range needed | New number words (×3 langs) | Verdict |
|---|---|---|---|
| **Rekenrek** | to 20 | 10 words → ~30 clips | cheapest by far |
| **Number Bonds** | to 10 / 20 | 0–10 already exist; ~30 for the 20 tier | cheap |
| **Fractions** | fraction names | ~30–40 names → ~120 clips | moderate |
| **Base Ten** | to 100 | 90 words → ~270 clips, plus regrouping vocabulary | expensive |
| **Arrays / Multiplication** | products to 100 | same 270 + "times" phrasings | expensive |

Plus instruction and praise lines on top of the number words in every case.

---

## Where I'd disagree with the proposed order

Proposed: Base Ten → Number Bonds → Rekenrek → Fractions → Arrays.

**I'd put Rekenrek second, not fourth.** It is the cheapest possible next app
by a wide margin:

- Same number range as Ten Frames (to 20), so ~30 new number clips instead of 270.
- Same mechanic family: composing and decomposing against anchors of 5 and 10 —
  the app *already* teaches this (the High Five! world is exactly the
  five-structure, and Make-Ten Beach is exactly bonds to ten).
- The board is two rows of ten beads. Structurally close to the existing
  renderer; genuinely a different manipulative to a teacher, but not a new
  engine to us.
- Weak incumbent: the reference app is free, open-ended, and rated ~2.5.
  Nobody has made it a game.
- It is the fastest way to test whether the *family* strategy works at all —
  whether one institutional buyer who took Ten Frames will take a second app.

**Base Ten is the bigger prize but the bigger bill.** It extends school life
past ten frames (Y1–Y3 rather than reception), the incumbents are genuinely
ancient (2012, $0.99), and place value + regrouping is a real curriculum spine.
But it needs numbers to 100 in three languages, a new renderer (rods, flats,
place-value columns), and it shifts the audience up from 4–6 — which the app
was deliberately re-targeted *to* in v1.6.

Do it second-to-last, when the engine is extracted and the voice pipeline has
been run once more.

**Fractions** is the one that could carry a $9.99–$14.99 School Edition,
because it spans several school years. Worth its own analysis when we get there.

---

## Before app #2: the App Store analysis

Agreed, and it should gate the decision. Survey 20–30 K–3 maths concepts on:
competitor count, price, ratings, last-updated date, whether a School Edition
exists, implementation cost against our engine, and likely teacher search
volume. Then rank on demand ÷ (competition × build cost) and pick 3–5.

Two things to fold in that are specific to us:

- **Search intent is the whole distribution thesis.** The list should record,
  for each concept, whether teachers actually search that word. "Ten frame"
  brought 21 App Store searches in three months, and *institutional* purchases
  brought 160 — so the real question is not consumer search volume but whether
  the term appears in the Apps and Books catalogue searches administrators run.
- **Voice cost per concept**, using the table above as the template. It is the
  single biggest driver of build time and nobody outside this repo would
  guess it.

---

## Concepts, captured

### 1. Base Ten / Place Value
Build 23 as 2 tens + 3 ones; drag ten ones together and watch them unitise into
a ten; then 34 + 28 with regrouping to 62. Covers place value, addition,
subtraction and regrouping — longer school life than ten frames.
Incumbents old (Base Ten Blocks 2012 $0.99; Hands-On Math Base Ten $2.99), and
they are digital manipulatives rather than games.
*Cost: high (numbers to 100 × 3 langs, new renderer, audience shifts to 6–8).*

### 2. Number Bonds
`7 + ? = 10`, `? + 6 = 10`, `14 = 8 + ?`. Shown as bond triangles/circles
alongside ten frames, counters and a bar model — the multi-representation move
the competitive research flagged as our biggest missing pedagogy.
Active category: Number Bonds KS1 (5–7), Squeebles Number Bonds ($3.99, bonds
to 10/20/50/100).
*Cost: low at the 10 tier — Make-Ten Beach already does this maths. The value
is the bar model and the bond diagram, not new arithmetic.*

### 3. Rekenrek
Two rows of ten beads. "Show 7" → 5 red + 2 white. Then "make 10", then 7 + 6
via 7 + 3 + 3. Anchors of five and ten, composing/decomposing, subitizing.
Incumbent (Rekenrek by mathies) is free, open-ended, ~2.5 stars — a tool, not
a game.
*Cost: lowest of the five. **My pick for app #2.***

### 4. Fractions
Fraction bars, circles, pizzas. `1/2 = ?/4`, which is larger 3/4 or 2/3, build
5/8, make one whole. Competitors exist (FracTopia: circles, bars, grids,
comparison, operations).
*Cost: moderate. Best School Edition price potential ($9.99–$14.99) because it
spans several grades.*

### 5. Arrays & Multiplication
Build 3 × 4 as a grid, then show 4 + 4 + 4 = 12 and both 3 × 4 and 4 × 3; later
the area model, 13 × 4 → 10×4 + 3×4. Grade 2–3. Manabies School Edition is new
and leads on exactly this, which confirms the approach is current.
*Cost: high (same number range problem as Base Ten).*

---

## Deliberately not

**"Grade 1 Math — 50 Games".** Crowded and defended (RosiMosi 2nd Grade
Learning: School Ed, $19.99, 21 games across subjects). Our advantage is the
opposite shape: one manipulative, named exactly as the teacher searches for it,
no accounts, no ads, no subscription, no menus.

**A single "Manipulatives" super-app.** One exists already (Manipulatives:
Hands-On Math — ten frames, rekenrek, hundred chart, linking cubes, fraction
tiles, geoboard, on subscription + lifetime unlock). It confirms the category
is coherent, but it competes as a whiteboard for teachers. Ours should stay
game-like and child-driven — the unoccupied position the competitive research
identified: *pedagogically serious model + reward loop + voice + no adult in
the loop*.
