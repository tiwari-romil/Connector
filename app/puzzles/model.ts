// Puzzle Adventure — picture puzzles in the style of junior reasoning olympiads, for ages 4–6.
// Everything in this file is pure (no React, no browser APIs) so it can be unit-tested.

export type Family = "patterns" | "odd" | "analogy" | "count" | "order" | "maze" | "sums" | "shadow" | "mirror" | "position" | "balance" | "sudoku";
export const FAMILIES: { id: Family; icon: string; title: string; place: string; skill: string }[] = [
  { id: "patterns", icon: "🔴", title: "Pattern Park", place: "pattern-park", skill: "Patterns" },
  { id: "odd", icon: "🕵️", title: "Odd One Island", place: "odd-island", skill: "Odd one out" },
  { id: "count", icon: "🔢", title: "Counting Forest", place: "count-forest", skill: "Counting" },
  { id: "sums", icon: "🍎", title: "Number River", place: "number-river", skill: "Adding & missing numbers" },
  { id: "analogy", icon: "🔗", title: "Pairs Palace", place: "pairs-palace", skill: "Analogies" },
  { id: "order", icon: "🪜", title: "Story Steps", place: "story-steps", skill: "Ordering & sequencing" },
  { id: "maze", icon: "🦊", title: "Maze Mountain", place: "maze-mountain", skill: "Paths & directions" },
  { id: "shadow", icon: "🌑", title: "Shadow Cave", place: "shadow-cave", skill: "Shape matching (silhouettes)" },
  { id: "mirror", icon: "🪞", title: "Mirror Lake", place: "mirror-lake", skill: "Mirror images & turning" },
  { id: "position", icon: "🏘️", title: "Hide & Seek Town", place: "hide-seek-town", skill: "Position words (above, under, left, right)" },
  { id: "balance", icon: "⚖️", title: "Balance Bridge", place: "balance-bridge", skill: "Heavier, lighter & balancing" },
  { id: "sudoku", icon: "🌻", title: "Sudoku Garden", place: "sudoku-garden", skill: "Grid logic (mini-Sudoku)" },
];
export const MAX_LEVEL = 10;

export type Shape = "circle" | "square" | "triangle" | "star" | "heart";
export type Color = "red" | "blue" | "green" | "yellow" | "purple";
/** How a picture is turned: mirrored left–right, upside down, or rotated. */
export type Turn = "flipX" | "flipY" | "rot90" | "rot180";
export type Token =
  | { kind: "emoji"; glyph: string; scale?: number; name?: string; shadow?: boolean; turn?: Turn }
  | { kind: "row"; items: Token[] }
  | { kind: "shape"; shape: Shape; color: Color }
  | { kind: "group"; glyph: string; count: number }
  | { kind: "number"; value: number };

export type Display =
  | { type: "row"; items: (Token | null)[] }
  | { type: "analogy"; a: Token; b: Token; c: Token }
  | { type: "scene"; target: Token; items: { token: Token; x: number; y: number }[] }
  | { type: "sum"; left: number; right: number | null; total: number | null; glyph: string }
  | { type: "scales"; scales: { left: Token[]; right: Token[]; tilt: -1 | 0 | 1 }[] }
  | { type: "grid"; size: number; cells: (Token | null | "?")[] }
  | { type: "single"; token: Token; label?: string }
  | { type: "none" };

export type ChoicePuzzle = { interaction: "choice"; family: Family; level: number; prompt: string; display: Display; options: Token[]; answer: number; explain: string };
export type OrderPuzzle = { interaction: "order"; family: Family; level: number; prompt: string; cards: Token[]; order: number[]; explain: string };
export type MazePuzzle = { interaction: "maze"; family: Family; level: number; prompt: string; size: number; rocks: [number, number][]; start: [number, number]; goal: [number, number]; program: boolean; explain: string };
export type Puzzle = ChoicePuzzle | OrderPuzzle | MazePuzzle;

// ---------- random helpers ----------
export type Rng = () => number;
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const pick = <T,>(rng: Rng, list: readonly T[]) => list[Math.floor(rng() * list.length)];
export function shuffle<T>(rng: Rng, list: readonly T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
function sample<T>(rng: Rng, list: readonly T[], n: number): T[] { return shuffle(rng, list).slice(0, n); }
const clampLevel = (level: number) => Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));

export function tokenKey(token: Token): string {
  switch (token.kind) {
    case "emoji": return `e:${token.glyph}:${token.scale ?? 1}:${token.shadow ? "s" : ""}:${token.turn ?? ""}`;
    case "row": return `r:${token.items.map(tokenKey).join("|")}`;
    case "shape": return `s:${token.shape}:${token.color}`;
    case "group": return `g:${token.glyph}:${token.count}`;
    case "number": return `n:${token.value}`;
  }
}
const emoji = (glyph: string, name?: string, scale?: number): Token => ({ kind: "emoji", glyph, name, scale });
const num = (value: number): Token => ({ kind: "number", value });

/** Put the answer among distractors in a random slot; returns options + answer index. */
function withAnswer(rng: Rng, answer: Token, distractors: Token[], total = 4) {
  const seen = new Set([tokenKey(answer)]);
  const unique = distractors.filter((d) => { const k = tokenKey(d); if (seen.has(k)) return false; seen.add(k); return true; });
  const options = shuffle(rng, [answer, ...unique.slice(0, total - 1)]);
  return { options, answer: options.findIndex((o) => tokenKey(o) === tokenKey(answer)) };
}

function numberChoices(rng: Rng, answer: number, total = 4) {
  const distractors = shuffle(rng, [-1, 1, 2, -2]).map((d) => answer + d).filter((n) => n >= 0).map(num);
  return withAnswer(rng, num(answer), distractors, total);
}

// ---------- 1. Patterns ----------
const PATTERN_EMOJI = [["🐶", "dog"], ["🐱", "cat"], ["🍎", "apple"], ["🍌", "banana"], ["⭐", "star"], ["🌙", "moon"], ["🚗", "car"], ["🚌", "bus"], ["🐸", "frog"], ["🐟", "fish"], ["🌸", "flower"], ["⚽", "ball"]] as const;
const SHAPES: Shape[] = ["circle", "square", "triangle", "star", "heart"];
const COLORS: Color[] = ["red", "blue", "green", "yellow", "purple"];
const ARROWS = ["⬆️", "➡️", "⬇️", "⬅️"];

function patternPuzzle(rng: Rng, level: number): ChoicePuzzle {
  let sequence: Token[];
  let explain: string;
  if (level >= 9) {
    // Growing pattern or turning arrow (spatial rotation).
    if (rng() < 0.5) {
      const start = int(rng, 0, 3);
      const step = rng() < 0.5 ? 1 : 3; // clockwise or anticlockwise
      sequence = Array.from({ length: 6 }, (_, i) => emoji(ARROWS[(start + i * step) % 4]));
      explain = `The arrow turns a quarter turn ${step === 1 ? "clockwise" : "the other way"} each time.`;
    } else {
      const [glyph, name] = pick(rng, PATTERN_EMOJI);
      const start = int(rng, 1, 2);
      sequence = Array.from({ length: 5 }, (_, i) => ({ kind: "group", glyph, count: start + i }) as Token);
      explain = `One more ${name} is added every time.`;
    }
  } else if (level >= 7) {
    // Two things change at once: colour repeats every 2, shape every 3.
    const colors = sample(rng, COLORS, 2);
    const shapes = sample(rng, SHAPES, 3);
    sequence = Array.from({ length: 7 }, (_, i) => ({ kind: "shape", shape: shapes[i % 3], color: colors[i % 2] }) as Token);
    explain = `Look at colour AND shape. The colours go ${colors.join(", ")}. The shapes go ${shapes.join(", ")}.`;
  } else {
    const units = level <= 2 ? ["AB"] : ["AAB", "ABB", "ABC"];
    const unit = pick(rng, units);
    const letters = [...new Set(unit)];
    const chosen = sample(rng, PATTERN_EMOJI, letters.length);
    const map = Object.fromEntries(letters.map((l, i) => [l, chosen[i]]));
    const length = unit.length * 2 + (level <= 2 ? 1 : unit.length - 1);
    sequence = Array.from({ length }, (_, i) => { const [g, n] = map[unit[i % unit.length]]; return emoji(g, n); });
    explain = `The pattern goes ${unit.split("").map((l) => map[l][1]).join(", ")} — and then starts again.`;
  }
  const gapAt = level >= 5 && level <= 8 && rng() < 0.6 ? int(rng, 2, sequence.length - 2) : sequence.length - 1;
  const answer = sequence[gapAt];
  const items = sequence.map((t, i) => (i === gapAt ? null : t));
  const distractors: Token[] = [];
  for (const t of sequence) if (tokenKey(t) !== tokenKey(answer)) distractors.push(t);
  if (answer.kind === "shape") {
    distractors.unshift({ ...answer, color: pick(rng, COLORS.filter((c) => c !== answer.color)) }, { ...answer, shape: pick(rng, SHAPES.filter((s) => s !== answer.shape)) });
  }
  if (answer.kind === "group") distractors.unshift({ ...answer, count: answer.count + 1 }, { ...answer, count: Math.max(1, answer.count - 1) });
  if (answer.kind === "emoji" && ARROWS.includes(answer.glyph)) ARROWS.forEach((a) => distractors.push(emoji(a)));
  const extra = PATTERN_EMOJI.filter(([g]) => !sequence.some((t) => t.kind === "emoji" && t.glyph === g));
  distractors.push(...sample(rng, extra, 2).map(([g, n]) => emoji(g, n)));
  const { options, answer: index } = withAnswer(rng, answer, shuffle(rng, distractors.slice(0, 3)).concat(distractors.slice(3)), level <= 2 ? 3 : 4);
  return { interaction: "choice", family: "patterns", level, prompt: gapAt === sequence.length - 1 ? "What comes next?" : "What is missing in the pattern?", display: { type: "row", items }, options, answer: index, explain };
}

// ---------- 2. Odd one out ----------
const GROUPS: Record<string, { label: string; items: [string, string][] }> = {
  fruit: { label: "fruits", items: [["🍎", "apple"], ["🍌", "banana"], ["🍇", "grapes"], ["🍓", "strawberry"], ["🍊", "orange"], ["🍉", "watermelon"]] },
  veg: { label: "vegetables", items: [["🥕", "carrot"], ["🥦", "broccoli"], ["🌽", "corn"], ["🥒", "cucumber"], ["🍆", "brinjal"], ["🧅", "onion"]] },
  road: { label: "things that go on roads", items: [["🚗", "car"], ["🚌", "bus"], ["🚲", "bicycle"], ["🚚", "truck"], ["🛺", "auto rickshaw"], ["🏍️", "motorbike"]] },
  sky: { label: "things that fly in the sky", items: [["✈️", "aeroplane"], ["🚁", "helicopter"], ["🚀", "rocket"], ["🪂", "parachute"]] },
  water: { label: "things that go on water", items: [["⛵", "sailboat"], ["🚤", "speedboat"], ["🛳️", "ship"], ["🛶", "canoe"]] },
  sea: { label: "animals that live in water", items: [["🐟", "fish"], ["🐙", "octopus"], ["🦀", "crab"], ["🐬", "dolphin"], ["🐳", "whale"], ["🦈", "shark"]] },
  birds: { label: "birds", items: [["🐦", "bird"], ["🦜", "parrot"], ["🦉", "owl"], ["🐓", "rooster"], ["🦚", "peacock"]] },
  wild: { label: "four-legged wild animals", items: [["🦁", "lion"], ["🐯", "tiger"], ["🐘", "elephant"], ["🦒", "giraffe"], ["🦓", "zebra"], ["🦏", "rhino"]] },
  clothes: { label: "clothes", items: [["👕", "T-shirt"], ["👖", "jeans"], ["👗", "dress"], ["🧦", "socks"], ["🧥", "coat"], ["🧢", "cap"]] },
  school: { label: "school things", items: [["✏️", "pencil"], ["🖍️", "crayon"], ["📏", "ruler"], ["🎒", "school bag"], ["📚", "books"]] },
  body: { label: "body parts", items: [["👂", "ear"], ["👃", "nose"], ["👁️", "eye"], ["🦶", "foot"], ["✋", "hand"]] },
};
// Pairs that look alike — harder to spot (still only one correct answer).
const CLOSE_PAIRS: [string, string][] = [["fruit", "veg"], ["road", "sky"], ["sky", "water"], ["road", "water"], ["sea", "birds"], ["wild", "birds"], ["clothes", "school"]];
const FAR_PAIRS: [string, string][] = [["fruit", "road"], ["wild", "clothes"], ["school", "sea"], ["veg", "sky"], ["birds", "school"], ["clothes", "fruit"], ["body", "road"]];

function oddPuzzle(rng: Rng, level: number): ChoicePuzzle {
  if (level >= 7) {
    // Groups of things: one group has a different number.
    const same = level >= 9 ? int(rng, 3, 5) : int(rng, 2, 4);
    const odd = same + (rng() < 0.5 ? 1 : -1);
    const glyphs = sample(rng, PATTERN_EMOJI, 4);
    const tokens: Token[] = glyphs.map(([g], i) => ({ kind: "group", glyph: g, count: i === 0 ? odd : same }));
    const options = shuffle(rng, tokens);
    return { interaction: "choice", family: "odd", level, prompt: "Count each group. Which group is different?", display: { type: "none" }, options, answer: options.indexOf(tokens[0]), explain: `Three groups have ${same}. One group has ${odd}.` };
  }
  const [mainKey, oddKey] = pick(rng, level >= 4 ? CLOSE_PAIRS : FAR_PAIRS);
  const flip = rng() < 0.5;
  const main = GROUPS[flip ? oddKey : mainKey];
  const other = GROUPS[flip ? mainKey : oddKey];
  const three = sample(rng, main.items, 3).map(([g, n]) => emoji(g, n));
  const [og, on] = pick(rng, other.items);
  const answerToken = emoji(og, on);
  const options = shuffle(rng, [...three, answerToken]);
  return { interaction: "choice", family: "odd", level, prompt: "Which one does not belong?", display: { type: "none" }, options, answer: options.indexOf(answerToken), explain: `The others are ${main.label}. The ${on} is not.` };
}

// ---------- 3. Analogies ----------
const RELATIONS: { say: (a: string, b: string) => string; pairs: [string, string, string, string][] }[] = [
  { say: (a: string, b: string) => `A ${a} grows into a ${b}.`, pairs: [["🐣", "chick", "🐔", "hen"], ["🐛", "caterpillar", "🦋", "butterfly"], ["👶", "baby", "🧑", "grown-up"], ["🌱", "seedling", "🌳", "tree"], ["🥚", "egg", "🐣", "chick"]] },
  { say: (a: string, b: string) => `A ${a} likes to eat ${b}.`, pairs: [["🐰", "rabbit", "🥕", "carrot"], ["🐶", "dog", "🦴", "bone"], ["🐒", "monkey", "🍌", "banana"], ["🐱", "cat", "🐟", "fish"], ["🐄", "cow", "🌾", "grass"], ["🐭", "mouse", "🧀", "cheese"]] },
  { say: (a: string, b: string) => `A ${a} lives in a ${b}.`, pairs: [["🐟", "fish", "🌊", "pond"], ["🐦", "bird", "🪺", "nest"], ["🐝", "bee", "🍯", "hive"], ["🧑", "person", "🏠", "house"], ["🐶", "dog", "🛖", "kennel"]] },
  { say: (a: string, b: string) => `We put a ${a} on a ${b}.`, pairs: [["🧦", "sock", "🦶", "foot"], ["🧤", "glove", "✋", "hand"], ["🧢", "cap", "🙂", "head"], ["💍", "ring", "☝️", "finger"]] },
  { say: (a: string, b: string) => `We use ${a} in the ${b}.`, pairs: [["☂️", "an umbrella", "🌧️", "rain"], ["🕶️", "sunglasses", "☀️", "sun"], ["🧣", "a scarf", "❄️", "snow"], ["🪁", "a kite", "🌬️", "wind"]] },
];

function analogyPuzzle(rng: Rng, level: number): ChoicePuzzle {
  const relations = level <= 3 ? RELATIONS.slice(0, 2) : level <= 6 ? RELATIONS.slice(0, 4) : RELATIONS;
  const relation = pick(rng, relations);
  const [p1, p2] = sample(rng, relation.pairs, 2);
  // Distractors: things that are true for C in a *different* way, plus things from the same relation.
  const sameRelation = relation.pairs.filter((p) => p !== p2).map((p) => emoji(p[2], p[3]));
  const related = RELATIONS.flatMap((r) => r.pairs).filter((p) => (p[0] === p2[0] || p[1] === p2[1]) && p[2] !== p2[2]).map((p) => emoji(p[2], p[3]));
  const cAsOption = emoji(p2[0], p2[1]);
  const answer = emoji(p2[2], p2[3]);
  const pool = level >= 5 ? [...related, cAsOption, ...shuffle(rng, sameRelation)] : shuffle(rng, sameRelation);
  const { options, answer: index } = withAnswer(rng, answer, pool.filter((t) => tokenKey(t) !== tokenKey(answer)), level <= 2 ? 3 : 4);
  return {
    interaction: "choice", family: "analogy", level,
    prompt: `${cap(p1[1])} goes with ${p1[3]}. ${cap(p2[1])} goes with…?`,
    display: { type: "analogy", a: emoji(p1[0], p1[1]), b: emoji(p1[2], p1[3]), c: emoji(p2[0], p2[1]) },
    options, answer: index,
    explain: `${relation.say(p1[1], p1[3])} ${relation.say(p2[1], p2[3])}`,
  };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- 4. Counting in a picture ----------
const LOOKALIKES: [string, string, string, string][] = [["🍎", "apples", "🍅", "tomatoes"], ["🐶", "dogs", "🐺", "wolves"], ["🐝", "bees", "🐞", "ladybirds"], ["⭐", "stars", "🌟", "glowing stars"], ["🐟", "fish", "🐠", "striped fish"], ["🚗", "cars", "🚕", "taxis"], ["🌸", "pink flowers", "🌼", "yellow flowers"]];

function countPuzzle(rng: Rng, level: number): ChoicePuzzle {
  const [glyph, name, look, lookName] = pick(rng, LOOKALIKES);
  const target = level <= 2 ? int(rng, 2, 5) : level <= 5 ? int(rng, 4, 8) : int(rng, 6, level >= 9 ? 15 : 12);
  const others: string[] = [];
  if (level >= 3) others.push(...sample(rng, PATTERN_EMOJI.map(([g]) => g).filter((g) => g !== glyph && g !== look), level >= 5 ? 2 : 1));
  if (level >= 6) others.push(look);
  const otherCount = others.length ? int(rng, 2, Math.min(8, 2 + level)) : 0;
  const glyphs = [...Array(target).fill(glyph), ...Array.from({ length: otherCount }, () => pick(rng, others))];
  // Place on a jittered grid so nothing overlaps.
  const cols = glyphs.length <= 6 ? 3 : glyphs.length <= 12 ? 4 : 5;
  const rows = Math.ceil(glyphs.length / cols) + 1;
  const cells = shuffle(rng, Array.from({ length: cols * rows }, (_, i) => i)).slice(0, glyphs.length);
  const items = shuffle(rng, glyphs).map((g, i) => ({ token: emoji(g), x: ((cells[i] % cols) + 0.5) / cols * 100 + (rng() - 0.5) * 8, y: (Math.floor(cells[i] / cols) + 0.5) / rows * 100 + (rng() - 0.5) * 8 }));
  const { options, answer } = numberChoices(rng, target, level <= 2 ? 3 : 4);
  return { interaction: "choice", family: "count", level, prompt: `How many ${name} can you find?`, display: { type: "scene", target: emoji(glyph, name), items }, options, answer, explain: `Touch each one as you count. There are ${target} ${name}${level >= 6 ? ` — don't count the ${lookName}!` : "."}` };
}

// ---------- 5. Picture sums ----------
const SUM_GLYPHS = ["🍎", "🍓", "⭐", "🐟", "🎈", "🍪", "🚗"];
function sumPuzzle(rng: Rng, level: number): ChoicePuzzle {
  const glyph = pick(rng, SUM_GLYPHS);
  const maxTotal = level <= 2 ? 5 : level <= 5 ? 10 : 20;
  const total = int(rng, level <= 2 ? 2 : 4, maxTotal);
  const left = int(rng, 1, total - 1);
  const right = total - left;
  const missing = level >= 8 && rng() < 0.6;
  if (missing) {
    const { options, answer } = numberChoices(rng, right);
    return { interaction: "choice", family: "sums", level, prompt: `${left} and how many more make ${total}?`, display: { type: "sum", left, right: null, total, glyph }, options, answer, explain: `Start at ${left} and count on to ${total}: that is ${right} more. ${left} + ${right} = ${total}.` };
  }
  const { options, answer } = numberChoices(rng, total, level <= 2 ? 3 : 4);
  return { interaction: "choice", family: "sums", level, prompt: `${left} plus ${right}. How many altogether?`, display: { type: "sum", left, right, total: null, glyph }, options, answer, explain: `Start at ${left}, then count on ${right} more: ${left} + ${right} = ${total}.` };
}

// ---------- 6. Story steps (ordering) ----------
const STORIES: { say: string; steps: [string, string][] }[] = [
  { say: "an egg hatches into a chick that grows into a hen", steps: [["🥚", "egg"], ["🐣", "hatching chick"], ["🐥", "chick"], ["🐔", "hen"]] },
  { say: "a seed grows into a big tree", steps: [["🌰", "seed"], ["🌱", "sprout"], ["🪴", "small plant"], ["🌳", "tree"]] },
  { say: "the day goes from morning to night", steps: [["🌅", "sunrise"], ["☀️", "midday sun"], ["🌇", "sunset"], ["🌙", "night"]] },
  { say: "the moon looks bigger each night until it is full", steps: [["🌑", "new moon"], ["🌒", "thin moon"], ["🌓", "half moon"], ["🌕", "full moon"]] },
];
function orderPuzzle(rng: Rng, level: number): OrderPuzzle {
  const length = level <= 3 ? 3 : 4;
  let steps: Token[];
  let prompt: string;
  let explain: string;
  const kind = level <= 3 ? pick(rng, ["size", "count"]) : level <= 6 ? pick(rng, ["size", "count", "story"]) : pick(rng, ["story", "story", "reverse"]);
  if (kind === "story") {
    const story = pick(rng, STORIES);
    steps = story.steps.slice(0, length).map(([g, n]) => emoji(g, n));
    prompt = "Put the pictures in order. What happens first?";
    explain = `First to last: ${story.say}.`;
  } else if (kind === "count") {
    const [g, n] = pick(rng, PATTERN_EMOJI);
    const start = level >= 5 ? int(rng, 1, 3) : 1;
    steps = Array.from({ length }, (_, i) => ({ kind: "group", glyph: g, count: start + i }) as Token);
    prompt = "Put the groups in order, from fewest to most.";
    explain = `Count each group: ${steps.map((s) => (s as { count: number }).count).join(", ")}. The ${n} group with the fewest goes first.`;
  } else {
    const [g, n] = pick(rng, PATTERN_EMOJI);
    const scales = [0.6, 0.9, 1.25, 1.6].slice(0, length);
    const reverse = kind === "reverse";
    steps = (reverse ? [...scales].reverse() : scales).map((s) => emoji(g, n, s));
    prompt = reverse ? "Put them in order, from biggest to smallest." : "Put them in order, from smallest to biggest.";
    explain = reverse ? `The biggest ${n} goes first, then the next biggest…` : `The smallest ${n} goes first, then the next size…`;
  }
  let order = shuffle(rng, steps.map((_, i) => i));
  if (order.every((v, i) => v === i)) order = [...order.slice(1), order[0]];
  const cards = order.map((i) => steps[i]);
  // order[k] = which correct-position card is in slot k; child must tap cards so result is 0..n-1
  return { interaction: "order", family: "order", level, prompt, cards, order, explain };
}

// ---------- 7. Maze ----------
function mazePuzzle(rng: Rng, level: number): MazePuzzle {
  const size = level <= 2 ? 3 : level <= 5 ? 4 : 5;
  const program = level >= 5;
  for (let attempt = 0; attempt < 200; attempt++) {
    const start: [number, number] = [size - 1, 0];
    const goal: [number, number] = level <= 2 ? [0, size - 1] : [int(rng, 0, Math.floor(size / 2)), int(rng, Math.ceil(size / 2), size - 1)];
    const rockCount = Math.min(size * size - 4, level <= 2 ? 1 : level <= 5 ? 3 : 5 + Math.floor((level - 6) * 0.8));
    const free = Array.from({ length: size * size }, (_, i) => [Math.floor(i / size), i % size] as [number, number]).filter(([r, c]) => !(r === start[0] && c === start[1]) && !(r === goal[0] && c === goal[1]));
    const rocks = sample(rng, free, rockCount);
    const length = shortestPath(size, rocks, start, goal);
    const minLength = level <= 2 ? 2 : level <= 5 ? 4 : 5;
    if (length !== null && length >= minLength && (length <= 8 || level >= 8)) {
      return { interaction: "maze", family: "maze", level, prompt: program ? "Plan the fox's path with arrows, then press Go!" : "Help the fox reach the berries. Tap the arrows!", size, rocks, start, goal, program, explain: `The fox needs ${length} steps. Go around the rocks!` };
    }
  }
  return { interaction: "maze", family: "maze", level, prompt: "Help the fox reach the berries. Tap the arrows!", size: 3, rocks: [], start: [2, 0], goal: [0, 2], program: false, explain: "Go up, then go right." };
}
export const MOVES = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] } as const;
export type Move = keyof typeof MOVES;
export function shortestPath(size: number, rocks: [number, number][], start: [number, number], goal: [number, number]): number | null {
  const blocked = new Set(rocks.map(([r, c]) => `${r},${c}`));
  const queue: [number, number, number][] = [[start[0], start[1], 0]];
  const seen = new Set([`${start[0]},${start[1]}`]);
  while (queue.length) {
    const [r, c, d] = queue.shift()!;
    if (r === goal[0] && c === goal[1]) return d;
    for (const [dr, dc] of Object.values(MOVES)) {
      const nr = r + dr, nc = c + dc, key = `${nr},${nc}`;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size || blocked.has(key) || seen.has(key)) continue;
      seen.add(key); queue.push([nr, nc, d + 1]);
    }
  }
  return null;
}
/** Walk the fox. Returns the cells visited and whether it bumped into a rock/edge. */
export function walk(puzzle: Pick<MazePuzzle, "size" | "rocks" | "start" | "goal">, moves: Move[]) {
  const blocked = new Set(puzzle.rocks.map(([r, c]) => `${r},${c}`));
  let [r, c] = puzzle.start;
  const path: [number, number][] = [[r, c]];
  for (const move of moves) {
    const nr = r + MOVES[move][0], nc = c + MOVES[move][1];
    if (nr < 0 || nc < 0 || nr >= puzzle.size || nc >= puzzle.size || blocked.has(`${nr},${nc}`)) return { path, bumped: true, reached: false };
    r = nr; c = nc; path.push([r, c]);
    if (r === puzzle.goal[0] && c === puzzle.goal[1]) return { path, bumped: false, reached: true };
  }
  return { path, bumped: false, reached: false };
}

// ---------- 8. Shadow match ----------
// Things with a clear outline. Faces (🐶, 🐱) are avoided: their shadows are just round blobs.
const OUTLINES: Record<string, [string, string][]> = {
  animals: [["🐘", "elephant"], ["🦒", "giraffe"], ["🐇", "rabbit"], ["🐈", "cat"], ["🐕", "dog"], ["🐎", "horse"], ["🦘", "kangaroo"], ["🐿️", "squirrel"], ["🐢", "tortoise"], ["🐌", "snail"], ["🦀", "crab"], ["🐓", "rooster"], ["🦆", "duck"], ["🐊", "crocodile"], ["🦕", "dinosaur"], ["🐪", "camel"]],
  things: [["✈️", "aeroplane"], ["🚲", "bicycle"], ["🎸", "guitar"], ["☂️", "umbrella"], ["🔑", "key"], ["✂️", "scissors"], ["🪑", "chair"], ["⛵", "sailboat"], ["🏠", "house"], ["🌴", "palm tree"], ["🍌", "banana"], ["🍐", "pear"], ["🥕", "carrot"], ["🔨", "hammer"]],
};
function shadowPuzzle(rng: Rng, level: number): ChoicePuzzle {
  const pool = level <= 3 ? [...OUTLINES.animals, ...OUTLINES.things] : OUTLINES.animals;
  const chosen = sample(rng, pool, level <= 2 ? 3 : 4);
  const [g, n] = chosen[0];
  const flip = level >= 7 && rng() < 0.6;
  if (level >= 5 && rng() < 0.5) {
    // Reverse: picture shown, choose its shadow.
    const answer: Token = { kind: "emoji", glyph: g, name: n, shadow: true, turn: flip ? "flipX" : undefined };
    const distractors = chosen.slice(1).map(([dg, dn]) => ({ kind: "emoji", glyph: dg, name: dn, shadow: true, turn: flip ? "flipX" : undefined }) as Token);
    const { options, answer: index } = withAnswer(rng, answer, distractors);
    return { interaction: "choice", family: "shadow", level, prompt: `Which shadow belongs to the ${n}?`, display: { type: "single", token: emoji(g, n) }, options, answer: index, explain: `Look at the outline: the ${n}'s shadow has the same shape${flip ? ", just facing the other way" : ""}.` };
  }
  const shadow: Token = { kind: "emoji", glyph: g, name: n, shadow: true, turn: flip ? "flipX" : undefined };
  const { options, answer } = withAnswer(rng, emoji(g, n), chosen.slice(1).map(([dg, dn]) => emoji(dg, dn)), level <= 2 ? 3 : 4);
  return { interaction: "choice", family: "shadow", level, prompt: "Whose shadow is this?", display: { type: "single", token: shadow, label: "shadow" }, options, answer, explain: `The shadow has the same shape as the ${n}${flip ? " — it is just facing the other way" : ""}.` };
}

// ---------- 9. Mirror images ----------
// Pictures that clearly face one way, so a mirror image looks different.
const FACING: [string, string][] = [["🐟", "fish"], ["🦒", "giraffe"], ["🐌", "snail"], ["🐕", "dog"], ["🚗", "car"], ["🚲", "bicycle"], ["🐊", "crocodile"], ["🦖", "dinosaur"], ["🐓", "rooster"], ["🐢", "tortoise"], ["🐘", "elephant"], ["🐇", "rabbit"], ["🚂", "train"], ["🦕", "long-neck dinosaur"], ["🐪", "camel"]];
function mirrorPuzzle(rng: Rng, level: number): ChoicePuzzle {
  if (level <= 3) {
    // Which one is exactly the same? (others are turned)
    const [g, n] = pick(rng, FACING);
    const same = emoji(g, n);
    const turns: Turn[] = level <= 1 ? ["flipY", "rot90"] : ["flipX", "flipY", "rot180"];
    const { options, answer } = withAnswer(rng, same, turns.map((t) => ({ kind: "emoji", glyph: g, name: n, turn: t }) as Token));
    return { interaction: "choice", family: "mirror", level, prompt: "Find the one that is exactly the same.", display: { type: "single", token: same }, options, answer, explain: `The same ${n} faces the same way and is not upside down.` };
  }
  if (level <= 6) {
    const [g, n] = pick(rng, FACING);
    const answer: Token = { kind: "emoji", glyph: g, name: n, turn: "flipX" };
    const { options, answer: index } = withAnswer(rng, answer, [emoji(g, n), { kind: "emoji", glyph: g, name: n, turn: "flipY" }, { kind: "emoji", glyph: g, name: n, turn: "rot180" }]);
    return { interaction: "choice", family: "mirror", level, prompt: `Which one is the ${n} in the mirror?`, display: { type: "single", token: emoji(g, n), label: "🪞" }, options, answer: index, explain: "In a mirror, left and right swap. The picture faces the other way but stays the right way up." };
  }
  // Two pictures side by side: in the mirror their order swaps AND each one turns around.
  const [[g1, n1], [g2, n2]] = sample(rng, FACING, 2);
  const a = emoji(g1, n1), b = emoji(g2, n2);
  const fa: Token = { kind: "emoji", glyph: g1, name: n1, turn: "flipX" }, fb: Token = { kind: "emoji", glyph: g2, name: n2, turn: "flipX" };
  const answer: Token = { kind: "row", items: [fb, fa] };
  const { options, answer: index } = withAnswer(rng, answer, [{ kind: "row", items: [fa, fb] }, { kind: "row", items: [b, a] }, { kind: "row", items: [a, b] }]);
  return { interaction: "choice", family: "mirror", level, prompt: "Which picture shows them in the mirror?", display: { type: "single", token: { kind: "row", items: [a, b] }, label: "🪞" }, options, answer: index, explain: `In a mirror the ${n2} moves to the left side, the ${n1} to the right, and both face the other way.` };
}

// ---------- 10. Position words ----------
const TOWN: [string, string][] = [["🌳", "tree"], ["🏠", "house"], ["🚗", "car"], ["🐶", "dog"], ["🐱", "cat"], ["⚽", "ball"], ["🎈", "balloon"], ["🌻", "sunflower"], ["🚲", "bicycle"], ["🐦", "bird"], ["🍎", "apple"], ["🧸", "teddy"], ["⭐", "star"], ["🐸", "frog"]];
function positionPuzzle(rng: Rng, level: number): ChoicePuzzle {
  const size = 3;
  const filled = level <= 3 ? 5 : level <= 6 ? 7 : 9;
  for (let attempt = 0; attempt < 200; attempt++) {
    const glyphs = sample(rng, TOWN, filled);
    const cells: (Token | null)[] = Array(size * size).fill(null);
    shuffle(rng, cells.map((_, i) => i)).slice(0, filled).forEach((cell, i) => { cells[cell] = emoji(glyphs[i][0], glyphs[i][1]); });
    const relations = level <= 3 ? ["above", "under"] : level <= 6 ? ["above", "under", "left", "right"] : ["left", "right", "between"];
    const relation = pick(rng, relations);
    const ref = int(rng, 0, 8);
    const r = Math.floor(ref / 3), c = ref % 3;
    const at = (rr: number, cc: number) => (rr >= 0 && rr < 3 && cc >= 0 && cc < 3 ? cells[rr * 3 + cc] : null);
    const refTok = cells[ref] as Extract<Token, { kind: "emoji" }> | null;
    if (!refTok) continue;
    let answer: Token | null = null;
    let prompt = "";
    let explain = "";
    if (relation === "above") { answer = at(r - 1, c); prompt = `What is just above the ${refTok.name}?`; explain = "Above means higher up, right on top."; }
    if (relation === "under") { answer = at(r + 1, c); prompt = `What is just under the ${refTok.name}?`; explain = "Under means lower down, right below."; }
    if (relation === "left") { answer = at(r, c - 1); prompt = `What is just to the left of the ${refTok.name}?`; explain = "Your left hand makes an L. Look on that side, right next to it."; }
    if (relation === "right") { answer = at(r, c + 1); prompt = `What is just to the right of the ${refTok.name}?`; explain = "Your right hand is the one you don't make an L with. Look on that side, right next to it."; }
    if (relation === "between") {
      const left = at(r, c - 1) as Extract<Token, { kind: "emoji" }> | null, right = at(r, c + 1) as Extract<Token, { kind: "emoji" }> | null;
      if (!left || !right) continue;
      answer = refTok; prompt = `What is between the ${left.name} and the ${right.name}?`; explain = `The ${refTok.name} is in the middle, between them.`;
    }
    if (!answer) continue;
    const others = cells.filter((t): t is Token => !!t && tokenKey(t) !== tokenKey(answer!));
    const { options, answer: index } = withAnswer(rng, answer, shuffle(rng, others));
    if (options.length < 3) continue;
    return { interaction: "choice", family: "position", level, prompt, display: { type: "grid", size, cells }, options, answer: index, explain };
  }
  throw new Error("position puzzle generation failed");
}

// ---------- 11. Balance scales ----------
// Neutral things (no "obvious" real-world weight) so the child must read the scale.
const WEIGHTS: [string, string][] = [["🎁", "present"], ["📦", "box"], ["🧸", "teddy"], ["⚽", "ball"], ["🎒", "bag"], ["🪣", "bucket"], ["🧺", "basket"]];
const BIG_SMALL: { big: [string, string, string]; small: [string, string, string] }[] = [
  { big: ["🍉", "watermelon", "watermelons"], small: ["🍎", "apple", "apples"] },
  { big: ["🍍", "pineapple", "pineapples"], small: ["🍓", "strawberry", "strawberries"] },
  { big: ["📦", "box", "boxes"], small: ["🧸", "teddy", "teddies"] },
  { big: ["🎃", "pumpkin", "pumpkins"], small: ["🍋", "lemon", "lemons"] },
];
const HEAVY_LIGHT: [string, string, string, string][] = [["🐘", "elephant", "🐭", "mouse"], ["🚗", "car", "🚲", "bicycle"], ["🍉", "watermelon", "🍒", "cherries"], ["🪨", "rock", "🪶", "feather"], ["🐄", "cow", "🐔", "hen"], ["🏠", "house", "🪑", "chair"]];
const SAME: Token = { kind: "emoji", glyph: "🟰", name: "the same" };
function balancePuzzle(rng: Rng, level: number): ChoicePuzzle {
  if (level <= 3) {
    if (level <= 1 || rng() < 0.4) {
      // Real-world sense: which is heavier?
      const [hg, hn, lg, ln] = pick(rng, HEAVY_LIGHT);
      const flip = rng() < 0.5;
      const heavy = emoji(hg, hn);
      const options = shuffle(rng, [heavy, emoji(lg, ln), SAME]);
      return { interaction: "choice", family: "balance", level, prompt: `Which is heavier, the ${flip ? ln : hn} or the ${flip ? hn : ln}?`, display: { type: "none" }, options, answer: options.indexOf(heavy), explain: `A ${hn} is much heavier than a ${ln}.` };
    }
    // Read the scale: the lower side is heavier.
    const [[ag, an], [bg, bn]] = sample(rng, WEIGHTS, 2);
    const tilt = pick(rng, [-1, 1, 0] as const);
    const answer = tilt === 0 ? SAME : tilt === -1 ? emoji(ag, an) : emoji(bg, bn);
    const options = shuffle(rng, [emoji(ag, an), emoji(bg, bn), SAME]);
    return { interaction: "choice", family: "balance", level, prompt: "Look at the scale. Which is heavier?", display: { type: "scales", scales: [{ left: [emoji(ag, an)], right: [emoji(bg, bn)], tilt }] }, options, answer: options.findIndex((o) => tokenKey(o) === tokenKey(answer)), explain: tilt === 0 ? "The scale is flat, so they weigh the same." : "The heavier thing pulls its side of the scale down." };
  }
  if (level <= 6) {
    // Two scales: A heavier than B, B heavier than C → A is heaviest.
    const [[ag, an], [bg, bn], [cg, cn]] = sample(rng, WEIGHTS, 3);
    const A = emoji(ag, an), B = emoji(bg, bn), C = emoji(cg, cn);
    const askLightest = level >= 5 && rng() < 0.5;
    const scales = shuffle(rng, [
      rng() < 0.5 ? { left: [A], right: [B], tilt: -1 as const } : { left: [B], right: [A], tilt: 1 as const },
      rng() < 0.5 ? { left: [B], right: [C], tilt: -1 as const } : { left: [C], right: [B], tilt: 1 as const },
    ]);
    const answer = askLightest ? C : A;
    const options = shuffle(rng, [A, B, C]);
    return { interaction: "choice", family: "balance", level, prompt: askLightest ? "Which one is the lightest of all?" : "Which one is the heaviest of all?", display: { type: "scales", scales }, options, answer: options.indexOf(answer), explain: `The ${an} is heavier than the ${bn}, and the ${bn} is heavier than the ${cn}. So the ${an} is the heaviest and the ${cn} is the lightest.` };
  }
  // Balanced scale: 1 big = n small. How many small balance 2 (or 3) big?
  const { big: [bigG, bigN, bigP], small: [smallG, smallN, smallP] } = pick(rng, BIG_SMALL);
  void smallN;
  const n = int(rng, 2, 3);
  const bigCount = level >= 9 ? 3 : 2;
  const want = n * bigCount;
  const big = emoji(bigG, bigN);
  const { options, answer } = withAnswer(rng, num(want), shuffle(rng, [want - 1, want + 1, n, want + 2]).filter((x) => x > 0 && x !== want).map(num));
  return { interaction: "choice", family: "balance", level, prompt: `One ${bigN} weighs the same as ${n} ${smallP}. How many ${smallP} for ${bigCount} ${bigP}?`, display: { type: "scales", scales: [{ left: [big], right: Array(n).fill(emoji(smallG, smallN)), tilt: 0 }, { left: Array(bigCount).fill(big), right: [{ kind: "emoji", glyph: "❓", name: "how many" }], tilt: 0 }] }, options, answer, explain: `Each ${bigN} needs ${n} ${smallP}. ${bigCount} ${bigP} need ${Array(bigCount).fill(n).join(" + ")} = ${want}.` };
}

// ---------- 12. Mini-Sudoku ----------
const SUDOKU_SETS: [string, string][][] = [[["🍎", "apple"], ["🍌", "banana"], ["🍇", "grapes"], ["🍊", "orange"]], [["🐶", "dog"], ["🐱", "cat"], ["🐰", "rabbit"], ["🐸", "frog"]], [["🔴", "red"], ["🔵", "blue"], ["🟡", "yellow"], ["🟢", "green"]], [["🚗", "car"], ["🚌", "bus"], ["🚲", "bicycle"], ["🚂", "train"]]];
function latinSquare(rng: Rng, n: number): number[][] {
  const base = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (r + c) % n));
  const rows = shuffle(rng, base.map((_, i) => i)), cols = shuffle(rng, base.map((_, i) => i)), syms = shuffle(rng, base.map((_, i) => i));
  return rows.map((r) => cols.map((c) => syms[base[r][c]]));
}
function sudokuPuzzle(rng: Rng, level: number): ChoicePuzzle {
  const size = level <= 6 ? 3 : 4;
  const set = pick(rng, SUDOKU_SETS).slice(0, size);
  const grid = latinSquare(rng, size);
  const target = int(rng, 0, size * size - 1);
  const tr = Math.floor(target / size), tc = target % size;
  const blanks = level <= 2 ? 0 : level <= 4 ? 1 : level <= 6 ? 3 : level <= 8 ? 4 : 6;
  // Blank extra cells, but keep the ? cell solvable just by looking along its row and column.
  const visible = new Set(Array.from({ length: size * size }, (_, i) => i).filter((i) => i !== target));
  for (const cell of shuffle(rng, [...visible])) {
    if (size * size - 1 - visible.size >= blanks) break;
    visible.delete(cell);
    const seen = new Set<number>();
    for (const i of visible) if (Math.floor(i / size) === tr || i % size === tc) seen.add(grid[Math.floor(i / size)][i % size]);
    if (seen.size < size - 1) visible.add(cell);
  }
  const cells: (Token | null | "?")[] = Array.from({ length: size * size }, (_, i) => (i === target ? "?" : visible.has(i) ? emoji(set[grid[Math.floor(i / size)][i % size]][0], set[grid[Math.floor(i / size)][i % size]][1]) : null));
  const answerSym = set[grid[tr][tc]];
  const options = shuffle(rng, set.map(([g, n]) => emoji(g, n)));
  return { interaction: "choice", family: "sudoku", level, prompt: size === 3 ? "Every row and every column has one of each. What goes in the ? box?" : "Every row and column has one of each — four this time! What goes in the ? box?", display: { type: "grid", size, cells }, options, answer: options.findIndex((o) => o.kind === "emoji" && o.glyph === answerSym[0]), explain: `Look along the row and down the column of the ? box. The only one missing is the ${answerSym[1]}.` };
}

// ---------- generate ----------
export function generatePuzzle(family: Family, level: number, seed: number): Puzzle {
  const rng = makeRng(seed);
  const l = clampLevel(level);
  switch (family) {
    case "patterns": return patternPuzzle(rng, l);
    case "odd": return oddPuzzle(rng, l);
    case "analogy": return analogyPuzzle(rng, l);
    case "count": return countPuzzle(rng, l);
    case "sums": return sumPuzzle(rng, l);
    case "order": return orderPuzzle(rng, l);
    case "maze": return mazePuzzle(rng, l);
    case "shadow": return shadowPuzzle(rng, l);
    case "mirror": return mirrorPuzzle(rng, l);
    case "position": return positionPuzzle(rng, l);
    case "balance": return balancePuzzle(rng, l);
    case "sudoku": return sudokuPuzzle(rng, l);
  }
}

// ---------- progress & adaptive difficulty ----------
export const STICKERS = ["🦄", "🐉", "🦖", "🚂", "🚒", "🏎️", "🚀", "🛸", "🦈", "🐙", "🦋", "🐢", "🦩", "🐼", "🦁", "🐯", "🌋", "🌈", "🏰", "⚓", "🎡", "🎸", "🥁", "🏆", "👑", "💎", "🍩", "🍦", "🎃", "⛄"] as const;
export type PuzzleSave = {
  levels: Record<Family, number>;
  runs: Record<Family, number>;
  stats: Record<Family, { played: number; firstTry: number }>;
  stickers: string[];
  games: number;
  gym: { last: string; streak: number };
  foxName: string;
};
export const FOX_NAMES = ["Foxy", "Rusty", "Tiku", "Chintu", "Sparky", "Mango"] as const;
/** Keep a fox name short and plain (letters, spaces, hyphens). */
export function cleanName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[^\p{L} -]/gu, "").replace(/\s+/g, " ").trim().slice(0, 12).trim();
}
const blank = <T,>(value: () => T) => Object.fromEntries(FAMILIES.map((f) => [f.id, value()])) as Record<Family, T>;
export function emptySave(): PuzzleSave {
  return { levels: blank(() => 1), runs: blank(() => 0), stats: blank(() => ({ played: 0, firstTry: 0 })), stickers: [], games: 0, gym: { last: "", streak: 0 }, foxName: "" };
}
export function readPuzzleSave(raw: string | null): PuzzleSave {
  const save = emptySave();
  try {
    const data = JSON.parse(raw ?? "null");
    if (!data || typeof data !== "object") return save;
    for (const { id } of FAMILIES) {
      const level = data.levels?.[id];
      if (Number.isInteger(level)) save.levels[id] = clampLevel(level);
      const run = data.runs?.[id];
      if (Number.isInteger(run) && run >= 0 && run < 3) save.runs[id] = run;
      const stat = data.stats?.[id];
      if (stat && Number.isInteger(stat.played) && Number.isInteger(stat.firstTry) && stat.played >= stat.firstTry && stat.firstTry >= 0) save.stats[id] = { played: stat.played, firstTry: stat.firstTry };
    }
    if (Array.isArray(data.stickers)) save.stickers = [...new Set(data.stickers.filter((s: unknown) => typeof s === "string" && (STICKERS as readonly string[]).includes(s as string)))] as string[];
    if (Number.isInteger(data.games) && data.games >= 0) save.games = data.games;
    save.foxName = cleanName(data.foxName);
    if (data.gym && typeof data.gym.last === "string" && Number.isInteger(data.gym.streak) && data.gym.streak >= 0) save.gym = { last: data.gym.last, streak: data.gym.streak };
  } catch { /* damaged save → start fresh */ }
  return save;
}

/** 3 first-try wins in a row → level up. 2+ misses on one puzzle → level down. */
export function recordResult(save: PuzzleSave, family: Family, misses: number): PuzzleSave {
  const next: PuzzleSave = { ...save, levels: { ...save.levels }, runs: { ...save.runs }, stats: { ...save.stats, [family]: { played: save.stats[family].played + 1, firstTry: save.stats[family].firstTry + (misses === 0 ? 1 : 0) } } };
  if (misses === 0) {
    const run = save.runs[family] + 1;
    if (run >= 3) { next.levels[family] = clampLevel(save.levels[family] + 1); next.runs[family] = 0; }
    else next.runs[family] = run;
  } else {
    next.runs[family] = 0;
    if (misses >= 2) next.levels[family] = clampLevel(save.levels[family] - 1);
  }
  return next;
}

/** 70 % at the current level, 20 % one easier (confidence), 10 % one harder (stretch). */
export function pickLevel(current: number, roll: number) {
  if (roll < 0.2) return clampLevel(current - 1);
  if (roll >= 0.9) return clampLevel(current + 1);
  return clampLevel(current);
}

export function starsFor(misses: number) { return misses === 0 ? 3 : misses === 1 ? 2 : 1; }

export function finishGame(save: PuzzleSave, today: string, rng: Rng, brainGym: boolean): { save: PuzzleSave; sticker: string | null } {
  const unowned = STICKERS.filter((s) => !save.stickers.includes(s));
  const sticker = unowned.length ? pick(rng, unowned) : null;
  const next: PuzzleSave = { ...save, games: save.games + 1, stickers: sticker ? [...save.stickers, sticker] : save.stickers };
  if (brainGym && save.gym.last !== today) {
    const yesterday = new Date(new Date(`${today}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);
    next.gym = { last: today, streak: save.gym.last === yesterday ? save.gym.streak + 1 : 1 };
  }
  return { save: next, sticker };
}

export const GAME_LENGTH = 5;
/** Families for a 5-puzzle game: one island, or a mixed Brain Gym. */
export function planGame(choice: Family | "gym", rng: Rng): Family[] {
  if (choice !== "gym") return Array(GAME_LENGTH).fill(choice);
  return sample(rng, FAMILIES.map((f) => f.id), GAME_LENGTH);
}

/** The shortest list of moves from start to goal (used to show the way after two tries). */
export function solveMaze(puzzle: Pick<MazePuzzle, "size" | "rocks" | "start" | "goal">): Move[] {
  const blocked = new Set(puzzle.rocks.map(([r, c]) => `${r},${c}`));
  const queue: { r: number; c: number; moves: Move[] }[] = [{ r: puzzle.start[0], c: puzzle.start[1], moves: [] }];
  const seen = new Set([`${puzzle.start[0]},${puzzle.start[1]}`]);
  while (queue.length) {
    const { r, c, moves } = queue.shift()!;
    if (r === puzzle.goal[0] && c === puzzle.goal[1]) return moves;
    for (const [move, [dr, dc]] of Object.entries(MOVES) as [Move, readonly [number, number]][]) {
      const nr = r + dr, nc = c + dc, key = `${nr},${nc}`;
      if (nr < 0 || nc < 0 || nr >= puzzle.size || nc >= puzzle.size || blocked.has(key) || seen.has(key)) continue;
      seen.add(key); queue.push({ r: nr, c: nc, moves: [...moves, move] });
    }
  }
  return [];
}

/** Level for the next puzzle. In an island game the last puzzle is a one-level-harder "boss". */
export function levelFor(save: PuzzleSave, family: Family, index: number, island: boolean, roll: number): { level: number; boss: boolean } {
  if (island && index === GAME_LENGTH - 1) return { level: clampLevel(save.levels[family] + 1), boss: true };
  return { level: pickLevel(save.levels[family], roll), boss: false };
}
