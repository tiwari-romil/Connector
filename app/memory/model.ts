// Memory games: Echo the Band (repeat a tune) and Hold the Numbers (repeat digits, later backwards).
// Pure data + pure functions (no React) so the rounds can be unit-tested.
import { MAX_LEVEL, makeRng } from "../puzzles/model.ts";
import { RANK_STARS, emptyTrack, readTrack, type Rank, type Track } from "../tracks.ts";

// A pentatonic scale, so any tune the band plays sounds pleasant.
export const BAND = [
  { animal: "🐸", name: "frog", note: "do", frequency: 261.6, color: "coral" },
  { animal: "🐘", name: "elephant", note: "re", frequency: 293.7, color: "sky" },
  { animal: "🦁", name: "lion", note: "mi", frequency: 329.6, color: "sun" },
  { animal: "🐵", name: "monkey", note: "so", frequency: 392, color: "mint" },
  { animal: "🐧", name: "penguin", note: "la", frequency: 440, color: "lilac" },
  { animal: "🐻", name: "bear", note: "high do", frequency: 523.3, color: "peach" },
] as const;

export type BandSetup = { pads: number; length: number; gapMs: number };
// Harder one small step at a time: a longer tune, then another animal, then a quicker beat.
const BAND_LEVELS: BandSetup[] = [
  { pads: 3, length: 2, gapMs: 900 },
  { pads: 3, length: 3, gapMs: 880 },
  { pads: 4, length: 3, gapMs: 840 },
  { pads: 4, length: 4, gapMs: 800 },
  { pads: 4, length: 5, gapMs: 760 },
  { pads: 5, length: 5, gapMs: 720 },
  { pads: 5, length: 6, gapMs: 680 },
  { pads: 6, length: 6, gapMs: 640 },
  { pads: 6, length: 7, gapMs: 600 },
  { pads: 6, length: 8, gapMs: 560 },
];
/** Extra notes for first-try wins earlier in the same game, so the tune grows as he plays. */
export const MAX_BONUS = 2;

export function bandSetup(level: number, bonus: number): BandSetup {
  const base = BAND_LEVELS[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
  return { ...base, length: base.length + Math.min(MAX_BONUS, Math.max(0, bonus)) };
}

/** Pad indices to play. Never the same animal three times in a row, and always at least two animals. */
export function bandTune(setup: BandSetup, seed: number): number[] {
  const rng = makeRng(seed);
  const tune: number[] = [];
  while (tune.length < setup.length) {
    const pad = Math.floor(rng() * setup.pads);
    const [a, b] = tune.slice(-2);
    if (tune.length >= 2 && pad === a && pad === b) continue;
    if (tune.length === setup.length - 1 && tune.every((p) => p === pad)) continue;
    tune.push(pad);
  }
  return tune;
}

/** showMs: how long each new number is shown (and spoken) before the next one appears. */
export type NumberSetup = { length: number; backwards: boolean; showMs: number };
// Forwards spans grow 2 → 7; backwards (much harder) start later and grow 2 → 5.
const NUMBER_LEVELS: Omit<NumberSetup, "showMs">[] = [
  { length: 2, backwards: false },
  { length: 3, backwards: false },
  { length: 4, backwards: false },
  { length: 2, backwards: true },
  { length: 5, backwards: false },
  { length: 3, backwards: true },
  { length: 6, backwards: false },
  { length: 4, backwards: true },
  { length: 7, backwards: false },
  { length: 5, backwards: true },
];

/** After the last number, the row stays up this long before the numbers hide. */
export const NUMBER_HOLD_MS = 400;

export function numberSetup(level: number): NumberSetup {
  const l = Math.min(MAX_LEVEL, Math.max(1, level));
  // 800 ms per number at level 1, quickening to 575 ms at level 10.
  return { ...NUMBER_LEVELS[l - 1], showMs: 800 - (l - 1) * 25 };
}

/** Different digits 1–9, avoiding runs like 4-5-6 that need no remembering. */
export function numberRound(setup: NumberSetup, seed: number): { shown: number[]; answer: number[] } {
  const rng = makeRng(seed);
  const shown: number[] = [];
  while (shown.length < setup.length) {
    const digit = 1 + Math.floor(rng() * 9);
    if (shown.includes(digit)) continue;
    const [a, b] = shown.slice(-2);
    if (shown.length >= 2 && b - a === digit - b && Math.abs(b - a) === 1) continue;
    shown.push(digit);
  }
  return { shown, answer: setup.backwards ? [...shown].reverse() : [...shown] };
}

export const BAND_RANKS: readonly Rank[] = [
  { title: "Little Listener", icon: "👂", stars: RANK_STARS[0] },
  { title: "Drummer", icon: "🥁", stars: RANK_STARS[1] },
  { title: "Ukulele Player", icon: "🎸", stars: RANK_STARS[2] },
  { title: "Band Leader", icon: "🎺", stars: RANK_STARS[3] },
  { title: "Music Star", icon: "🌟", stars: RANK_STARS[4] },
  { title: "Maestro", icon: "🎼", stars: RANK_STARS[5] },
];
export const NUMBER_RANKS: readonly Rank[] = [
  { title: "Number Spotter", icon: "🔍", stars: RANK_STARS[0] },
  { title: "Number Keeper", icon: "🗝️", stars: RANK_STARS[1] },
  { title: "Memory Explorer", icon: "🧭", stars: RANK_STARS[2] },
  { title: "Memory Wizard", icon: "🧙", stars: RANK_STARS[3] },
  { title: "Memory Champion", icon: "🏆", stars: RANK_STARS[4] },
  { title: "Mega Brain", icon: "🧠", stars: RANK_STARS[5] },
];

export type MemoryGame = "band" | "numbers";
export type MemorySave = { band: Track; numbers: Track; bestTune: number; bestForward: number; bestBackward: number };

export function readMemorySave(raw: string | null): MemorySave {
  const save: MemorySave = { band: emptyTrack(), numbers: emptyTrack(), bestTune: 0, bestForward: 0, bestBackward: 0 };
  try {
    const data = JSON.parse(raw ?? "null");
    if (!data || typeof data !== "object") return save;
    save.band = readTrack(data.band);
    save.numbers = readTrack(data.numbers);
    for (const key of ["bestTune", "bestForward", "bestBackward"] as const) if (Number.isInteger(data[key]) && data[key] > 0) save[key] = data[key];
  } catch { /* damaged save → start fresh */ }
  return save;
}

/** Longest tune / number run remembered without help (fewer than 2 misses). Shown to grown-ups. */
export function recordSpan(save: MemorySave, game: MemoryGame, length: number, backwards: boolean, misses: number): MemorySave {
  if (misses >= 2) return save;
  const key = game === "band" ? "bestTune" : backwards ? "bestBackward" : "bestForward";
  return { ...save, [key]: Math.max(save[key], length) };
}
