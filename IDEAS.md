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

## Two ways to order this — and they disagree

**By market expansion** (the one that matters): each app should open a *new
school year*, because that is a new budget line at the same institution. A
school that buys Ten Frames for reception can buy Base Ten for Year 2 — two
sales, same customer, no cannibalisation. Under this logic Ten Frames is the
beachhead and every later app should climb the age ladder.

**By build cost**: the cheapest next app is the one that stays inside the
number range and mechanics we already have.

These point in opposite directions, and market expansion wins. Recorded here
so the tension is visible, not so it gets re-argued:

| Concept | School years | Voice cost | Expands the range? |
|---|---|---|---|
| Ten Frames *(shipped)* | Reception / K, ages 4–7 | — | beachhead |
| **Rekenrek** | same as Ten Frames | ~30 clips | **no — overlaps** |
| **Number Bonds** | K–Y1 | ~30 clips | barely |
| **Base Ten / Place Value** | Y1–Y3, ages 6–8 | ~270 clips + regrouping | **yes, one full band up** |
| **Arrays & Multiplication** | Y2–Y3 | ~270 clips | yes |
| **Fractions** | Y2–Y4 | ~120 clips | yes, and the widest span |

So **Base Ten is the right app #2** despite being the expensive one: it is the
first concept that opens a grade band Ten Frames cannot serve, and the
incumbents there are genuinely ancient (2012, $0.99, digital manipulatives
rather than games).

Rekenrek and Number Bonds are cheap but sell to a customer who already owns
Ten Frames and is being taught the same maths. They are better as *features
inside* Ten Frames — a rekenrek is a second representation of exactly the
composing-to-five-and-ten that High Five! already teaches — than as separate
products. Fractions is the widest age span and the best School Edition price
($9.99–$14.99), so it is the strongest third.

**Reuse is a nice-to-have here, not a requirement.** The 68.6% shell means a
second app costs weeks rather than months, but if a concept needs a completely
different board, that is fine — the mascot, voice, rewards, adventure map,
School Edition build and store positioning all still carry over, and those are
the parts that took years, not the grid renderer.

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
*Cost: high (numbers to 100 × 3 langs, new renderer). The audience shift to
6–8 is the **point**, not a drawback — it is a new school year and a new
budget line at schools that already own Ten Frames. **App #2.***

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
*Cost: lowest of the five — but it sells to a customer who already owns
Ten Frames. Probably stronger as a second representation inside Ten Frames
than as its own product.*

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
