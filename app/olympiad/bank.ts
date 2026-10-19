// Junior reasoning-olympiad practice bank — 200 questions in 25 common question styles.
// Pure data + pure functions (no React) so the whole bank can be checked by unit tests.
import { makeRng, shuffle } from "../puzzles/model.ts";
import { arrow, GREY, INK, line, poly, rect, shape, silhouette, svg, text, type Fill, type ShapeKind } from "./draw.ts";

export type Level = "easy" | "medium" | "champ";
export type Opt = string | { svg: string; label: string };
export type Visual =
  | { kind: "text"; lines: string[] }
  | { kind: "svg"; svg: string; size?: "s" | "m" | "l" }
  | { kind: "pairs"; pairs: [string, string][] }
  | { kind: "emoji"; items: string[]; cols: number };
export type Question = {
  id: string; type: TypeId; level: Level; prompt: string; note?: string;
  visual?: Visual; options: Opt[]; answer: number; why: string;
};

export const TYPES = [
  { id: "numSeries", icon: "🔢", title: "Number series" },
  { id: "letterSeries", icon: "🔤", title: "Letter series" },
  { id: "numPattern", icon: "🧮", title: "Number patterns" },
  { id: "letterCircle", icon: "⭕", title: "Letters in circles" },
  { id: "wordRule", icon: "📝", title: "Word secrets" },
  { id: "figureAnalogy", icon: "🔷", title: "Shape changes" },
  { id: "letterGrid", icon: "🪟", title: "Letter to picture grids" },
  { id: "pairs", icon: "🔗", title: "Picture pairs" },
  { id: "oddWord", icon: "🗣️", title: "Odd one out — words" },
  { id: "oddPicture", icon: "🕵️", title: "Odd one out — pictures" },
  { id: "oddTurn", icon: "🔄", title: "Odd one out — turned shapes" },
  { id: "shapeNotIn", icon: "🔺", title: "Shape not in the picture" },
  { id: "objectNotIn", icon: "🔍", title: "Object not in the picture" },
  { id: "missingTile", icon: "🧩", title: "Find the missing part" },
  { id: "hiddenLetter", icon: "🔠", title: "Hidden letter" },
  { id: "mirrorHalf", icon: "🪞", title: "Missing mirror half" },
  { id: "countCircles", icon: "⚪", title: "Count the circles" },
  { id: "countRects", icon: "▭", title: "Count the rectangles" },
  { id: "starBoxes", icon: "⭐", title: "Star boxes" },
  { id: "shadow", icon: "🌑", title: "Find the shadow" },
  { id: "arrowCross", icon: "➕", title: "Arrow number puzzles" },
  { id: "countTriangles", icon: "🔻", title: "Count the triangles" },
  { id: "dotWheel", icon: "🎡", title: "Moving dot wheels" },
  { id: "hiddenWall", icon: "🧱", title: "Hidden behind the wall" },
  { id: "partNotIn", icon: "🔲", title: "Part not in the picture" },
] as const;
export type TypeId = (typeof TYPES)[number]["id"];

export const LEVELS: Record<Level, { label: string; icon: string }> = {
  easy: { label: "Warm-up", icon: "🟢" },
  medium: { label: "Brain Stretch", icon: "🟠" },
  champ: { label: "Champ", icon: "🏆" },
};

// ---------- builder ----------
const bank: Question[] = [];
const perType: Record<string, number> = {};
function hash(s: string) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

function add(type: TypeId, level: Level, prompt: string, visual: Visual | undefined, correct: Opt, wrong: Opt[], why: string, note?: string) {
  perType[type] = (perType[type] ?? 0) + 1;
  const id = `${type}-${perType[type]}`;
  const options = shuffle(makeRng(hash(id) + 17), [correct, ...wrong]);
  bank.push({ id, type, level, prompt, note, visual, options, answer: options.indexOf(correct), why });
}
const T = (...lines: string[]): Visual => ({ kind: "text", lines });
const S = (body: string, size: "s" | "m" | "l" = "m"): Visual => ({ kind: "svg", svg: body, size });
const O = (body: string, label: string, vb = "-4 -4 48 48"): Opt => ({ svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img">${body}</svg>`, label });
const SERIES = 'What will come in place of "?" in the given series?';
const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ---------- 1. Number series ----------
const numSeries: [Level, string, string, string[], string][] = [
  ["easy", "1, 2, 3, 4, ?", "5", ["6", "4", "3"], "Counting up by 1: after 4 comes 5."],
  ["easy", "5, 4, 3, 2, ?", "1", ["0", "3", "6"], "Counting down by 1: after 2 comes 1."],
  ["easy", "1-1, 2-2, 3-3, ?", "4-4", ["4-5", "3-4", "5-5"], "Both numbers go up by 1 together."],
  ["easy", "2, 4, 6, 8, ?", "10", ["9", "11", "12"], "Count in 2s: 2, 4, 6, 8, 10."],
  ["medium", "3-1-3, 3-2-3, 3-3-3, ?", "3-4-3", ["4-3-4", "3-4-4", "3-3-4"], "The ends stay 3, the middle number goes up by 1."],
  ["medium", "1-2, 2-3, 3-4, ?", "4-5", ["5-4", "4-4", "5-6"], "Each pair is two numbers next to each other, and both go up by 1."],
  ["medium", "10, 20, 30, 40, ?", "50", ["41", "60", "45"], "Count in 10s: after 40 comes 50."],
  ["medium", "5-1, 4-2, 3-3, ?", "2-4", ["4-2", "2-3", "3-4"], "The first number goes down by 1, the second goes up by 1."],
  ["medium", "9, 7, 5, 3, ?", "1", ["2", "0", "4"], "Count back in 2s: 9, 7, 5, 3, 1."],
  ["champ", "1, 2, 4, 7, 11, ?", "16", ["15", "14", "17"], "The jumps grow: +1, +2, +3, +4, so next is +5. 11 + 5 = 16."],
  ["champ", "1-9, 2-8, 3-7, 4-6, ?", "5-5", ["5-6", "6-5", "4-5"], "The first number goes up, the second goes down. The two always make 10."],
  ["champ", "2, 3, 5, 6, 8, 9, ?", "11", ["10", "12", "13"], "Jumps take turns: +1, +2, +1, +2 … 9 + 2 = 11."],
  ["champ", "20, 18, 16, 14, ?", "12", ["10", "13", "11"], "Count back in 2s: 14 − 2 = 12."],
];
for (const [lv, s, c, w, why] of numSeries) add("numSeries", lv, SERIES, T(s), c, w, why);

// ---------- 2. Letter series ----------
const letterSeries: [Level, string, string, string[], string][] = [
  ["easy", "A, B, C, D, ?", "E", ["F", "D", "G"], "Letters in ABC order: after D comes E."],
  ["easy", "AB, CD, EF, ?", "GH", ["GI", "HI", "FG"], "Two letters at a time in ABC order: GH."],
  ["easy", "a, b, c, d, ?", "e", ["E", "f", "d"], "Small letters in order: after d comes small e."],
  ["easy", "AA, BB, CC, ?", "DD", ["Dd", "CD", "EE"], "Each letter is written twice, in ABC order."],
  ["medium", "Z, Y, X, W, ?", "V", ["U", "X", "T"], "The ABC backwards: Z, Y, X, W, V."],
  ["medium", "A, C, E, G, ?", "I", ["H", "J", "K"], "Skip one letter each time: G, (skip H), I."],
  ["medium", "a, BB, c, DD, ?", "e", ["EE", "E", "ee"], "Small letter, then double capital letters. Next is small e."],
  ["medium", "A, a, B, b, C, ?", "c", ["D", "C", "d"], "Each capital letter is followed by its small letter."],
  ["medium", "B, D, F, H, ?", "J", ["I", "K", "L"], "Skip one letter each time: H, (skip I), J."],
  ["champ", "A, c, E, g, ?", "I", ["i", "H", "h"], "Skip one letter each time, and capital and small take turns: A, c, E, g, I."],
  ["champ", "AZ, BY, CX, ?", "DW", ["DV", "EW", "DX"], "First letter goes forward (A, B, C, D), second goes backward (Z, Y, X, W)."],
  ["champ", "A, B, D, G, ?", "K", ["J", "L", "H"], "Jumps grow: +1, +2, +3, +4. G + 4 letters = K."],
];
for (const [lv, s, c, w, why] of letterSeries) add("letterSeries", lv, SERIES, T(s), c, w, why);

// ---------- 3. Number patterns ----------
const numPattern: [Level, string, string, string[], string][] = [
  ["easy", "11, 22, 33, ?", "44", ["43", "34", "55"], "Both digits are the same and go up by 1."],
  ["easy", "1, 3, 5, 7, ?", "9", ["8", "10", "11"], "Odd numbers: jump 2 each time."],
  ["easy", "5, 10, 15, 20, ?", "25", ["30", "21", "24"], "Count in 5s."],
  ["medium", "10, 02, 30, 04, 50, ?", "06", ["60", "05", "07"], "Odd numbers have 0 after them (10, 30, 50); even numbers have 0 before them (02, 04, 06)."],
  ["medium", "12, 23, 34, 45, ?", "56", ["55", "65", "46"], "Both digits go up by 1 each time."],
  ["medium", "100, 200, 300, ?", "400", ["301", "350", "500"], "Count in hundreds."],
  ["medium", "21, 32, 43, 54, ?", "65", ["56", "64", "66"], "Both digits go up by 1: 5→6 and 4→5."],
  ["medium", "1, 10, 2, 20, 3, ?", "30", ["4", "40", "13"], "Each number is followed by itself with a 0: 3 then 30."],
  ["champ", "13, 31, 24, 42, 35, ?", "53", ["46", "36", "54"], "Each number is followed by its digits swapped: 35 then 53."],
  ["champ", "1, 11, 111, ?", "1111", ["112", "1110", "222"], "One more 1 is added each time."],
  ["champ", "2, 20, 4, 40, 6, ?", "60", ["8", "80", "61"], "Even numbers, each followed by itself with a 0: 6 then 60."],
  ["champ", "19, 28, 37, 46, ?", "55", ["56", "45", "64"], "Tens digit goes up by 1, ones digit goes down by 1."],
];
for (const [lv, s, c, w, why] of numPattern) add("numPattern", lv, SERIES, T(s), c, w, why);

// ---------- 4. Letters in circles ----------
type CircleRule = "between" | "next" | "before" | "middle4" | "jump" | "backward" | "twoBetween";
const circleRules: Record<CircleRule, { pair: (i: number) => [number, number]; out: (i: number) => string; why: string }> = {
  between: { pair: (i) => [i, i + 2], out: (i) => ABC[i + 1], why: "The letter in the circle is the one that comes between the two letters." },
  next: { pair: (i) => [i, i + 1], out: (i) => ABC[i + 2], why: "The answer is the letter that comes just after the two letters." },
  before: { pair: (i) => [i, i + 1], out: (i) => ABC[i - 1], why: "The answer is the letter that comes just before the two letters." },
  middle4: { pair: (i) => [i, i + 4], out: (i) => ABC[i + 2], why: "The two letters are 4 apart; the answer is exactly in the middle." },
  jump: { pair: (i) => [i, i + 2], out: (i) => ABC[i + 4], why: "The letters jump by 2 each time, so the answer is 2 more after the second letter." },
  backward: { pair: (i) => [i + 1, i], out: (i) => ABC[i - 1], why: "The letters are going backwards, so the answer is the letter before the second one." },
  twoBetween: { pair: (i) => [i, i + 3], out: (i) => ABC[i + 1] + ABC[i + 2], why: "The two letters that come between the given letters go in the circle." },
};
function letterCircleSvg(rule: CircleRule, starts: number[]) {
  const r = circleRules[rule];
  return svg(240, starts.length * 46 + 6, starts.map((s, row) => {
    const y = 26 + row * 46; const [a, b] = r.pair(s); const last = row === starts.length - 1;
    return text(18, y, ABC[a], 22) + shape("circle", 52, y, 14) + text(86, y, ABC[b], 22) + arrow(108, y, 170) +
      (last ? text(200, y, "?", 26) : shape("circle", 200, y, 18) + text(200, y, r.out(s), r.out(s).length > 1 ? 15 : 20));
  }).join(""));
}
const letterCircles: [Level, CircleRule, string][] = [
  ["easy", "between", "BFKP"], ["easy", "next", "CHMR"], ["easy", "between", "AGJS"],
  ["medium", "before", "CGNT"], ["medium", "next", "DLPV"], ["medium", "middle4", "AEJO"], ["medium", "before", "EIOS"],
  ["champ", "jump", "AFKP"], ["champ", "backward", "DHMT"], ["champ", "twoBetween", "BGKR"],
];
for (const [lv, rule, letters] of letterCircles) {
  const starts = [...letters].map((ch) => ABC.indexOf(ch));
  const q = starts[starts.length - 1]; const correct = circleRules[rule].out(q);
  const shift = (d: number) => correct.split("").map((ch) => ABC[ABC.indexOf(ch) + d]).join("");
  const wrong = rule === "twoBetween" ? [shift(1), shift(-1), correct[0] + ABC[ABC.indexOf(correct[1]) + 1]] : [shift(1), shift(-1), shift(2)];
  add("letterCircle", lv, 'What will come in place of "?"', S(letterCircleSvg(rule, starts)), correct, wrong, circleRules[rule].why);
}

// ---------- 5. Word secrets ----------
const wordRules: [Level, string[], string, string[], string][] = [
  ["easy", ["CAT → C", "DOG → D", "PEN → P", "SUN → ?"], "S", ["U", "N", "P"], "The first letter of the word."],
  ["easy", ["BAT → T", "CUP → P", "HEN → N", "RAT → ?"], "T", ["R", "A", "E"], "The last letter of the word."],
  ["easy", ["BAG → A", "PIG → I", "HUT → U", "BED → ?"], "E", ["B", "D", "A"], "The middle letter of the word."],
  ["medium", ["TREE → T_E", "MILK → M_K", "DUCK → D_K", "FROG → ?"], "F_G", ["F_R", "G_F", "R_G"], "First letter, a gap, then the last letter."],
  ["medium", ["SHIP → SH", "FROG → FR", "DESK → ?"], "DE", ["DK", "SK", "ES"], "The first two letters of the word."],
  ["medium", ["DOG → GOD", "PAN → NAP", "TOP → ?"], "POT", ["OPT", "TPO", "PTO"], "The word is written backwards."],
  ["medium", ["BIG → IG", "BAT → AT", "FAN → AN", "MAP → ?"], "AP", ["MA", "MP", "PA"], "The first letter is taken away."],
  ["champ", ["AB → BC", "CD → DE", "MN → ?"], "NO", ["OP", "MO", "LM"], "Each letter moves one step forward in the ABC: M→N, N→O."],
  ["champ", ["CAT → C3", "FROG → F4", "LION → ?"], "L4", ["L3", "N4", "I4"], "First letter, then how many letters the word has. LION has 4 letters."],
  ["champ", ["MOON → OO", "BEE → EE", "BOOK → OO", "TEETH → ?"], "EE", ["TT", "TH", "OO"], "The answer is the double letter that sits together in the word: T-EE-TH."],
];
for (const [lv, lines, c, w, why] of wordRules) add("wordRule", lv, 'What will come in place of "?"', T(...lines), c, w, why);

// ---------- 6. Shape changes (figure analogies) ----------
type Fig = { outer?: ShapeKind; outerFill?: Fill; inner?: ShapeKind; innerFill?: Fill; count?: number; countShape?: ShapeKind };
function fig(f: Fig, cx: number, cy: number, r: number): string {
  if (f.count) {
    const n = f.count; const k = f.countShape ?? "circle"; const rr = r * 0.26;
    const perRow = n <= 3 ? n : Math.ceil(n / 2);
    return Array.from({ length: n }, (_, i) => {
      const row = Math.floor(i / perRow); const inRow = row === 0 ? Math.min(n, perRow) : n - perRow; const col = i - row * perRow;
      const x = cx + (col - (inRow - 1) / 2) * rr * 2.4; const y = cy + (n <= 3 ? 0 : (row - 0.5) * rr * 2.6);
      return shape(k, x, y, rr, "black", 2);
    }).join("");
  }
  return (f.outer ? shape(f.outer, cx, cy, r, f.outerFill ?? "white") : "") + (f.inner ? shape(f.inner, cx, cy, f.outer ? r * 0.42 : r, f.innerFill ?? "white", f.outer ? 2.5 : 3) : "");
}
function figLabel(f: Fig) {
  if (f.count) return `${f.count} dots`;
  const p = (k?: ShapeKind, c?: Fill) => (k ? `${c && c !== "white" ? c + " " : ""}${k}` : "");
  return [p(f.outer, f.outerFill), f.inner ? (f.outer ? "with " : "") + p(f.inner, f.innerFill) : ""].filter(Boolean).join(" ");
}
function analogySvg(rows: [Fig, Fig][], q: Fig) {
  const all = [...rows, [q, null] as [Fig, Fig | null]];
  return svg(220, all.length * 64, all.map(([a, b], i) => {
    const y = 32 + i * 64;
    return fig(a, 40, y, 24) + arrow(80, y, 140) + (b ? fig(b, 180, y, 24) : text(180, y, "?", 28));
  }).join(""));
}
const optFig = (f: Fig) => O(fig(f, 20, 20, 17), figLabel(f));
const figQs: [Level, [Fig, Fig][], Fig, Fig, Fig[], string][] = [
  ["easy", [[{ outer: "circle", inner: "square", innerFill: "black" }, { outer: "circle" }], [{ outer: "triangle", inner: "circle", innerFill: "black" }, { outer: "triangle" }], [{ outer: "square", inner: "star", innerFill: "black" }, { outer: "square" }]],
    { outer: "star", inner: "circle", innerFill: "black" }, { outer: "star" }, [{ outer: "circle" }, { outer: "star", inner: "circle", innerFill: "white" }, { inner: "circle", innerFill: "black" }], "Only the big outside shape is kept; the black shape inside disappears."],
  ["easy", [[{ inner: "circle", innerFill: "black" }, { inner: "circle" }], [{ inner: "square", innerFill: "black" }, { inner: "square" }], [{ inner: "triangle", innerFill: "black" }, { inner: "triangle" }]],
    { inner: "star", innerFill: "black" }, { inner: "star" }, [{ inner: "star", innerFill: "black" }, { inner: "circle" }, { inner: "star", innerFill: "grey" }], "The black shape turns white."],
  ["easy", [[{ count: 1 }, { count: 2 }], [{ count: 2 }, { count: 3 }], [{ count: 3 }, { count: 4 }]],
    { count: 4 }, { count: 5 }, [{ count: 4 }, { count: 6 }, { count: 3 }], "One more dot is added each time."],
  ["medium", [[{ outer: "square", inner: "circle", innerFill: "black" }, { inner: "circle" }], [{ outer: "triangle", inner: "square", innerFill: "black" }, { inner: "square" }], [{ outer: "circle", inner: "triangle", innerFill: "black" }, { inner: "triangle" }]],
    { outer: "diamond", inner: "heart", innerFill: "black" }, { inner: "heart" }, [{ inner: "heart", innerFill: "black" }, { outer: "diamond" }, { outer: "diamond", inner: "heart" }], "The small black shape comes out and becomes white."],
  ["medium", [[{ outer: "circle", inner: "square" }, { outer: "square", inner: "circle" }], [{ outer: "square", inner: "triangle" }, { outer: "triangle", inner: "square" }], [{ outer: "hexagon", inner: "circle" }, { outer: "circle", inner: "hexagon" }]],
    { outer: "triangle", inner: "star" }, { outer: "star", inner: "triangle" }, [{ outer: "triangle", inner: "star" }, { outer: "star", inner: "star" }, { outer: "triangle", inner: "triangle" }], "The inside shape and the outside shape swap places."],
  ["medium", [[{ outer: "circle", inner: "square", innerFill: "black" }, { outer: "circle", outerFill: "black", inner: "square" }], [{ outer: "square", inner: "triangle", innerFill: "black" }, { outer: "square", outerFill: "black", inner: "triangle" }], [{ outer: "triangle", inner: "circle", innerFill: "black" }, { outer: "triangle", outerFill: "black", inner: "circle" }]],
    { outer: "hexagon", inner: "circle", innerFill: "black" }, { outer: "hexagon", outerFill: "black", inner: "circle" }, [{ outer: "hexagon", inner: "circle", innerFill: "black" }, { outer: "hexagon", outerFill: "black", inner: "circle", innerFill: "black" }, { outer: "hexagon", inner: "circle" }], "Black becomes white and white becomes black."],
  ["champ", [[{ outer: "circle", outerFill: "grey", inner: "square", innerFill: "black" }, { outer: "circle", outerFill: "black", inner: "square", innerFill: "grey" }], [{ outer: "triangle", outerFill: "grey", inner: "circle", innerFill: "black" }, { outer: "triangle", outerFill: "black", inner: "circle", innerFill: "grey" }]],
    { outer: "square", outerFill: "grey", inner: "star", innerFill: "black" }, { outer: "square", outerFill: "black", inner: "star", innerFill: "grey" }, [{ outer: "square", outerFill: "grey", inner: "star", innerFill: "grey" }, { outer: "star", outerFill: "black", inner: "square", innerFill: "grey" }, { outer: "square", outerFill: "black", inner: "star", innerFill: "black" }], "The two colours swap: the grey part becomes black and the black part becomes grey. The shapes stay where they are."],
  ["champ", [[{ inner: "triangle" }, { count: 3 }], [{ inner: "square" }, { count: 4 }], [{ inner: "hexagon" }, { count: 6 }]],
    { inner: "pentagon" }, { count: 5 }, [{ count: 4 }, { count: 6 }, { count: 3 }], "The number of dots is the number of corners of the shape. A pentagon has 5 corners."],
];
for (const [lv, rows, q, c, w, why] of figQs) add("figureAnalogy", lv, 'What will come in place of "?"', S(analogySvg(rows, q)), optFig(c), w.map(optFig), why);

// ---------- 7. Letter → picture grids ----------
const PIC: Record<string, [string, string]> = { A: ["🍎", "Apple"], B: ["⚽", "Ball"], C: ["🐱", "Cat"], D: ["🐶", "Dog"], F: ["🐟", "Fish"], G: ["🍇", "Grapes"], H: ["🏠", "House"], K: ["🪁", "Kite"], M: ["🌙", "Moon"], S: ["☀️", "Sun"], T: ["🌳", "Tree"], U: ["☂️", "Umbrella"] };
type Cells = Record<number, string>; // cell index (0 TL, 1 TR, 2 BL, 3 BR) → content
const MOVES: Record<string, { map: number[]; why: string }> = {
  lr: { map: [1, 0, 3, 2], why: "Each letter becomes its picture in the box next to it (left ↔ right)." },
  tb: { map: [2, 3, 0, 1], why: "Each letter becomes its picture in the box above or below it (top ↔ bottom)." },
  diag: { map: [3, 2, 1, 0], why: "Each letter becomes its picture in the opposite corner (diagonally across)." },
  cw: { map: [1, 3, 0, 2], why: "Each letter becomes its picture one box clockwise (like a clock's hands)." },
  acw: { map: [2, 0, 3, 1], why: "Each letter becomes its picture one box anticlockwise (opposite way to a clock)." },
};
const toPics = (cells: Cells, map: number[]): Cells => Object.fromEntries(Object.entries(cells).map(([k, v]) => [map[+k], PIC[v][0]]));
function grid2(cells: Cells, x: number, y: number, s = 30) {
  return rect(x, y, s * 2, s * 2, "white", 2.5) + line(x + s, y, x + s, y + 2 * s, 2) + line(x, y + s, x + 2 * s, y + s, 2) +
    Object.entries(cells).map(([k, v]) => text(x + (+k % 2) * s + s / 2, y + Math.floor(+k / 2) * s + s / 2, v, v.length === 1 && /[A-Z]/.test(v) ? 18 : 19)).join("");
}
const cellsKey = (c: Cells) => [0, 1, 2, 3].map((i) => c[i] ?? "_").join("");
function cellsLabel(c: Cells) { const names = ["top-left", "top-right", "bottom-left", "bottom-right"]; return Object.entries(c).map(([k, v]) => `${Object.values(PIC).find((p) => p[0] === v)?.[1] ?? v} ${names[+k]}`).join(", "); }
const letterGrids: [Level, keyof typeof MOVES, Cells[], Cells][] = [
  ["easy", "lr", [{ 0: "A" }, { 2: "D" }], { 1: "S" }],
  ["easy", "tb", [{ 0: "C" }, { 3: "F" }], { 2: "K" }],
  ["medium", "diag", [{ 0: "A", 1: "D" }, { 2: "H", 3: "F" }], { 0: "K", 2: "S" }],
  ["medium", "lr", [{ 0: "B", 2: "C" }, { 1: "M", 3: "T" }], { 0: "G", 3: "U" }],
  ["champ", "cw", [{ 0: "C", 3: "D" }, { 1: "F", 2: "H" }], { 3: "K", 0: "B" }],
  ["champ", "acw", [{ 1: "S", 2: "A" }, { 0: "T", 3: "G" }], { 2: "M", 1: "D" }],
];
for (const [lv, move, examples, q] of letterGrids) {
  const m = MOVES[move].map;
  const body = svg(200, (examples.length + 1) * 80, [...examples, q].map((c, i) => {
    const y = 10 + i * 80; return grid2(c, 8, y) + arrow(80, y + 30, 120) + (i < examples.length ? grid2(toPics(c, m), 130, y) : text(160, y + 30, "?", 28));
  }).join(""));
  const correct = toPics(q, m);
  const candidates: Cells[] = [toPics(q, [0, 1, 2, 3]), ...Object.values(MOVES).map((mv) => toPics(q, mv.map))];
  const keys = Object.keys(q).map(Number);
  candidates.push({ [m[keys[0]]]: PIC[q[keys[keys.length - 1]]][0], ...(keys.length > 1 ? { [m[keys[1]]]: PIC[q[keys[0]]][0] } : {}) });
  const seen = new Set([cellsKey(correct)]); const wrong: Cells[] = [];
  for (const c of candidates) { const k = cellsKey(c); if (!seen.has(k)) { seen.add(k); wrong.push(c); } }
  const opt = (c: Cells) => O(grid2(c, 0, 0, 20), cellsLabel(c));
  add("letterGrid", lv, 'What will come in place of the "?"', S(body, "l"), opt(correct), wrong.slice(0, 3).map(opt), MOVES[move].why + " Letters: " + Object.values(q).map((l) => `${l} → ${PIC[l][1]}`).join(", ") + ".");
}

// ---------- 8. Picture pairs ----------
const pairQs: [Level, [string, string][], string, string, string[], string][] = [
  ["easy", [["👓", "👀"], ["🧤", "✋"]], "👟", "🦶", ["👀", "🧢", "✋"], "Things we wear and where they go: a shoe goes on the foot."],
  ["easy", [["🐄", "🥛"], ["🐝", "🍯"]], "🐔", "🥚", ["🍯", "🌽", "🐟"], "What each animal gives us: a hen gives eggs."],
  ["easy", [["🐶", "🦴"], ["🐰", "🥕"]], "🐒", "🍌", ["🥕", "🦴", "🧀"], "Favourite food: a monkey loves bananas."],
  ["easy", [["🔑", "🔒"], ["🪥", "🦷"]], "🥄", "🥣", ["🦷", "🔒", "👟"], "Things that go together: a spoon goes with a bowl."],
  ["medium", [["🌧️", "☂️"], ["☀️", "🕶️"]], "❄️", "🧣", ["☂️", "🕶️", "🩴"], "What we use in that weather: in the cold we wear a scarf."],
  ["medium", [["🐣", "🐔"], ["🐛", "🦋"]], "🌱", "🌳", ["🍂", "🐛", "🥚"], "Little one grows into big one: a small plant grows into a tree."],
  ["medium", [["🚗", "🛣️"], ["🚢", "🌊"]], "✈️", "☁️", ["🛣️", "🌊", "🏠"], "Where it travels: an aeroplane flies in the sky."],
  ["medium", [["👂", "🎵"], ["👃", "🌸"]], "👅", "🍦", ["🎵", "👀", "🌸"], "Our senses: we hear music, smell flowers and taste ice cream."],
  ["champ", [["🚲", "2"], ["🚗", "4"]], "🛺", "3", ["2", "4", "1"], "Count the wheels: an auto-rickshaw has 3 wheels."],
  ["champ", [["🐕", "4"], ["🐔", "2"]], "🐍", "0", ["4", "2", "1"], "Count the legs: a snake has no legs, so 0."],
];
for (const [lv, ex, q, c, w, why] of pairQs) add("pairs", lv, 'What will come in place of "?"', { kind: "pairs", pairs: [...ex, [q, "?"]] }, c, w, why);

// ---------- 9. Odd one out — words ----------
const oddWords: [Level, string, string[], string, string?][] = [
  ["easy", "Mango", ["Red", "Blue", "Green"], "Red, Blue and Green are colours. Mango is a fruit."],
  ["easy", "Cat", ["Two", "Five", "Nine"], "Two, Five and Nine are numbers. Cat is an animal."],
  ["medium", "8 Seven", ["3 Three", "5 Five", "6 Six"], "In the others the number and the word match. 8 is not Seven."],
  ["medium", "Little – Small", ["Big – Small", "Hot – Cold", "Up – Down"], "The others are opposites. Little and Small mean the same."],
  ["medium", "January", ["Monday", "Sunday", "Friday"], "Monday, Sunday and Friday are days of the week. January is a month."],
  ["champ", "7 Seven", ["2 Two", "4 Four", "6 Six"], "2, 4 and 6 are even numbers (they make pairs). 7 is odd.", "Note: All the numbers match their words — look for something else!"],
  ["champ", "Cow – Lamb", ["Cat – Kitten", "Dog – Puppy", "Hen – Chick"], "Each animal is shown with its baby. A cow's baby is a calf, not a lamb."],
  ["champ", "8 Eight", ["4 Five", "2 Three", "6 Seven"], "In the others the word is one more than the number. 8 and Eight are the same.", "Note: It is not related to the number of letters, vowels or consonants of the words."],
];
for (const [lv, c, w, why, note] of oddWords) add("oddWord", lv, "Find the odd one out.", undefined, c, w, why, note);

// ---------- 10. Odd one out — pictures ----------
const oddPics: [Level, string, string[], string][] = [
  ["easy", "🥕", ["🍎", "🍌", "🍇"], "Carrot is a vegetable; the others are fruits."],
  ["easy", "🚗", ["🐶", "🐱", "🐰"], "The car is not an animal."],
  ["easy", "✈️", ["🚗", "🚌", "🚲"], "The aeroplane flies; the others go on the road."],
  ["easy", "🍕", ["✏️", "🖍️", "🖊️"], "Pencil, crayon and pen are for writing. Pizza is food."],
  ["medium", "🐦", ["🐟", "🐬", "🐙"], "Fish, dolphin and octopus live in water. The bird does not."],
  ["medium", "📦", ["⚽", "🏀", "🎾"], "The others are balls. The box is not round."],
  ["medium", "🌳", ["🌞", "⭐", "🌙"], "Sun, star and moon are in the sky. The tree grows on the ground."],
  ["medium", "🔥", ["🍦", "🧊", "⛄"], "Ice cream, ice and snowman are cold. Fire is hot."],
  ["champ", "🐧", ["🦅", "🐦", "🦆"], "All of them are birds, but the penguin cannot fly."],
  ["champ", "🦇", ["🐔", "🐦", "🦆"], "The bat has wings but it is not a bird. The others are birds."],
];
for (const [lv, c, w, why] of oddPics) add("oddPicture", lv, "Find the odd one out.", undefined, c, w, why);

// ---------- 11. Odd one out — turned shapes ----------
const TURN_SHAPES: Record<string, number[][]> = {
  L: [[8, 4], [18, 4], [18, 26], [32, 26], [32, 36], [8, 36]],
  flag: [[10, 4], [32, 12], [17, 19], [17, 36], [10, 36]],
  P: [[10, 4], [30, 4], [30, 21], [18, 21], [18, 36], [10, 36]],
  arrow: [[4, 15], [22, 15], [22, 6], [36, 20], [22, 32], [22, 24], [13, 24], [13, 34], [4, 34]],
  F: [[10, 4], [32, 4], [32, 12], [19, 12], [19, 17], [28, 17], [28, 25], [19, 25], [19, 36], [10, 36]],
  Y: [[2, 20], [11, 20], [11, 11], [20, 11], [20, 20], [38, 20], [38, 29], [2, 29]],
};
const turned = (pts: number[][], angle: number, mirror: boolean) => `<g transform="rotate(${angle} 20 20)"><g transform="${mirror ? "translate(40 0) scale(-1 1)" : ""}">${poly(pts, "grey")}</g></g>`;
const turnQs: [Level, string, number[], number][] = [
  ["easy", "L", [0, 0, 0], 0], ["easy", "flag", [0, 0, 0], 0],
  ["medium", "P", [0, 90, 180], 270], ["medium", "arrow", [0, 180, 270], 90],
  ["champ", "F", [90, 180, 270], 0], ["champ", "Y", [0, 90, 180], 270],
];
for (const [lv, name, angles, mirrorAngle] of turnQs) {
  const pts = TURN_SHAPES[name];
  add("oddTurn", lv, "Find the odd one out.", undefined, O(turned(pts, mirrorAngle, true), "flipped shape"), angles.map((a, i) => O(turned(pts, a, false), `turned shape ${i + 1}`)),
    "Three shapes are the same shape, just turned around. The odd one is flipped like a mirror image — no turning can make it match.", lv === "easy" ? undefined : "Note: You may turn the shapes around in your mind.");
}

// ---------- 12. Shape not in the picture ----------
type Placed = [ShapeKind, number, number, number];
const shapeNotQs: [Level, Placed[], ShapeKind, ShapeKind[]][] = [
  ["easy", [["rect", 100, 60, 80], ["circle", 100, 60, 42], ["triangle", 100, 60, 34]], "star", ["rect", "circle", "triangle"]],
  ["easy", [["square", 70, 60, 36], ["circle", 130, 60, 32], ["heart", 100, 88, 22]], "triangle", ["square", "circle", "heart"]],
  ["medium", [["hexagon", 75, 62, 40], ["star", 75, 62, 26], ["rect", 140, 70, 34], ["circle", 150, 36, 16]], "diamond", ["hexagon", "star", "rect"]],
  ["medium", [["triangle", 70, 66, 42], ["diamond", 125, 60, 36], ["moon", 160, 30, 16], ["circle", 70, 80, 12]], "heart", ["triangle", "diamond", "moon"]],
  ["champ", [["hexagon", 80, 60, 42], ["circle", 120, 64, 34], ["triangle", 100, 64, 22]], "pentagon", ["hexagon", "circle", "triangle"]],
  ["champ", [["star", 80, 58, 40], ["heart", 120, 66, 30], ["moon", 150, 34, 18], ["circle", 100, 60, 20], ["square", 46, 92, 16]], "cross", ["star", "heart", "moon"]],
];
for (const [lv, placed, absent, present] of shapeNotQs) {
  const body = svg(200, 125, placed.map(([k, x, y, r]) => shape(k, x, y, r, "none")).join(""));
  add("shapeNotIn", lv, "Which option is NOT a part of the question image?", S(body), O(shape(absent, 20, 20, 17), absent), present.map((k) => O(shape(k, 20, 20, 17), k)),
    `The picture is made of ${present.join(", ")}${placed.length > present.length ? " and more" : ""} — there is no ${absent} in it.`);
}

// ---------- 13. Object not in the picture ----------
const objNotQs: [Level, string, string, string[], string, number][] = [
  ["easy", "🍎🐶🚗⚽🌸🐟⭐🎈🏠", "🐱", ["🐶", "⚽", "⭐"], "cat", 3],
  ["easy", "🐘🦁🐒🦒🐻🐼🐯🐸🐔", "🐰", ["🦁", "🐼", "🐸"], "rabbit", 3],
  ["medium", "🚗🚌🚲✈️🚂🚢🚁🛵🚜🚀⛵🚑", "🚒", ["🚑", "🚜", "🚀"], "fire engine (the ambulance is there, not the fire engine)", 4],
  ["medium", "🍎🍌🍇🍓🍉🍍🥭🍒🍑🍐🍋🥝", "🍊", ["🍋", "🥭", "🍐"], "orange (the yellow lemon is there, not the orange)", 4],
  ["medium", "🎹🥁🎺🎻🪕🎷📯🔔🎤🎧📻🪇", "🎸", ["🎻", "🥁", "🎤"], "guitar (the violin is there, not the guitar)", 4],
  ["champ", "🐶🐺🦊🐱🐯🦁🐭🐹🐰🐻🐼🐨🐷🐮🐸🐵", "🐴", ["🐹", "🐺", "🐨"], "horse", 4],
  ["champ", "☀️🌙⭐☁️🌧️❄️⚡🌈🌪️🌊🔥💧🍁🌸🌵🍄", "🌻", ["🌸", "🍁", "🌵"], "sunflower (the pink flower is there, not the sunflower)", 4],
  ["champ", "⚽🏀🏈⚾🎾🏐🏓🏸🥊🎳⛳🏒🛹🎯🪁🥏", "🏉", ["🏈", "🏐", "🎯"], "rugby ball (the brown American football is there, not the rugby ball)", 4],
];
for (const [lv, grid, c, w, name, cols] of objNotQs) {
  const items = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(grid)].map((s) => s.segment);
  add("objectNotIn", lv, "Which of the following objects is NOT present in the question image?", { kind: "emoji", items, cols }, c, w, `Look at every picture carefully. There is no ${name}.`);
}

// ---------- 14. Find the missing part ----------
type TileFn = (r: number, c: number) => number; // 0 white, 1 grey, 2 black
const TONE: Fill[] = ["white", "grey", "black"];
const tile2 = (cells: number[]) => O(cells.map((v, i) => rect((i % 2) * 20, Math.floor(i / 2) * 20, 20, 20, TONE[v], 2)).join(""), cells.map((v) => TONE[v]).join(" "), "-3 -3 46 46");
const tilePatterns: [Level, TileFn, string][] = [
  ["easy", (_r, c) => [2, 0, 1, 2][c], "Each column keeps its own colour all the way down."],
  ["easy", (r) => [1, 2, 2, 1][r], "Each row keeps its own colour all the way across."],
  ["medium", (r, c) => ((r + c) % 2) * 2, "Black and white take turns like a chessboard."],
  ["medium", (r, c) => [0, 1, 2][(r + c) % 3], "Slanting lines of white, grey and black repeat."],
  ["champ", (r, c) => [2, 0, 1][(c - r + 3) % 3], "Black, white and grey slant the other way, moving one step each row."],
  ["champ", (r, c) => (r % 2 === 0 ? [2, 0, 2, 0] : [0, 1, 0, 1])[c], "Rows take turns: black-white rows, then white-grey rows."],
];
for (const [lv, f, why] of tilePatterns) {
  let body = "";
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!(r > 0 && r < 3 && c > 0 && c < 3)) body += rect(10 + c * 30, 10 + r * 30, 30, 30, TONE[f(r, c)], 2);
  body += rect(40, 40, 60, 60, "white", 2.5) + text(70, 70, "?", 30);
  const correct = [f(1, 1), f(1, 2), f(2, 1), f(2, 2)];
  const [a, b, c, d] = correct;
  const cands = [[b, a, d, c], [c, d, a, b], [d, c, b, a], correct.map((v) => (v === 2 ? 0 : v === 0 ? 2 : v)), [a, a, d, d], [2, 0, 0, 2], [0, 2, 2, 0], [1, 1, 1, 1], [2, 2, 2, 2], [0, 0, 0, 0]];
  const seen = new Set([correct.join()]); const wrong: number[][] = [];
  for (const cnd of cands) if (!seen.has(cnd.join())) { seen.add(cnd.join()); wrong.push(cnd); }
  add("missingTile", lv, "Find the missing part of the image.", S(svg(140, 140, body), "s"), tile2(correct), wrong.slice(0, 3).map(tile2), why);
}

// ---------- 15. Hidden letter ----------
type Seg = [number, number, number, number];
const LETTERS: Record<string, Seg[]> = {
  T: [[0, 0, 30, 0], [15, 0, 15, 40]], L: [[0, 0, 0, 40], [0, 40, 30, 40]], Z: [[0, 0, 30, 0], [30, 0, 0, 40], [0, 40, 30, 40]],
  H: [[0, 0, 0, 40], [30, 0, 30, 40], [0, 20, 30, 20]], E: [[0, 0, 0, 40], [0, 0, 30, 0], [0, 20, 30, 20], [0, 40, 30, 40]],
  F: [[0, 0, 0, 40], [0, 0, 30, 0], [0, 20, 30, 20]], N: [[0, 40, 0, 0], [0, 0, 30, 40], [30, 40, 30, 0]], K: [[0, 0, 0, 40], [0, 20, 30, 0], [0, 20, 30, 40]],
  X: [[0, 0, 30, 40], [30, 0, 0, 40]], V: [[0, 0, 15, 40], [15, 40, 30, 0]], Y: [[0, 0, 15, 20], [30, 0, 15, 20], [15, 20, 15, 40]], I: [[15, 0, 15, 40]],
  A: [[0, 40, 15, 0], [15, 0, 30, 40], [7.5, 20, 22.5, 20]], U: [[0, 0, 0, 40], [0, 40, 30, 40], [30, 40, 30, 0]],
};
const segKey = ([a, b, c, d]: Seg) => (a < c || (a === c && b < d) ? `${a},${b},${c},${d}` : `${c},${d},${a},${b}`);
const segSvg = (segs: Seg[]) => O(segs.map(([a, b, c, d]) => line(a + 5, b, c + 5, d, 2.5)).join(""), "line picture", "-4 -6 48 52");
const hiddenQs: [Level, string, string[], Seg[][]][] = [
  ["easy", "T", ["L", "H", "V"], [[[0, 40, 30, 40]], [[0, 0, 30, 40]], [[30, 0, 30, 40]], [[0, 20, 30, 20]]]],
  ["easy", "L", ["T", "V", "N"], [[[30, 0, 30, 20]], [[0, 20, 30, 20]], [[15, 0, 15, 40]], [[0, 0, 30, 0]]]],
  ["medium", "Z", ["N", "X", "T"], [[[0, 20, 30, 20]], [[0, 40, 30, 40]], [[30, 0, 30, 40]], [[0, 0, 0, 40]]]],
  ["medium", "H", ["N", "U", "K"], [[[0, 0, 30, 0]], [[30, 0, 30, 40]], [[0, 0, 30, 40]], [[15, 0, 15, 40]]]],
  ["champ", "E", ["F", "H", "K"], [[[30, 0, 30, 20]], [[30, 0, 30, 40], [0, 0, 30, 0]], [[0, 0, 30, 0], [15, 20, 15, 40]], [[30, 20, 30, 40]]]],
];
for (const [lv, target, others, extras] of hiddenQs) {
  const answerSegs = [...LETTERS[target], ...extras[0]];
  const wrongSegs = others.map((o, i) => [...LETTERS[o], ...extras[i + 1]]);
  add("hiddenLetter", lv, `Which of the following options has the letter "${target}" present in it?`, undefined, segSvg(answerSegs), wrongSegs.map(segSvg),
    `Look for all the lines of ${target} in the same position (no turning). Only one picture has every line of ${target}.`, "Note: Images in the options cannot be rotated.");
}
export const HIDDEN_LETTER_CHECK = hiddenQs.map(([, target, others, extras]) => ({ target: LETTERS[target].map(segKey), answer: [...LETTERS[target], ...extras[0]].map(segKey), wrong: others.map((o, i) => [...LETTERS[o], ...extras[i + 1]].map(segKey)) }));

// ---------- 16. Missing mirror half ----------
type HalfEl = { p: number[][] } | { c: [number, number, number] };
function arc(cx: number, cy: number, r: number, from: number, to: number) { const pts: number[][] = []; for (let a = from; a <= to; a += 15) pts.push([+(cx + r * Math.cos((a * Math.PI) / 180)).toFixed(1), +(cy + r * Math.sin((a * Math.PI) / 180)).toFixed(1)]); return pts; }
const HALVES: Record<string, HalfEl[]> = {
  house: [{ p: [[50, 8], [6, 40], [6, 78], [50, 78]] }, { p: [[16, 48], [30, 48], [30, 62], [16, 62], [16, 48]] }, { p: [[16, 32.7], [16, 14], [26, 14], [26, 25.5]] }],
  rocket: [{ p: [[50, 4], [36, 22], [36, 66], [50, 66]] }, { p: [[36, 46], [20, 70], [36, 64]] }, { p: arc(50, 34, 8, 90, 270) }],
  flag: [{ p: [[50, 6], [14, 26], [50, 30]] }, { p: arc(50, 56, 22, 90, 270) }, { p: [[50, 50], [40, 50], [40, 60], [50, 60]] }],
  butterfly: [{ p: [[50, 30], [30, 8], [8, 14], [10, 38], [50, 40]] }, { p: [[50, 44], [14, 52], [20, 74], [50, 58]] }, { c: [26, 24, 4] }],
  crown: [{ p: [[50, 22], [38, 42], [26, 14], [6, 42], [6, 72], [50, 72]] }, { c: [26, 58, 5] }],
  tree: [{ p: [[50, 4], [18, 36], [34, 36], [8, 62], [44, 62], [44, 78], [50, 78]] }, { c: [30, 50, 3] }, { c: [24, 30, 2.5] }],
};
const halfSvg = (els: HalfEl[], tf: (x: number, y: number) => number[]) => els.map((e) => ("p" in e ? poly(e.p.map(([x, y]) => tf(x, y)), "none", false, 2.5) : (() => { const [x, y] = tf(e.c[0], e.c[1]); return `<circle cx="${x}" cy="${y}" r="${e.c[2]}" fill="none" stroke="${INK}" stroke-width="2.5"/>`; })())).join("");
const mirrorQs: [Level, string][] = [["easy", "house"], ["easy", "crown"], ["medium", "rocket"], ["medium", "tree"], ["champ", "flag"], ["champ", "butterfly"]];
for (const [lv, name] of mirrorQs) {
  const els = HALVES[name];
  const q = svg(120, 86, halfSvg(els, (x, y) => [x + 4, y + 3]) + line(54, 0, 54, 86, 2, true) + text(85, 43, "?", 26));
  const ob = (body: string, label: string) => O(body, label, "-6 -4 62 88");
  const correct = ob(halfSvg(els, (x, y) => [50 - x, y]), "mirror half");
  const wrong = [ob(halfSvg(els, (x, y) => [x, y]), "same half, not flipped"), ob(halfSvg(els, (x, y) => [50 - x, 80 - y]), "upside-down half"), ob(halfSvg(els.slice(0, -1), (x, y) => [50 - x, y]), "half with a part missing")];
  add("mirrorHalf", lv, "Find the missing half which is most similar to the image given below.", S(q, "s"), correct, wrong,
    "Imagine a mirror on the dashed line: the other half is the same picture flipped, with every part (windows, dots, fins) in place.");
}

// ---------- 17/18/22. Counting scenes ----------
type Prim = { c: [number, number, number, Fill?] } | { r: [number, number, number, number, Fill?] } | { t: number[][]; f?: Fill } | { l: [number, number, number, number] } | { p: number[][]; f?: Fill };
const drawPrim = (p: Prim) => "c" in p ? shape("circle", p.c[0], p.c[1], p.c[2], p.c[3] ?? "white", 2.5) : "r" in p ? rect(p.r[0], p.r[1], p.r[2], p.r[3], p.r[4] ?? "white", 2.5) : "t" in p ? poly(p.t, p.f ?? "white", true, 2.5) : "l" in p ? line(p.l[0], p.l[1], p.l[2], p.l[3], 2.5) : poly(p.p, p.f ?? "white", true, 2.5);
const sun = (x: number, y: number): Prim[] => [{ c: [x, y, 12] }, ...[0, 45, 90, 135, 180, 225, 270, 315].map((a): Prim => { const r = (a * Math.PI) / 180; return { l: [x + 16 * Math.cos(r), y + 16 * Math.sin(r), x + 22 * Math.cos(r), y + 22 * Math.sin(r)] }; })];
type Scene = [Level, string, Prim[], number | null, string];
function countNumbers(answer: number) { const out = [answer + 1, answer - 1, answer + 2].filter((n) => n > 0); if (out.length < 3) out.push(answer + 3); return out.map(String); }
function addCount(type: TypeId, prompt: string, scenes: Scene[], kind: "c" | "r" | "t", note?: string) {
  for (const [lv, name, prims, override, why] of scenes) {
    const answer = override ?? prims.filter((p) => kind in p).length;
    add(type, lv, prompt, S(svg(200, 165, prims.map(drawPrim).join("")), "m"), String(answer), countNumbers(answer), `${name}: ${why}`, note);
  }
}
export const COUNT_SCENES: Record<string, Scene[]> = {
  circles: [
    ["easy", "Snowman", [{ c: [100, 118, 34] }, { c: [100, 62, 22] }, { c: [92, 57, 2.6, "black"] }, { c: [108, 57, 2.6, "black"] }, { r: [84, 28, 32, 14, "black"] }, { t: [[100, 64], [100, 70], [116, 67]] }, { l: [70, 96, 46, 80] }, { l: [130, 96, 154, 80] }], null, "2 snowballs + 2 eyes = 4 circles."],
    ["easy", "Caterpillar", [{ c: [40, 100, 16] }, { c: [70, 100, 16] }, { c: [100, 100, 16] }, { c: [132, 96, 19] }, { c: [138, 90, 3.5, "black"] }, { l: [126, 78, 120, 62] }, { l: [140, 78, 146, 62] }, { t: [[30, 140], [80, 140], [55, 125]], f: "grey" }], null, "4 body parts + 1 eye = 5 circles."],
    ["medium", "Car", [{ p: [[50, 70], [70, 44], [130, 44], [150, 70]] }, { r: [26, 70, 148, 38] }, { c: [62, 110, 16] }, { c: [138, 110, 16] }, { c: [62, 110, 5, "black"] }, { c: [138, 110, 5, "black"] }, { c: [164, 84, 5] }, ...sun(172, 24)], null, "2 wheels + 2 wheel centres + 1 headlight + 1 sun = 6 circles."],
    ["medium", "Traffic light", [{ r: [80, 16, 40, 112] }, { c: [100, 40, 12] }, { c: [100, 72, 12, "grey"] }, { c: [100, 104, 12, "black"] }, { r: [95, 128, 10, 30] }, { c: [38, 46, 16] }, { l: [38, 62, 46, 110] }, { t: [[150, 150], [190, 150], [170, 120]] }], null, "3 lights + 1 balloon = 4 circles."],
    ["medium", "Clown", [{ c: [100, 92, 44] }, { c: [84, 80, 5, "black"] }, { c: [116, 80, 5, "black"] }, { c: [100, 96, 8, "grey"] }, { t: [[74, 54], [126, 54], [100, 14]], f: "grey" }, { c: [100, 12, 7] }, { l: [84, 114, 116, 114] }, { r: [86, 136, 28, 10] }], null, "face + 2 eyes + nose + pom-pom = 5 circles."],
    ["champ", "Flower and sun", [{ l: [100, 96, 100, 160] }, { t: [[100, 140], [70, 128], [100, 128]], f: "grey" }, ...[0, 60, 120, 180, 240, 300].map((a): Prim => ({ c: [100 + 26 * Math.cos((a * Math.PI) / 180), 70 + 26 * Math.sin((a * Math.PI) / 180), 13] })), { c: [100, 70, 13, "grey"] }, ...sun(30, 26)], null, "6 petals + 1 middle + 1 sun = 8 circles."],
    ["champ", "Bicycle", [{ c: [55, 112, 28] }, { c: [145, 112, 28] }, { c: [55, 112, 20] }, { c: [145, 112, 20] }, { c: [55, 112, 4, "black"] }, { c: [145, 112, 4, "black"] }, { c: [100, 112, 7] }, { l: [55, 112, 85, 70] }, { l: [85, 70, 135, 70] }, { l: [100, 112, 85, 70] }, { l: [100, 112, 135, 70] }, { l: [135, 70, 145, 112] }, { l: [135, 70, 132, 50] }, { r: [74, 60, 22, 8, "black"] }, { c: [140, 48, 4, "black"] }], null, "2 tyres, 2 inner rims, 2 wheel centres, 1 pedal and 1 bell = 8 circles. Circles inside circles count too!"],
  ],
  rects: [
    ["easy", "Train engine", [{ r: [40, 50, 50, 60] }, { r: [52, 62, 26, 22] }, { r: [90, 76, 70, 34] }, { r: [128, 50, 14, 26] }, { c: [62, 122, 12] }, { c: [104, 122, 12] }, { c: [140, 122, 12] }], null, "cabin, window, body and chimney = 4 rectangles."],
    ["easy", "House", [{ t: [[40, 70], [160, 70], [100, 22]] }, { r: [120, 28, 14, 26] }, { r: [50, 70, 100, 80] }, { r: [88, 110, 24, 40] }, { r: [60, 84, 22, 18] }, { r: [118, 84, 22, 18] }, ...sun(28, 26)], null, "chimney, wall, door and 2 windows = 5 rectangles."],
    ["medium", "Robot", [{ c: [100, 12, 5] }, { l: [100, 17, 100, 24] }, { r: [76, 24, 48, 34] }, { c: [90, 38, 4, "black"] }, { c: [110, 38, 4, "black"] }, { r: [90, 48, 20, 5] }, { r: [66, 62, 68, 56] }, { r: [42, 66, 20, 42] }, { r: [138, 66, 20, 42] }, { r: [78, 120, 16, 34] }, { r: [106, 120, 16, 34] }], null, "head, mouth, body, 2 arms and 2 legs = 7 rectangles."],
    ["medium", "Bus", [{ r: [16, 46, 168, 72] }, { r: [26, 58, 26, 22] }, { r: [60, 58, 26, 22] }, { r: [94, 58, 26, 22] }, { r: [150, 58, 24, 52] }, { c: [52, 124, 14] }, { c: [140, 124, 14] }, { c: [52, 124, 4, "black"] }, { c: [140, 124, 4, "black"] }], null, "body, 3 windows and the door = 5 rectangles."],
    ["medium", "Building", [{ r: [56, 30, 88, 126] }, { r: [68, 42, 22, 18] }, { r: [110, 42, 22, 18] }, { r: [68, 72, 22, 18] }, { r: [110, 72, 22, 18] }, { r: [88, 116, 24, 40] }, { r: [74, 14, 52, 14] }, { l: [144, 30, 144, 4] }, { t: [[144, 4], [170, 11], [144, 18]], f: "grey" }], null, "building, 4 windows, door and sign board = 7 rectangles. (The flag is a triangle!)"],
    ["champ", "Truck", [{ r: [20, 48, 104, 70] }, { r: [30, 60, 40, 14] }, { r: [76, 60, 40, 14] }, { r: [124, 72, 52, 46] }, { r: [134, 80, 22, 18] }, { r: [168, 104, 12, 8] }, { c: [52, 126, 14] }, { c: [150, 126, 14] }, { r: [30, 86, 86, 10, "grey"] }], null, "container, 2 labels, stripe, cabin, window and bumper = 7 rectangles. Squares count as rectangles."],
    ["champ", "Window", [{ r: [40, 22, 120, 120] }, { l: [100, 22, 100, 142] }, { l: [40, 82, 160, 82] }], 9, "4 small panes + 2 tall halves (left, right) + 2 wide halves (top, bottom) + 1 whole window = 9 rectangles."],
  ],
  triangles: [
    ["easy", "Mountains", [{ t: [[10, 140], [70, 140], [40, 80]] }, { t: [[70, 140], [140, 140], [105, 54]] }, { t: [[140, 140], [196, 140], [168, 90]] }, { l: [105, 54, 105, 30] }, { t: [[105, 30], [126, 37], [105, 44]], f: "grey" }, ...sun(34, 30)], null, "3 mountains + 1 flag = 4 triangles."],
    ["easy", "Rocket", [{ t: [[80, 46], [120, 46], [100, 8]] }, { r: [80, 46, 40, 80] }, { c: [100, 74, 9] }, { t: [[80, 96], [80, 126], [60, 132]] }, { t: [[120, 96], [120, 126], [140, 132]] }, { t: [[84, 126], [96, 126], [90, 150]], f: "grey" }, { t: [[104, 126], [116, 126], [110, 150]], f: "grey" }], null, "nose, 2 fins and 2 flames = 5 triangles."],
    ["medium", "Sailboats", [{ p: [[20, 110], [120, 110], [106, 128], [34, 128]] }, { l: [70, 110, 70, 30] }, { t: [[66, 104], [66, 40], [28, 104]] }, { t: [[74, 104], [74, 46], [112, 104]] }, { t: [[70, 30], [88, 36], [70, 42]], f: "black" }, { p: [[130, 132], [190, 132], [182, 146], [138, 146]] }, { l: [160, 132, 160, 84] }, { t: [[164, 128], [164, 90], [186, 128]] }, { t: [[160, 84], [146, 89], [160, 94]], f: "black" }], null, "big boat: 2 sails + flag; small boat: 1 sail + flag = 5 triangles."],
    ["medium", "Party", [{ t: [[30, 70], [70, 70], [50, 20]], f: "grey" }, { c: [50, 18, 5] }, { t: [[130, 70], [170, 70], [150, 20]] }, { c: [150, 18, 5] }, { l: [10, 92, 190, 92] }, ...[0, 1, 2, 3, 4].map((i): Prim => ({ t: [[22 + i * 34, 92], [46 + i * 34, 92], [34 + i * 34, 116]], f: i % 2 ? "grey" : "white" })), { r: [80, 120, 40, 34] }], null, "2 party hats + 5 bunting flags = 7 triangles."],
    ["medium", "Ice creams and pizza", [{ t: [[20, 70], [52, 70], [36, 130]] }, { c: [36, 60, 15] }, { t: [[64, 70], [96, 70], [80, 130]] }, { c: [80, 60, 15] }, { t: [[108, 70], [140, 70], [124, 130]] }, { c: [124, 60, 15] }, { t: [[150, 140], [196, 140], [173, 96]], f: "grey" }, { t: [[150, 90], [196, 90], [173, 46]], f: "grey" }], null, "3 cones + 2 pizza slices = 5 triangles."],
    ["champ", "Tent and flags", [{ t: [[30, 140], [130, 140], [80, 40]] }, { l: [80, 40, 80, 140] }, { l: [150, 140, 150, 60] }, { t: [[150, 60], [180, 70], [150, 80]], f: "grey" }, { t: [[150, 84], [180, 94], [150, 104]] }], 5, "The tent's middle line makes 2 small triangles, and the whole tent is a 3rd one. Plus 2 flags = 5 triangles."],
    ["champ", "Triangle puzzle", [{ t: [[30, 145], [170, 145], [100, 20]] }, { t: [[65, 82.5], [135, 82.5], [100, 145]] }], 5, "4 small triangles (3 pointing up, 1 upside-down in the middle) + 1 big triangle = 5 triangles."],
  ],
};
addCount("countCircles", "Count the number of circles in the image given below.", COUNT_SCENES.circles, "c");
addCount("countRects", "Count the number of rectangles in the given figure.", COUNT_SCENES.rects, "r", "Note: Please count all the squares as rectangles for this question.");

// ---------- 19. Star boxes ----------
function starAt(x: number, y: number, black: boolean) { return shape("star", x, y, 9, black ? "black" : "white", 1.8); }
function starBox(content: string, x: number, y: number) {
  const n = content.length; const spots = n === 1 ? [[30, 30]] : n === 2 ? [[18, 30], [42, 30]] : n === 3 ? [[18, 20], [42, 20], [30, 42]] : [[18, 18], [42, 18], [18, 42], [42, 42]];
  return rect(x, y, 60, 60, "white", 2.5) + [...content].map((ch, i) => starAt(x + spots[i][0], y + spots[i][1], ch === "B")).join("");
}
const POS = ["top-left", "top-middle", "top-right", "middle-left", "centre", "middle-right", "bottom-left", "bottom-middle", "bottom-right"];
const starQs: [Level, number, "B" | "W", string[]][] = [
  ["easy", 1, "B", ["B", "WW", "B", "BB", "W", "B", "WB", "BB", "W"]],
  ["easy", 2, "W", ["WW", "B", "WW", "BW", "WW", "BB", "W", "WWB", "BB"]],
  ["medium", 3, "B", ["BBB", "BBW", "BB", "BBB", "WBB", "BBBB", "BBB", "B", "BBB"]],
  ["medium", 2, "B", ["BB", "BBW", "BB", "B", "BW", "BB", "WW", "BBB", "BB"]],
  ["medium", 1, "W", ["W", "BW", "W", "WW", "B", "W", "WB", "W", "WWW"]],
  ["champ", 3, "W", ["WWW", "WWB", "WWWW", "WWW", "BWW", "WWW", "WWW", "WWWB", "WWW"]],
  ["champ", 2, "B", ["BBWW", "BB", "BWB", "BB", "BBBB", "WBW", "BB", "BW", "WBBW"]],
];
for (const [lv, n, col, boxes] of starQs) {
  const hits = boxes.map((b, i) => (b === col.repeat(n) ? i : -1)).filter((i) => i >= 0);
  const body = svg(196, 196, boxes.map((b, i) => starBox(b, 8 + (i % 3) * 60, 8 + Math.floor(i / 3) * 60)).join(""));
  const word = col === "B" ? "BLACK" : "WHITE";
  add("starBoxes", lv, `Count the number of small boxes with ONLY ${n} ${word} star${n > 1 ? "s" : ""} in it.`, S(body), String(hits.length), countNumbers(hits.length),
    `Boxes with exactly ${n} ${word.toLowerCase()} star${n > 1 ? "s" : ""} and nothing else: ${hits.map((i) => POS[i]).join(", ")}. Boxes with an extra star of another colour do not count.`);
}

// ---------- 20. Shadows ----------
type Sh = [string, string?]; // glyph, transform kind
const shadowOpt = ([g, t]: Sh) => O(silhouette(20, 21, g, 34, t === "flipX" ? "translate(40 0) scale(-1 1)" : t === "flipY" ? "translate(0 42) scale(1 -1)" : ""), t === "flipX" ? "shadow facing the other way" : t === "flipY" ? "upside-down shadow" : "shadow");
const shadowQs: [Level, string, string, Sh[]][] = [
  ["easy", "🚗", "car", [["🚲"], ["🐘"], ["⛵"]]],
  ["easy", "🐘", "elephant", [["🦒"], ["🐈"], ["🚂"]]],
  ["easy", "⛵", "boat", [["🚗"], ["🏠"], ["🐟"]]],
  ["medium", "🦒", "giraffe", [["🦒", "flipX"], ["🐘"], ["🦕"]]],
  ["medium", "🐈", "cat", [["🐈", "flipX"], ["🐕"], ["🐁"]]],
  ["medium", "✈️", "aeroplane", [["✈️", "flipY"], ["🚁"], ["🐦"]]],
  ["champ", "🐓", "rooster", [["🐓", "flipX"], ["🐓", "flipY"], ["🦃"]]],
  ["champ", "🦕", "dinosaur", [["🦕", "flipX"], ["🦖"], ["🦕", "flipY"]]],
];
for (const [lv, g, name, wrong] of shadowQs) {
  add("shadow", lv, `Which of the following options could be the shadow of the ${name} given in the question image?`, S(svg(100, 90, text(50, 46, g, 64)), "s"), shadowOpt([g]), wrong.map(shadowOpt),
    lv === "easy" ? `The shadow has exactly the same outline as the ${name}.` : `The shadow must have the same outline AND face the same way as the ${name} — not flipped, not upside down.`);
}

// ---------- 21. Arrow number puzzles ----------
type Dir = "R" | "L" | "U" | "D";
type Cross = [number, number, number, number, Dir]; // top, left, right, bottom, arrow
function crossSvg(c: Cross, x: number, y: number) {
  const s = 20; const [t, l, r, b, d] = c; const cx = x + s * 1.5; const cy = y + s * 1.5;
  const cells = [[1, 0, t], [0, 1, l], [2, 1, r], [1, 2, b]].map(([i, j, v]) => rect(x + i * s, y + j * s, s, s, "white", 1.8) + text(x + i * s + s / 2, y + j * s + s / 2, String(v), 13));
  const v = { R: [-6, 0, 6, 0], L: [6, 0, -6, 0], U: [0, 6, 0, -6], D: [0, -6, 0, 6] }[d];
  const head = { R: `${cx + 8},${cy} ${cx + 2},${cy - 4} ${cx + 2},${cy + 4}`, L: `${cx - 8},${cy} ${cx - 2},${cy - 4} ${cx - 2},${cy + 4}`, U: `${cx},${cy - 8} ${cx - 4},${cy - 2} ${cx + 4},${cy - 2}`, D: `${cx},${cy + 8} ${cx - 4},${cy + 2} ${cx + 4},${cy + 2}` }[d];
  return cells.join("") + rect(x + s, y + s, s, s, "white", 1.8) + line(cx + v[0], cy + v[1], cx + v[2] * 0.6, cy + v[3] * 0.6, 1.8) + `<polygon points="${head}" fill="${INK}"/>`;
}
const headTail = ([t, l, r, b, d]: Cross) => (d === "R" ? [r, l] : d === "L" ? [l, r] : d === "U" ? [t, b] : [b, t]);
type ArrowRule = "headTail" | "tailHead" | "sum";
const arrowOut = (c: Cross, rule: ArrowRule) => { const [h, tl] = headTail(c); return rule === "headTail" ? `${h}${tl}` : rule === "tailHead" ? `${tl}${h}` : String(h + tl); };
const arrowWhy: Record<ArrowRule, string> = { headTail: "Write the number at the arrow's head first, then the number at its tail.", tailHead: "Write the number at the arrow's tail first, then the number at its head.", sum: "Add the number at the arrow's head and the number at its tail." };
const arrowQs: [Level, ArrowRule, Cross[]][] = [
  ["easy", "headTail", [[7, 3, 5, 2, "R"], [1, 6, 4, 8, "R"], [9, 2, 7, 3, "R"], [5, 8, 1, 6, "R"]]],
  ["easy", "headTail", [[2, 9, 6, 4, "U"], [8, 1, 3, 5, "U"], [6, 7, 2, 1, "U"], [3, 5, 9, 7, "U"]]],
  ["medium", "headTail", [[7, 3, 5, 2, "R"], [2, 4, 8, 6, "U"], [0, 8, 1, 5, "L"], [4, 6, 1, 9, "D"]]],
  ["medium", "headTail", [[3, 1, 6, 8, "D"], [5, 2, 9, 4, "L"], [7, 6, 3, 1, "U"], [2, 8, 4, 5, "R"]]],
  ["medium", "headTail", [[9, 4, 2, 6, "L"], [1, 7, 5, 3, "D"], [8, 3, 6, 2, "R"], [4, 9, 7, 1, "U"]]],
  ["champ", "tailHead", [[6, 2, 8, 4, "R"], [3, 9, 1, 7, "U"], [5, 4, 2, 8, "L"], [1, 3, 6, 9, "D"]]],
  ["champ", "sum", [[4, 2, 5, 1, "R"], [3, 6, 1, 2, "U"], [7, 1, 2, 5, "L"], [2, 4, 3, 6, "D"]]],
];
for (const [lv, rule, crosses] of arrowQs) {
  const body = svg(190, crosses.length * 70, crosses.map((c, i) => crossSvg(c, 6, 4 + i * 70) + arrow(76, 34 + i * 70, 120) + text(152, 34 + i * 70, i === crosses.length - 1 ? "?" : arrowOut(c, rule), 20)).join(""));
  const q = crosses[crosses.length - 1]; const correct = arrowOut(q, rule);
  const [t, l, r, b] = q;
  const pool = rule === "sum" ? [String(+correct + 1), String(+correct - 1), `${headTail(q)[0]}${headTail(q)[1]}`, String(t + b), String(l + r)] : [arrowOut(q, rule === "headTail" ? "tailHead" : "headTail"), `${t}${b}`, `${b}${t}`, `${l}${r}`, `${r}${l}`, `${t}${l}`];
  const wrong = [...new Set(pool.filter((p) => p !== correct))].slice(0, 3);
  add("arrowCross", lv, 'What will come in place of "?"', S(body, "l"), correct, wrong, arrowWhy[rule]);
}

addCount("countTriangles", "Count the number of triangles in the image given below.", COUNT_SCENES.triangles, "t");

// ---------- 23. Moving dot wheels ----------
function wheel(pos: number, black: boolean, cx: number, cy: number, r = 24) {
  let s = shape("circle", cx, cy, r, "white", 2.2);
  for (let k = 0; k < 4; k++) { const a = (k * 45 * Math.PI) / 180; s += line(cx + r * Math.cos(a), cy + r * Math.sin(a), cx - r * Math.cos(a), cy - r * Math.sin(a), 1.6); }
  const a = ((-90 + 22.5 + 45 * (((pos % 8) + 8) % 8)) * Math.PI) / 180;
  return s + shape("circle", cx + r * 0.62 * Math.cos(a), cy + r * 0.62 * Math.sin(a), r * 0.17, black ? "black" : "white", 1.6);
}
type WheelRule = { start: number; steps: number[]; colours: "black" | "alt"; why: string };
const wheelQs: [Level, WheelRule][] = [
  ["easy", { start: 0, steps: [1, 1, 1, 1], colours: "black", why: "The dot moves one step clockwise each time." }],
  ["easy", { start: 4, steps: [-1, -1, -1, -1], colours: "black", why: "The dot moves one step anticlockwise each time." }],
  ["medium", { start: 1, steps: [2, 2, 2, 2], colours: "black", why: "The dot jumps two steps clockwise each time." }],
  ["medium", { start: 6, steps: [1, 1, 1, 1], colours: "alt", why: "The dot moves one step clockwise and changes colour (black, white, black …) each time." }],
  ["medium", { start: 3, steps: [-1, -1, -1, -1], colours: "alt", why: "The dot moves one step anticlockwise and changes colour each time." }],
  ["champ", { start: 0, steps: [2, 2, 2, 2], colours: "alt", why: "The dot jumps two steps clockwise AND changes colour each time." }],
  ["champ", { start: 0, steps: [1, 2, 3, 4], colours: "black", why: "The jumps grow: 1 step, then 2, then 3, so next is 4 steps clockwise." }],
  ["champ", { start: 7, steps: [-2, -2, -2, -2], colours: "alt", why: "The dot jumps two steps anticlockwise and changes colour each time." }],
];
for (const [lv, w] of wheelQs) {
  const positions = [w.start]; for (const st of w.steps) positions.push(positions[positions.length - 1] + st);
  const colour = (i: number) => (w.colours === "black" ? true : i % 2 === 0);
  const body = svg(330, 66, positions.slice(0, 4).map((p, i) => wheel(p, colour(i), 34 + i * 66, 33)).join("") + text(298, 33, "?", 28));
  const ans = positions[4]; const ansC = colour(4); const prevStep = w.steps[3];
  const norm = (p: number) => ((p % 8) + 8) % 8;
  const cands: [number, boolean][] = [[ans + Math.sign(prevStep), ansC], [ans, !ansC], [ans - 2 * prevStep, ansC], [ans + Math.sign(prevStep), !ansC], [ans - Math.sign(prevStep), ansC]];
  const seen = new Set([`${norm(ans)}${ansC}`]); const wrong: [number, boolean][] = [];
  for (const [p, c] of cands) { const k = `${norm(p)}${c}`; if (!seen.has(k)) { seen.add(k); wrong.push([p, c]); } }
  const ow = ([p, c]: [number, boolean]) => O(wheel(p, c, 20, 20, 19), `wheel with ${c ? "black" : "white"} dot in part ${norm(p) + 1}`);
  add("dotWheel", lv, 'What will come in place of "?" in the given series?', S(body, "l"), ow([ans, ansC]), wrong.slice(0, 3).map(ow), w.why);
}

// ---------- 24. Hidden behind the wall ----------
function wallSvg(items: string[], hide: number) {
  const slots = [[96, 40], [176, 40], [60, 92], [240, 84], [150, 130]];
  const offsets = [[0, hide], [0, hide], [hide, 0], [-hide, 0], [0, -hide]];
  let s = items.map((g, i) => text(slots[i][0] + offsets[i][0], slots[i][1] + offsets[i][1], g, 44)).join("");
  s += `<rect x="60" y="40" width="180" height="90" fill="#e9d8c4" stroke="${INK}" stroke-width="3"/>`;
  for (let r = 1; r < 5; r++) s += line(60, 40 + r * 18, 240, 40 + r * 18, 1.2);
  for (let r = 0; r < 5; r++) for (let x = 60 + (r % 2 ? 15 : 30); x < 240; x += 30) s += line(x, 40 + r * 18, x, 58 + r * 18, 1.2);
  return svg(300, 170, s);
}
const wallQs: [Level, string, [string, string][], string, number][] = [
  ["easy", "fruit", [["🍎", "Apple"], ["🍌", "Banana"], ["🍇", "Grapes"], ["🍓", "Strawberry"]], "Mango", -9],
  ["easy", "animal", [["🐶", "Dog"], ["🐱", "Cat"], ["🐰", "Rabbit"], ["🐭", "Mouse"]], "Lion", -9],
  ["medium", "vehicle", [["🚗", "Car"], ["🚌", "Bus"], ["🚲", "Bicycle"], ["✈️", "Aeroplane"]], "Train", -4],
  ["medium", "toy", [["⚽", "Ball"], ["🎈", "Balloon"], ["🪁", "Kite"], ["🧸", "Teddy bear"]], "Drum", -4],
  ["medium", "vegetable", [["🥕", "Carrot"], ["🌽", "Corn"], ["🍆", "Brinjal"], ["🥦", "Broccoli"]], "Tomato", -4],
  ["champ", "animal", [["🐘", "Elephant"], ["🦒", "Giraffe"], ["🐒", "Monkey"], ["🦓", "Zebra"]], "Horse", 2],
  ["champ", "bird", [["🦆", "Duck"], ["🦉", "Owl"], ["🦜", "Parrot"], ["🐧", "Penguin"]], "Eagle", 2],
];
for (const [lv, kind, items, absent, hide] of wallQs) {
  const shown = items.map(([, n]) => n);
  add("hiddenWall", lv, `Which ${kind} is NOT HIDDEN behind the wall?`, S(wallSvg(items.map(([g]) => g), hide), "l"), absent, [shown[0], shown[1], shown[3]],
    `Peeking out from the wall: ${shown.join(", ")}. There is no ${absent.toLowerCase()}.`);
}

// ---------- 25. Part not in the picture ----------
type TileKind = "tl" | "tr" | "top" | "bottom" | "left" | "right" | "circle" | "dot" | "full" | "white" | "x";
function partTile(k: TileKind, x: number, y: number, s = 40) {
  const g = (pts: number[][]) => `<polygon points="${pts.map(([a, b]) => `${x + a * s},${y + b * s}`).join(" ")}" fill="${GREY}"/>`;
  const inner = { tl: g([[0, 0], [0, 1], [1, 1]]) + line(x, y, x + s, y + s, 2), tr: g([[0, 0], [1, 0], [1, 1]]) + line(x, y, x + s, y + s, 2), top: g([[0, 0], [1, 0], [1, 0.5], [0, 0.5]]) + line(x, y + s / 2, x + s, y + s / 2, 2), bottom: g([[0, 0.5], [1, 0.5], [1, 1], [0, 1]]) + line(x, y + s / 2, x + s, y + s / 2, 2), left: g([[0, 0], [0.5, 0], [0.5, 1], [0, 1]]) + line(x + s / 2, y, x + s / 2, y + s, 2), right: g([[0.5, 0], [1, 0], [1, 1], [0.5, 1]]) + line(x + s / 2, y, x + s / 2, y + s, 2), circle: shape("circle", x + s / 2, y + s / 2, s * 0.32, "white", 2), dot: shape("circle", x + s / 2, y + s / 2, s * 0.12, "black", 1.5), full: g([[0, 0], [1, 0], [1, 1], [0, 1]]), white: "", x: line(x, y, x + s, y + s, 2) + line(x + s, y, x, y + s, 2) }[k];
  return inner + `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
}
const TILE_NAME: Record<TileKind, string> = { tl: "grey triangle bottom-left", tr: "grey triangle top-right", top: "grey top half", bottom: "grey bottom half", left: "grey left half", right: "grey right half", circle: "circle", dot: "black dot", full: "all grey", white: "empty", x: "cross lines" };
const partQs: [Level, TileKind[], TileKind, TileKind[]][] = [
  ["easy", ["circle", "top", "tl", "white", "dot", "right"], "x", ["circle", "top", "dot"]],
  ["easy", ["left", "circle", "full", "tr", "white", "bottom"], "dot", ["left", "full", "bottom"]],
  ["medium", ["tl", "circle", "top", "dot", "right", "x"], "bottom", ["top", "circle", "x"]],
  ["medium", ["bottom", "x", "dot", "tr", "circle", "left"], "right", ["left", "dot", "x"]],
  ["champ", ["tl", "top", "circle", "x", "left", "dot"], "tr", ["tl", "left", "dot"]],
  ["champ", ["right", "tr", "full", "circle", "bottom", "x"], "tl", ["tr", "bottom", "circle"]],
];
for (const [lv, tiles, absent, present] of partQs) {
  const body = svg(132, 92, tiles.map((k, i) => partTile(k, 6 + (i % 3) * 40, 6 + Math.floor(i / 3) * 40)).join(""));
  const to = (k: TileKind) => O(partTile(k, 0, 0), TILE_NAME[k], "-3 -3 46 46");
  add("partNotIn", lv, "Which option is NOT present in the given image?", S(body, "s"), to(absent), present.map(to),
    lv === "champ" ? `The ${TILE_NAME[absent]} is not there. It looks like the ${TILE_NAME[present[0]]} turned around — but turning is not allowed!` : `Check each option against the picture: the ${TILE_NAME[absent]} is not there.`,
    "Note: Rotation of an option image or part of it is not allowed.");
}

// ---------- exports ----------
const TYPE_ORDER = new Map(TYPES.map((t, i) => [t.id as string, i]));
export const QUESTIONS: Question[] = bank.sort((a, b) => (TYPE_ORDER.get(a.type)! - TYPE_ORDER.get(b.type)!) || a.id.localeCompare(b.id, undefined, { numeric: true }));

/** Eight mock tests of 25: questions are dealt round-robin so every test mixes all types; Champ questions sit at the end, like the real paper. */
export const MOCK_TESTS: string[][] = (() => {
  const tests: Question[][] = Array.from({ length: 8 }, () => []);
  QUESTIONS.forEach((q, i) => tests[i % 8].push(q));
  return tests.map((t) => [...t].sort((a, b) => Number(a.level === "champ") - Number(b.level === "champ") || TYPE_ORDER.get(a.type)! - TYPE_ORDER.get(b.type)!).map((q) => q.id));
})();

export const optionLabel = (o: Opt) => (typeof o === "string" ? o : o.label);
