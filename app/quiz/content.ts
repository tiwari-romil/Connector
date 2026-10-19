// Level quizzes: 70 maths sums and 50 picture-free science questions.
// Pure data + pure functions (no React) so the content and scoring rules can be unit-tested.
import { makeRng, shuffle } from "../puzzles/model.ts";

export type Difficulty = "Easy" | "Medium" | "Tricky";
export type QuizSubject = "math" | "science";
export type MathLevel = { a: number; b: number; difficulty: Difficulty };
export type ScienceLevel = { prompt: string; answer: string; distractors: string[]; difficulty: Difficulty };
export type QuizProgress = { levelIndex: number; unlocked: number; stars: number; best: number[] };
export const QUIZ_SUBJECTS: readonly QuizSubject[] = ["math", "science"];

const MATH_LEVEL_COUNT = 70;

// Gentle climb for a 5-year-old: picture sums within 5 and 10, then within 20,
// then tens and ones without carrying (rods + blocks), then two 2-digit numbers.
export const MATH_LEVELS: MathLevel[] = Array.from({ length: MATH_LEVEL_COUNT }, (_, i) => {
  const rng = makeRng(i * 97 + 11);
  const between = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
  if (i < 15) { const a = between(1, 4); return { a, b: between(1, 5 - a), difficulty: "Easy" }; }
  if (i < 30) { const a = between(2, 8); return { a, b: between(1, 10 - a), difficulty: "Easy" }; }
  if (i < 45) { const a = between(6, 12); return { a, b: between(2, Math.min(9, 20 - a)), difficulty: "Medium" }; }
  if (i < 60) { const ones = between(0, 6); const a = between(1, 8) * 10 + ones; return { a, b: between(1, 9 - ones), difficulty: "Medium" }; }
  const aOnes = between(0, 5); const bOnes = between(1, 9 - aOnes);
  const aTens = between(1, 6); const bTens = between(1, 9 - aTens);
  return { a: aTens * 10 + aOnes, b: bTens * 10 + bOnes, difficulty: "Tricky" };
});

export const SCIENCE_LEVELS: ScienceLevel[] = [
  ["What gives us light in the day?", "The Sun", "The Moon", "A shoe", "A book"],
  ["What do we see in the sky at night?", "The Moon", "A fish", "A tree", "A bus"],
  ["What falls from clouds?", "Rain", "Sand", "Leaves", "Shoes"],
  ["What has many beautiful colours after rain?", "A rainbow", "A spoon", "A sock", "A chair"],
  ["What does a plant need to drink?", "Water", "Juice", "Milk", "Paint"],
  ["Which part of a plant drinks water?", "Roots", "Wings", "Wheels", "Tail"],
  ["Which part of a plant is usually green?", "A leaf", "A cloud", "A shell", "A stone"],
  ["What can grow into a plant?", "A seed", "A button", "A crayon", "A coin"],
  ["What insect visits flowers?", "A bee", "A snail", "A worm", "A spider"],
  ["What does a butterfly use to fly?", "Wings", "Paws", "Fins", "Hooves"],
  ["What does a dog have on its feet?", "Paws", "Fins", "Wheels", "Roots"],
  ["What animal lays eggs and has feathers?", "A bird", "A cat", "A dog", "A cow"],
  ["Where does a fish live?", "In water", "In a tree", "In a nest", "In a cave"],
  ["What animal likes to hop?", "A frog", "A lion", "A whale", "A snake"],
  ["What sound does a lion make?", "A roar", "A meow", "A quack", "A moo"],
  ["What sound does a cat make?", "A meow", "A roar", "A bark", "A buzz"],
  ["Which body part helps us see?", "Eyes", "Ears", "Feet", "Elbows"],
  ["Which body part helps us hear?", "Ears", "Nose", "Hands", "Knees"],
  ["Which body part helps us smell?", "Nose", "Toes", "Hair", "Fingers"],
  ["Which body part helps us taste?", "Tongue", "Thumb", "Ear", "Knee"],
  ["Which body part helps us feel things?", "Hands", "Teeth", "Eyes", "Hair"],
  ["What do we use to chew food?", "Teeth", "Ears", "Toes", "Fingers"],
  ["What helps us breathe?", "Lungs", "Shoes", "Pockets", "Buttons"],
  ["What keeps our heart healthy?", "Moving our body", "Eating rocks", "Never sleeping", "Skipping water"],
  ["What cleans our hands?", "Soap", "Sand", "Glue", "Paint"],
  ["What cleans our teeth?", "A toothbrush", "A fork", "A comb", "A ruler"],
  ["What protects our head on a bike?", "A helmet", "A scarf", "A sock", "A spoon"],
  ["What keeps us warm in winter?", "A coat", "An ice cube", "A fan", "A puddle"],
  ["What feels very cold?", "Ice", "Fire", "Soup", "Sunshine"],
  ["What feels very hot?", "Fire", "Snow", "Ice", "Rain"],
  ["What can a magnet attract?", "Iron", "Water", "Paper", "Wood"],
  ["What shape can roll easily?", "A ball", "A box", "A book", "A brick"],
  ["What is usually hard?", "A rock", "A pillow", "A sponge", "A cloud"],
  ["What is usually soft?", "A pillow", "A stone", "A spoon", "A wall"],
  ["Where does wood come from?", "A tree", "A cloud", "A fish", "A star"],
  ["What can paper be made from?", "Trees", "Shoes", "Rainbows", "Sandwiches"],
  ["Where does a car travel?", "On a road", "In the sky", "Under water", "On a roof"],
  ["Where does a boat travel?", "On water", "On a road", "In a tree", "On rails"],
  ["Where does an aeroplane fly?", "In the sky", "In a pond", "In a cave", "On rails"],
  ["Where does a train travel?", "On rails", "In the sky", "On water", "In a nest"],
  ["What tells us it is daytime?", "The Sun", "A pillow", "A starfish", "A shoe"],
  ["What is the big planet we live on?", "Earth", "A balloon", "A biscuit", "A hat"],
  ["What can we do with an empty bottle?", "Recycle it", "Throw it in a river", "Hide it in soil", "Break it"],
  ["What shines in the night sky?", "A star", "A chair", "A sock", "A sandwich"],
  ["What is made when light is blocked?", "A shadow", "A rainbow", "A song", "A smell"],
  ["What does water become when it freezes?", "Ice", "Smoke", "Sand", "Wood"],
  ["What does ice become when it melts?", "Water", "Rock", "Paper", "Wind"],
  ["What can make leaves move?", "Wind", "A spoon", "A pencil", "A sock"],
  ["What helps plants grow?", "Rain", "Plastic", "Paint", "Dust"],
  ["What do we use to look at tiny things?", "A magnifying glass", "A pillow", "A fork", "A shoe"],
].map(([prompt, answer, ...distractors]) => ({ prompt, answer, distractors, difficulty: "Easy" as Difficulty }));

export const LEVEL_COUNT: Record<QuizSubject, number> = { math: MATH_LEVELS.length, science: SCIENCE_LEVELS.length };

// Wrong answers come from real mistakes: counting one too many/few, or mixing up tens.
export function mathChoicesFor(level: MathLevel, index: number, visit: number) {
  const answer = level.a + level.b;
  const rng = makeRng(index * 7919 + visit * 104729 + 3);
  const near = shuffle(rng, [answer + 1, answer - 1, answer + 2, answer - 2]);
  const tensSlip = answer >= 20 ? [answer + 10, answer - 10] : [];
  const wrong = [...new Set([...shuffle(rng, tensSlip).slice(0, 1), ...near])].filter((n) => n >= 0 && n !== answer).slice(0, 3);
  return shuffle(rng, [answer, ...wrong].map(String));
}

// Answer position changes on every visit.
export function scienceChoicesFor(level: ScienceLevel, index: number, visit: number) {
  return shuffle(makeRng(index * 6151 + visit * 104729 + 7), [level.answer, ...level.distractors]);
}

export function rodAndBlockExpansion(number: number) {
  const rods = Math.floor(number / 10);
  const blocks = number % 10;
  return `${number} = ${rods} ${rods === 1 ? "rod" : "rods"} + ${blocks} ${blocks === 1 ? "block" : "blocks"}`;
}

// ---------- progress ----------
export function emptyProgress(): QuizProgress {
  return { levelIndex: 0, unlocked: 1, stars: 0, best: [] };
}

function cleanProgress(raw: unknown, count: number): QuizProgress {
  const data = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof QuizProgress, unknown>>;
  const whole = (value: unknown, min: number, max: number, fallback: number) => (Number.isInteger(value) ? Math.min(max, Math.max(min, value as number)) : fallback);
  const unlocked = whole(data.unlocked, 1, count, 1);
  const best = Array.isArray(data.best) ? Array.from({ length: Math.min(unlocked, data.best.length) }, (_, i) => whole((data.best as unknown[])[i], 0, 3, 0)) : [];
  return { levelIndex: whole(data.levelIndex, 0, unlocked - 1, 0), unlocked, stars: whole(data.stars, 0, Number.MAX_SAFE_INTEGER, 0), best };
}

/** Reads saved quiz progress; damaged data starts fresh, and the old maths-only save is migrated. */
export function readQuizProgress(saved: string | null, legacyMath: string | null = null): Record<QuizSubject, QuizProgress> {
  const result = { math: emptyProgress(), science: emptyProgress() };
  try {
    if (saved) {
      const data = JSON.parse(saved);
      for (const subject of QUIZ_SUBJECTS) result[subject] = cleanProgress(data?.[subject], LEVEL_COUNT[subject]);
    } else if (legacyMath) {
      const data = JSON.parse(legacyMath);
      result.math = cleanProgress({ unlocked: data?.unlocked, stars: data?.stars }, LEVEL_COUNT.math);
    }
  } catch { /* damaged save → start fresh */ }
  return result;
}

/** A level's stars count once: replaying only adds the stars that beat your best for that level. */
export function recordWin(progress: QuizProgress, index: number, earned: number, count: number): QuizProgress {
  const previousBest = progress.best[index] ?? 0;
  const best = Array.from({ length: Math.max(progress.best.length, index + 1) }, (_, i) => progress.best[i] ?? 0);
  best[index] = Math.max(previousBest, earned);
  return { ...progress, best, stars: progress.stars + Math.max(0, earned - previousBest), unlocked: Math.max(progress.unlocked, Math.min(count, index + 2)) };
}
