# Connector — Improvement Plan (target player: age 5, Senior KG)

Goal: make Connector **fun, genuinely challenging, and engaging** for a 5-year-old, using
junior logical-reasoning olympiad (KG / Class 1) style puzzles as the model for the Logic track.

---

## 1. Review — what's there today

**Working well**
- Warm, personal welcome (greets the child by name), big colourful buttons, celebration burst, spoken praise.
- Rods-and-blocks place-value visuals (Learn screen + Medium maths hint) — good concrete maths.
- Discovery missions use a solid predict → observe → explain loop.
- Keyboard 1–4 controls, progress saved in the browser, level map.

**Problems for a 5-year-old (most important first)**

| # | Issue | Where | Why it matters |
|---|-------|-------|----------------|
| 1 | **Too much reading.** Questions are text ("Which gas do plants take in…"). Read-aloud exists only inside Discovery; the quiz only speaks "Wow!/Awesome!" | `page.tsx` quiz card | A Senior KG child can't play alone — they need an adult to read every question. |
| 2 | **Difficulty jumps far past age level.** Maths "Easy" is already up to 89 + 9 with carrying; Medium is 2-digit + 2-digit. Science Medium covers photosynthesis, condensation, gravity, Saturn — Class 3–5 content. Logic Medium has ×2 doubling (3,6,12,24) and square numbers (1,4,9,16). Discovery "Challenge" = 46 + 17 and 4 × 6. | `MATH_LEVELS`, `SCIENCE_LEVELS` Medium, `LOGIC_LEVELS` Medium, `discovery-model.ts` | Frustration → the child either quits or guesses. |
| 3 | **Guessing always wins.** 4 options, unlimited taps, still earns 1 star. Answer slot also rotates predictably (`index % 4`), and maths wrong answers are always answer+2 / −3 / +5. | `pick()`, `mathChoicesFor`, `scienceChoicesFor` | No real challenge; kids discover tap-everything fast. |
| 4 | **Logic is only 2 puzzle types** (Odd One Out, What Comes Next), and the Easy odd-ones are trivial (3 animals + an apple). | `LOGIC_LEVELS` | Junior olympiad papers mix ~10 reasoning types; this is the most "brainy" part of the game and it's the thinnest. |
| 5 | **Some answers are ambiguous.** 🐧🐬🐋🦈 (penguin? shark is the only fish…), 25/12/18/24 (odd one? not a multiple of 6? not a multiple of 3?). | Logic Medium | Correct thinking gets marked wrong — bad for confidence. |
| 6 | **Everything is multiple-choice tapping.** No dragging, building, drawing paths or ordering. | Quiz mode | 5-year-olds stay engaged through *doing*, not selecting. |
| 7 | **Default screen is Discovery mode** with dropdowns, "field notebook", "fair comparison" text. | `discoveryMode` defaults `true` | Parent-oriented UI is the first thing a child sees. |
| 8 | **Weak reward loop.** Stars are just a counter; nothing to spend/collect; 70-level linear grind; music is a 4-note loop forever. | Header, `startMusic` | Little reason to come back tomorrow. |
| 9 | **Scaffold leftovers**: `chatgpt-auth.ts`, `db/`, `drizzle`, `examples/d1`, Cloudflare/D1 config unused by the game. | repo root | Noise for future changes. |

---

## 2. Design principles for a 5-year-old

1. **Zero reading required.** Every prompt is spoken automatically and shown as pictures. Text is for the parent.
2. **Short sessions.** A "game" = 5 puzzles (~5–8 min), ending with a reward. Then suggest a break.
3. **Challenge = "just a little hard."** Target ~70–80 % first-try success with an adaptive level, not a fixed list.
4. **Thinking beats tapping.** First-try answers earn the most; wrong taps cost something small and fair.
5. **Do, don't just pick.** Drag, order, trace a path, build — at least half the puzzle types are hands-on.
6. **Every mistake teaches.** After 2 wrong tries, show *why* with an animation (not just "Nearly!").

---

## 3. Olympiad-style puzzle types to add (KG / Class 1 level)

These are the reasoning areas typical of junior reasoning-olympiad papers, turned into original, picture-only puzzles.
Each should be a **generator** (random but valid) with 3 difficulty tiers, not a hard-coded list.

| Type | Example (Tier 1 → Tier 3) | Interaction |
|------|---------------------------|-------------|
| **Patterns (2 attributes)** | 🔴▲ 🔵● 🔴▲ ? → colour+shape change together → size grows each step | Drag the missing tile |
| **Pattern in the middle** | ⭐ ? ⭐ 🌙 ⭐ 🌙 — gap not at the end | Drag into gap |
| **Odd one out by attribute** | 3 red things + 1 blue → 3 things that fly + 1 that swims → 3 shapes with 4 corners + triangle | Tap |
| **Analogies** | 🐶→🦴 as 🐰→? (🥕) ; 🐣→🐔 as 🐛→? (🦋) | Tap |
| **Counting in a picture** | How many ⭐ in a cluttered scene? → How many triangles hidden in this shape? | Tap number / count-tap each one |
| **Position & direction** | "Which toy is *under* the table?" "Who is *second* in the line?" → left/right of a character facing you | Tap in a scene |
| **Mirror & rotation** | Which picture is the mirror of this? → Which shape is this one turned around? | Tap |
| **Shadow / silhouette match** | Match 🐘 to its shadow → shadows of similar animals | Drag |
| **Spot the difference / what's missing** | Two pictures, find 1 → 3 differences | Tap |
| **Sequencing a story** | Seed → sprout → plant → flower; egg → chick → hen | Drag 3–4 cards into order |
| **Mazes & arrow coding** | Help the fox reach the berry → write the path with ⬆️➡️ arrows (pre-coding) | Trace / place arrows |
| **Balance scales** | Which side is heavier? → 1 🍉 = 2 🍍, so which balances? | Tap |
| **Grid puzzles (mini-Sudoku)** | 3×3 with fruits, each row/column has one of each → 4×4 | Drag |
| **Compare & measure** | Tallest / shortest, most / fewest, longest pencil | Tap |
| **Simple word-free maths reasoning** | 🍎🍎 + 🍎 = ? ; "If 🐶=2 and 🐱=3, 🐶+🐱=?" | Tap / build |

Fix existing Logic content: remove ambiguous items, move doubling/square-number sequences to a later "Super" tier (or remove), and replace trivial odd-ones with attribute-based ones.

---

## 4. Re-pitch Maths and Science to the player’s age

**Maths (KG → early Class 1)**
- Tier 1: count objects to 10, more/less, number before/after, add within 10 with pictures.
- Tier 2: add/subtract within 20 with ten-frames; number bonds to 10.
- Tier 3: tens and ones to 50 with rods and blocks (keep the existing visuals — they're good); add 2-digit + 1-digit *without* carrying first, carrying last.
- Distractors: generate from common mistakes (off-by-one, counted the wrong group) and **shuffle positions randomly** each time.

**Science** — keep the 50 Easy questions but make them picture-first and spoken. Move the current 20 Medium questions to a hidden "Big Kid" pack. Discovery missions: keep magnets / ice / shadows at the *Explore* tier only, as animated mini-experiments the child can poke.

---

## 5. Engagement & reward loop

- **Adventure map instead of 70 numbered boxes**: islands (Pattern Park, Shape Forest, Number River, Maze Mountain…). Each island = one puzzle family. Original mascot (the 🦊 already in the game — let the child pick its name).
- **Sticker book**: each completed 5-puzzle game earns a sticker; full pages unlock a new mascot outfit or a new island. Collection beats a raw star count.
- **Star rules**: ⭐⭐⭐ first try, ⭐⭐ second try, ⭐ after the explanation. Tapping all 4 can't earn more than 1.
- **"Think first" moment**: options appear ~1.5 s after the question is spoken, so the child looks before tapping.
- **Boss puzzle** at the end of each island — a 2-step puzzle (e.g. pattern + count).
- **Daily "Brain Gym"**: 5 mixed puzzles, one per day, with a calendar streak flame.
- **Voice & sound**: auto-speak every prompt (Indian-English voice if available, adjustable speed); praise that names the skill ("You spotted the pattern!"); replace the endless 4-note loop with short cues + optional soft background.
- **Gentle stop**: after ~3 games, mascot says it's tired and suggests showing Mum/Dad what they learned.

---

## 6. Adaptive difficulty

Per puzzle family, keep a level (1–10):
- 3 first-try correct in a row → level up.
- 2 misses in one puzzle → level down one notch, show the explanation, then give an easier one of the same type.
- Mix: ~70 % current level, 20 % easier (confidence), 10 % one level up (stretch).
Store in `localStorage` per family; show it to parents only.

---

## 7. Grown-up corner (behind a parent gate, e.g. "hold for 3 seconds")

- Per-skill progress (patterns, spatial, counting…) and which puzzles caused most mistakes.
- Toggles: sound, voice speed, session length, which islands are on.
- "Talk about it" prompts for the parent after a session.

---

## 8. Phased roadmap

| Phase | Scope | Effort |
|-------|-------|--------|
| **0 — Hygiene (do first)** | Remove unused scaffold (`chatgpt-auth.ts`, `db/`, drizzle, `examples/`); split `page.tsx` into components. | ½ day |
| **1 — Playable alone** | Auto read-aloud for every question; default to quiz/adventure view (Discovery behind a button); random answer positions; new star rules; "think first" delay; remove ambiguous/over-age content. | 1–2 days |
| **2 — Puzzle engine** | A `Puzzle` interface (`generate(tier)`, `render`, `check`, `explain`) + 6 first types: 2-attribute patterns, attribute odd-one-out, analogies, counting in a scene, sequencing story cards (drag), mazes. | 3–4 days |
| **3 — Adaptive + sessions** | Per-family levels, 5-puzzle games, end-of-game reward screen, Daily Brain Gym. | 2 days |
| **4 — World & rewards** | Island map, sticker book, mascot naming, boss puzzles, sound redesign. | 3 days |
| **5 — More puzzle types** | Mirror/rotation, shadows, position words, balance scales, mini-Sudoku, arrow coding, spot the difference. | ongoing, ~½ day each |
| **6 — Grown-up corner** | Parent gate, skill report, settings. | 1 day |

**Play-test with the child after Phase 1 and after Phase 2.** Watch for: where they ask for help, where they tap randomly, what they want to replay. Adjust tiers from that, not from guesses.

---

## 9. Success measures

- Plays a full 5-puzzle game without an adult reading anything.
- First-try success settles around 70–80 % per family (adaptive is working).
- Asks to play again the next day; sticker book is something they show you.
- Can explain one answer in their own words ("the colours go red, blue, red…").

---

## 10. Progress (updated 11 Oct 2026)

| Phase | Status |
|-------|--------|
| 0 — Hygiene | ✅ Lock file re-synced so `npm ci` works; unused hosting scaffold removed; `page.tsx` split into `app/quiz/*` components. |
| 1 — Playable alone | ✅ Auto read-aloud (Indian-English voice when available), think-first delay, shuffled answers, realistic maths distractors, help after 2 misses, quizzes default, over-age science parked, gentler maths climb. |
| 2 — Puzzle engine | ✅ `app/puzzles/model.ts` (pure, tested) + `PuzzleAdventure.tsx`. |
| 3 — Adaptive + sessions | ✅ Levels 1–10 per island, 5-puzzle games, Brain Gym with day streak. |
| 4 — World & rewards | ✅ Island map, 30-sticker book, name-the-fox, 👑 boss puzzles, softer music. |
| 5 — More puzzle types | ✅ Shadow Cave, Mirror Lake, Hide & Seek Town, Balance Bridge, Sudoku Garden (12 islands total). ⏳ Spot-the-difference not built yet. |
| 6 — Grown-up corner | ✅ Press-and-hold gate → per-island level, games played, first-try %. |

**Next:** play-test and tune levels; spot-the-difference; optional settings (voice speed, session length).
