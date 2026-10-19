# Connector Learning Game

Connector is a browser-based learning game for young children. It includes maths, science, and logical-reasoning questions, helpful hints, level progress, and keyboard controls.

## Requirements

- [Node.js](https://nodejs.org/) 22.13 or later
- npm (installed with Node.js)

## Run locally

### Easiest Windows start

Double-click `Start-Game.exe` in the project folder. It starts the game, opens it in your default browser, and prints the Wi-Fi address that a phone on the same network can use. Keep its window open while playing; press `Ctrl+C` there to stop the game.

The first time you set up the project, run `npm ci` so the game dependencies are available.

Clone the repository and start the development server:

```bash
git clone https://github.com/romil95/connector.git
cd connector
npm ci
npm run dev
```

Open the local URL shown in the terminal (usually `http://localhost:3000`) in a browser.

To stop the server, press `Ctrl+C` in the terminal.

## Production-style local run

Build the game first, then start the production server:

```bash
npm ci
npm run build
npm run start
```

## How to play

### Puzzle Adventure (start here)

The welcome screen opens **🧩 Puzzle Adventure** — picture puzzles in the style of junior logical-reasoning olympiads (like LogIQids), made for ages 4–6. No reading needed: every question is read aloud.

- **Twelve islands**, one per skill: Pattern Park (patterns), Odd One Island, Counting Forest, Number River (adding and missing numbers), Pairs Palace (analogies), Story Steps (putting things in order), Maze Mountain (paths and arrow "coding"), Shadow Cave (match shapes to shadows), Mirror Lake (mirror images and turned pictures), Hide & Seek Town (above, under, left, right, between), Balance Bridge (reading scales, heaviest/lightest, "how many balance?") and Sudoku Garden (3×3 then 4×4 picture Sudoku).
- **👑 Boss puzzle**: the fifth puzzle of every island game is one level harder.
- **Name the fox**: tap the fox on the map to pick a name; the game then uses it ("Help Tiku reach the berries!").
- **Brain Gym**: five mixed puzzles a day, with a 🔥 day streak.
- A game is **5 puzzles**, then a new sticker for the **sticker book**. After three games the fox suggests a break.
- **Think first**: answers wake up after the question has been read.
- **Stars**: ⭐⭐⭐ first try, ⭐⭐ second try, ⭐ after help. Wrong answers are greyed out. After two misses the game explains the answer and makes it glow.
- **Adaptive levels (1–10 per island)**: three first-try answers in a row → level up; two misses on one puzzle → level down. The 🟡 dots on each island show the level.
- **For grown-ups**: open the sticker book and **press and hold** *For grown-ups* for 2 seconds to see per-skill levels and first-try rates.

### Level quizzes and Discovery missions


### Discovery missions

Maths and Science open on **Level quizzes** (read aloud, answers shuffled, gentle maths climb from sums within 5 up to tens and ones). **Discovery missions** are one tap away and work best with a grown-up. Choose Explore, Stretch, or Challenge; all are available without completing earlier levels.

- **Maths:** build sums with tens and ones, subtract with automatic regrouping, and make equal groups. Check the model, then choose an explanation. Practice changes the numbers.
- **Science:** predict, run an on-screen model, and explain the evidence. Then change materials, temperature, or a card’s position in the interactive lab.
- Earn three discovery stars for completing an explanation, even after clues or retries. Repeating a completed challenge does not inflate the star total. Discovery progress stays in this browser, separately from quiz progress.
- **Read aloud** reads the current activity using browser speech support. **Level quizzes** returns to the original game; Logic remains available.
- After three different challenges in one visit, the game suggests a break and a conversation about what was learned. Science models are simplified; optional real-world activities should involve an adult.

- Select **Maths**, **Science**, or **Logic** from the top navigation.
- Choose an answer by clicking it or pressing `1`, `2`, `3`, or `4` (including the numpad).
- After a correct answer, press `Enter` or choose **Next level**.
- In Maths, click either number in a sum to view its expanded form, such as `32 = 30 + 2`.
- In Science, use **Need a clue?** for a simple real-world example.
- Use the level groups on the side to view progress in blocks of ten levels.

## Useful commands

```bash
npm run dev       # Start local development
npm run build     # Create and validate a production build
npm run start     # Run the production build locally
npm test          # Run the project checks
```

## Project structure

- `app/page.tsx` — game content and interaction logic
- `app/globals.css` — responsive game styling
- `public/images/` — Connector logo assets
