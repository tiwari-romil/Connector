// Carry Club: column addition with carrying, from 27 + 5 up to 678 + 456.
// Pure functions (no React) so every level can be checked by unit tests.
import { MAX_LEVEL, makeRng } from "../puzzles/model.ts";
import { RANK_STARS, type Rank } from "../tracks.ts";

export type CarryColumn = {
  /** 0 = ones, 1 = tens, 2 = hundreds. */
  place: number;
  /** null when that number has no digit in this column (the 2 in 27 + 5 has nothing under it). */
  top: number | null;
  bottom: number | null;
  carryIn: number;
  total: number;
  digit: number;
  carryOut: number;
};
export const PLACE_NAMES = ["ones", "tens", "hundreds", "thousands"] as const;

/** The sum worked column by column, ones first. */
export function carryColumns(a: number, b: number): CarryColumn[] {
  const width = Math.max(String(a).length, String(b).length);
  const columns: CarryColumn[] = [];
  let carry = 0;
  for (let place = 0; place < width; place++) {
    const digitOf = (n: number) => (place < String(n).length ? Math.floor(n / 10 ** place) % 10 : null);
    const top = digitOf(a), bottom = digitOf(b);
    const total = (top ?? 0) + (bottom ?? 0) + carry;
    columns.push({ place, top, bottom, carryIn: carry, total, digit: total % 10, carryOut: total >= 10 ? 1 : 0 });
    carry = total >= 10 ? 1 : 0;
  }
  return columns;
}

/** Which columns carry, ones first: 478 + 256 → [1, 1, 0]. */
export function carryPattern(a: number, b: number): number[] {
  return carryColumns(a, b).map((column) => column.carryOut);
}

type CarrySpec = { top: number; bottom: number; fits: (pattern: number[]) => boolean; about: string };
const exactly = (want: string) => (pattern: number[]) => pattern.join() === want;
// One new idea per level: carry from the ones, then from the tens, then 3-digit columns, then several carries.
const CARRY_LEVELS: CarrySpec[] = [
  { top: 2, bottom: 1, fits: exactly("1,0"), about: "2-digit + 1-digit, carry from the ones (like 27 + 5)" },
  { top: 2, bottom: 2, fits: exactly("1,0"), about: "2-digit + 2-digit, carry from the ones (like 36 + 27)" },
  { top: 2, bottom: 2, fits: exactly("0,1"), about: "2-digit + 2-digit, carry from the tens into a new hundreds column (like 72 + 51)" },
  { top: 3, bottom: 3, fits: exactly("0,0,0"), about: "3-digit + 3-digit, no carrying: practising three columns (like 342 + 215)" },
  { top: 3, bottom: 3, fits: exactly("1,0,0"), about: "3-digit + 3-digit, carry from the ones (like 158 + 236)" },
  { top: 3, bottom: 3, fits: exactly("0,1,0"), about: "3-digit + 3-digit, carry from the tens (like 274 + 153)" },
  { top: 3, bottom: 3, fits: exactly("0,0,1"), about: "3-digit + 3-digit, carry from the hundreds into thousands (like 345 + 824)" },
  { top: 3, bottom: 3, fits: exactly("1,1,0"), about: "3-digit + 3-digit, two carries in a row (like 478 + 256)" },
  { top: 3, bottom: 3, fits: (p) => p.reduce((s, c) => s + c, 0) === 2 && p.join() !== "1,1,0", about: "3-digit + 3-digit, two carries including into thousands (like 563 + 482)" },
  { top: 3, bottom: 3, fits: exactly("1,1,1"), about: "3-digit + 3-digit, carry in every column (like 678 + 456)" },
];

const specFor = (level: number) => CARRY_LEVELS[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
/** What a level practises, for the grown-up corner. */
export function carryLevelAbout(level: number) { return specFor(level).about; }

export function carryProblem(level: number, seed: number): { a: number; b: number } {
  const spec = specFor(level);
  const rng = makeRng(seed);
  const withDigits = (digits: number) => 10 ** (digits - 1) + Math.floor(rng() * 9 * 10 ** (digits - 1));
  // Rejection sampling: every pattern above is common enough to be found in a few dozen tries.
  for (;;) {
    const a = withDigits(spec.top), b = withDigits(spec.bottom);
    if (spec.fits(carryPattern(a, b))) return { a, b };
  }
}

export const CARRY_RANKS: readonly Rank[] = [
  { title: "Carry Cub", icon: "🐣", stars: RANK_STARS[0] },
  { title: "Carry Captain", icon: "🦸", stars: RANK_STARS[1] },
  { title: "Column Climber", icon: "🧗", stars: RANK_STARS[2] },
  { title: "Carry Hero", icon: "🦁", stars: RANK_STARS[3] },
  { title: "Carry Champion", icon: "🏆", stars: RANK_STARS[4] },
  { title: "Maths Master", icon: "👑", stars: RANK_STARS[5] },
];
