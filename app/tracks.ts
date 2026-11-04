// One adaptive "track" per skill game (Echo the Band, Hold the Numbers, Carry Club),
// with a rank ladder earned by stars on top. Pure functions so the rules can be unit-tested.
import { MAX_LEVEL, starsFor } from "./puzzles/model.ts";

export type Track = {
  level: number;
  /** First-try wins in a row towards the next level. */
  run: number;
  played: number;
  firstTry: number;
  /** Every round adds 1–3 stars and stars never go down, so a rank is never lost. */
  stars: number;
};
/** A rank is earned once the game's star total reaches `stars`. */
export type Rank = { title: string; icon: string; stars: number };
/** Star totals for each rank. A 5-round game earns 5–15 stars, so the second rank usually comes in the first game. */
export const RANK_STARS = [0, 10, 30, 60, 100, 150] as const;

const clampLevel = (level: number) => Math.min(MAX_LEVEL, Math.max(1, level));

export function emptyTrack(): Track {
  return { level: 1, run: 0, played: 0, firstTry: 0, stars: 0 };
}

/** Reads a saved track; anything damaged falls back to a fresh value. */
export function readTrack(raw: unknown): Track {
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof Track, unknown>>;
  const count = (value: unknown) => (Number.isInteger(value) && (value as number) >= 0 ? (value as number) : 0);
  const level = Number.isInteger(data.level) ? clampLevel(data.level as number) : 1;
  const run = Number.isInteger(data.run) && (data.run as number) >= 0 && (data.run as number) < 3 ? (data.run as number) : 0;
  const played = count(data.played);
  return { level, run, played, firstTry: Math.min(count(data.firstTry), played), stars: count(data.stars) };
}

/** Same rule as the puzzle islands: 3 first-try wins in a row → level up; 2+ misses → level down. */
export function recordTrack(track: Track, misses: number): Track {
  const next: Track = { ...track, played: track.played + 1, firstTry: track.firstTry + (misses === 0 ? 1 : 0), stars: track.stars + starsFor(misses) };
  if (misses === 0) {
    const run = track.run + 1;
    if (run >= 3) { next.level = clampLevel(track.level + 1); next.run = 0; }
    else next.run = run;
  } else {
    next.run = 0;
    if (misses >= 2) next.level = clampLevel(track.level - 1);
  }
  return next;
}

export function rankFor(ladder: readonly Rank[], stars: number): { rank: Rank; index: number; next: Rank | null; starsToNext: number } {
  let index = 0;
  ladder.forEach((rank, i) => { if (stars >= rank.stars) index = i; });
  const next = ladder[index + 1] ?? null;
  return { rank: ladder[index], index, next, starsToNext: next ? next.stars - stars : 0 };
}
