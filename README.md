# Connector Learning Game

Connector is a browser-based learning game for young children. It includes maths, science, and logical-reasoning questions, helpful hints, level progress, and keyboard controls.

## Requirements

- [Node.js](https://nodejs.org/) 22.13 or later
- npm (installed with Node.js)

## Run locally

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
