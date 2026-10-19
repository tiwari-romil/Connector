"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DiscoveryMissions from "./DiscoveryMissions";
import PuzzleAdventure from "./puzzles/PuzzleAdventure";
import LogiquidsPrep from "./logiquids/LogiquidsPrep";
import { makeRng, shuffle } from "./puzzles/model";
import { speak } from "./speech";

type Difficulty = "Easy" | "Medium" | "Tricky";
type Subject = "math" | "science" | "logic";
type MathLevel = { a: number; b: number; difficulty: Difficulty };
type ScienceLevel = { prompt: string; answer: string; distractors: string[]; difficulty: Difficulty };
type LogicLevel = ScienceLevel & { category: "Odd One Out" | "What Comes Next?" };
type Progress = { levelIndex: number; unlocked: number; stars: number };
type AdventureProgress = Record<Subject, Progress>;
const MATH_LEVEL_COUNT = 70;

// Gentle climb for a 5-year-old: picture sums within 5 and 10, then within 20,
// then tens and ones without carrying (rods + blocks), then two 2-digit numbers.
const MATH_LEVELS: MathLevel[] = Array.from({ length: MATH_LEVEL_COUNT }, (_, i) => {
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

const SCIENCE_LEVELS: ScienceLevel[] = [
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
].map(([prompt, answer, ...distractors]) => ({
  prompt,
  answer,
  distractors,
  difficulty: "Easy" as Difficulty,
}));

// Older-child science (about Class 3–5). Parked out of the main quiz for now; kept for a later "Big Kid" pack.
export const BIG_KID_SCIENCE: ScienceLevel[] = ([
  ["Which organ pumps blood around your body?", "Heart", "Lungs", "Stomach", "Brain"],
  ["Which gas do humans need to breathe?", "Oxygen", "Carbon dioxide", "Helium", "Steam"],
  ["Which gas do plants take in to make food?", "Carbon dioxide", "Oxygen", "Nitrogen", "Steam"],
  ["What part of a plant takes in water from soil?", "Roots", "Petals", "Fruit", "Stem"],
  ["What do leaves use sunlight to make?", "Food for the plant", "Rain", "Soil", "Seeds"],
  ["Which material is best for a raincoat?", "Waterproof plastic", "Paper", "Cotton wool", "Tissue"],
  ["A magnet attracts which material?", "Iron", "Wood", "Glass", "Rubber"],
  ["Which change can be changed back?", "Ice melting", "Paper burning", "Wood rotting", "Egg cooking"],
  ["What happens to water when it gets very hot?", "It evaporates", "It freezes", "It becomes soil", "It turns to metal"],
  ["What are tiny water drops on a cold bottle called?", "Condensation", "Evaporation", "Freezing", "Melting"],
  ["Which force pulls objects toward Earth?", "Gravity", "Magnetism", "Friction", "Electricity"],
  ["What force slows a bike when brakes touch the wheel?", "Friction", "Gravity", "Light", "Sound"],
  ["What travels fastest?", "Light", "Sound", "A bicycle", "A river"],
  ["Which item needs electricity to work?", "A lamp", "A book", "A wooden spoon", "A ball"],
  ["Which simple machine helps lift a flag?", "Pulley", "Magnet", "Battery", "Thermometer"],
  ["How long does Earth take to go around the Sun?", "One year", "One day", "One week", "One month"],
  ["What causes day and night?", "Earth spins", "The Sun moves around Earth", "Clouds cover space", "The Moon turns off"],
  ["Which planet is known for its rings?", "Saturn", "Earth", "Mars", "Mercury"],
  ["Which animal is a herbivore?", "Rabbit", "Lion", "Eagle", "Shark"],
  ["What should you use to measure temperature?", "Thermometer", "Ruler", "Balance", "Compass"],
] as string[][]).map(([prompt, answer, ...distractors]) => ({ prompt, answer, distractors, difficulty: "Medium" as Difficulty }));

const LOGIC_LEVELS: LogicLevel[] = [
  ["Odd One Out", "Which one is different?", "🐶", "🐱", "🐭", "🍎"],
  ["Odd One Out", "Which one is different?", "🍌", "🍎", "🍇", "🚗"],
  ["Odd One Out", "Which one is different?", "🚗", "🚌", "🚲", "🐟"],
  ["Odd One Out", "Which one is different?", "🌞", "⭐", "🌙", "🧸"],
  ["Odd One Out", "Which one is different?", "⚽", "🏀", "🎾", "🍪"],
  ["Odd One Out", "Which one is different?", "👟", "🧦", "👢", "🐸"],
  ["Odd One Out", "Which one is different?", "🐸", "🐰", "🦘", "🚂"],
  ["Odd One Out", "Which one is different?", "🍓", "🍒", "🍅", "🛏️"],
  ["Odd One Out", "Which one is different?", "🦁", "🐯", "🐻", "🌳"],
  ["Odd One Out", "Which one is different?", "✏️", "🖍️", "🖊️", "🥪"],
  ["Odd One Out", "Which one is different?", "🐠", "🐬", "🐳", "🌼"],
  ["Odd One Out", "Which one is different?", "🪥", "🧼", "🛁", "🚀"],
  ["Odd One Out", "Which one is different?", "🥕", "🥦", "🌽", "🎈"],
  ["Odd One Out", "Which one is different?", "👒", "🧢", "🎩", "🍕"],
  ["Odd One Out", "Which one is different?", "🐔", "🦆", "🐦", "🚁"],
  ["Odd One Out", "Which one is different?", "🌧️", "❄️", "🌈", "🛴"],
  ["Odd One Out", "Which one is different?", "🛏️", "🪑", "🛋️", "🍭"],
  ["Odd One Out", "Which one is different?", "🥛", "🧃", "💧", "🧱"],
  ["Odd One Out", "Which one is different?", "🖐️", "👂", "👃", "🪁"],
  ["Odd One Out", "Which one is different?", "🚒", "🚑", "🚓", "🦋"],
  ["Odd One Out", "Which one is different?", "🐌", "🐛", "🐜", "🎸"],
  ["Odd One Out", "Which one is different?", "☕", "🥣", "🍽️", "⚽"],
  ["Odd One Out", "Which one is different?", "🏠", "🏫", "🏥", "🍉"],
  ["Odd One Out", "Which one is different?", "🖼️", "📚", "🧩", "🐘"],
  ["Odd One Out", "Which one is different?", "🌲", "🌻", "🌷", "🚤"],
  ["What Comes Next?", "What comes next?  🔴  🔵  🔴  🔵  ?", "🔴", "🔵", "🟢", "🟡"],
  ["What Comes Next?", "What comes next?  🐶  🐱  🐶  🐱  ?", "🐶", "🐱", "🐭", "🐰"],
  ["What Comes Next?", "What comes next?  1  2  3  ?", "4", "2", "5", "1"],
  ["What Comes Next?", "What comes next?  🌞  🌙  🌞  🌙  ?", "🌞", "🌙", "⭐", "☁️"],
  ["What Comes Next?", "What comes next?  🍎  🍌  🍎  🍌  ?", "🍎", "🍌", "🍇", "🍓"],
  ["What Comes Next?", "What comes next?  2  4  6  ?", "8", "7", "5", "10"],
  ["What Comes Next?", "What comes next?  🟥  🟨  🟥  🟨  ?", "🟥", "🟨", "🟦", "🟩"],
  ["What Comes Next?", "What comes next?  🐸  🐸  🐰  🐸  🐸  ?", "🐰", "🐸", "🐶", "🐱"],
  ["What Comes Next?", "What comes next?  5  4  3  ?", "2", "1", "4", "6"],
  ["What Comes Next?", "What comes next?  ⭐  ❤️  ⭐  ❤️  ?", "⭐", "❤️", "🌙", "🌈"],
  ["What Comes Next?", "What comes next?  🚌  🚗  🚌  🚗  ?", "🚌", "🚗", "🚲", "🚂"],
  ["What Comes Next?", "What comes next?  1  3  5  ?", "7", "6", "4", "8"],
  ["What Comes Next?", "What comes next?  🟢  🟢  🟡  🟢  🟢  ?", "🟡", "🟢", "🔵", "🔴"],
  ["What Comes Next?", "What comes next?  🐟  🐟  🦀  🐟  🐟  ?", "🦀", "🐟", "🐙", "🐬"],
  ["What Comes Next?", "What comes next?  10  9  8  ?", "7", "6", "9", "5"],
  ["What Comes Next?", "What comes next?  🍓  🍒  🍓  🍒  ?", "🍓", "🍒", "🍇", "🍌"],
  ["What Comes Next?", "What comes next?  ▲  ●  ▲  ●  ?", "▲", "●", "■", "★"],
  ["What Comes Next?", "What comes next?  🧦  👟  🧦  👟  ?", "🧦", "👟", "👢", "🧤"],
  ["What Comes Next?", "What comes next?  3  6  9  ?", "12", "10", "11", "8"],
  ["What Comes Next?", "What comes next?  🌧️  ☀️  🌧️  ☀️  ?", "🌧️", "☀️", "🌈", "❄️"],
  ["What Comes Next?", "What comes next?  🐝  🦋  🐝  🦋  ?", "🐝", "🦋", "🐞", "🐛"],
  ["What Comes Next?", "What comes next?  4  5  6  ?", "7", "8", "5", "3"],
  ["What Comes Next?", "What comes next?  🔺  🔺  🔵  🔺  🔺  ?", "🔵", "🔺", "🟨", "🟩"],
  ["What Comes Next?", "What comes next?  🥕  🥦  🥕  🥦  ?", "🥕", "🥦", "🌽", "🍅"],
  ["What Comes Next?", "What comes next?  7  8  9  ?", "10", "11", "8", "6"],
].map(([category, prompt, ...options]) => {
  // The early Odd One Out questions list the different item last; pattern questions list the answer first.
  const isOddOneOut = category === "Odd One Out";
  return {
    category: category as LogicLevel["category"],
    prompt,
    answer: isOddOneOut ? options[3] : options[0],
    distractors: isOddOneOut ? options.slice(0, 3) : options.slice(1),
    difficulty: "Easy" as Difficulty,
  };
}).concat([
  ["What Comes Next?", "What comes next?  2  4  6  8  ?", "10", "9", "11", "12"],
  ["What Comes Next?", "What comes next?  15  20  25  30  ?", "35", "34", "36", "40"],
  ["What Comes Next?", "What comes next?  30  27  24  21  ?", "18", "17", "19", "15"],
  ["What Comes Next?", "What comes next?  5  10  15  20  ?", "25", "24", "26", "30"],
  ["What Comes Next?", "What comes next?  1  4  7  10  ?", "13", "12", "14", "15"],
  ["What Comes Next?", "What comes next?  2  5  8  11  ?", "14", "13", "15", "16"],
  ["What Comes Next?", "What comes next?  20  18  16  14  ?", "12", "11", "13", "10"],
  ["What Comes Next?", "What comes next?  3  6  12  24  ?", "48", "36", "42", "50"],
  ["What Comes Next?", "What comes next?  🔴  🔵  🟢  🔴  🔵  ?", "🟢", "🔴", "🔵", "🟡"],
  ["What Comes Next?", "What comes next?  ▲  ●  ●  ▲  ●  ●  ?", "▲", "●", "■", "★"],
  ["Odd One Out", "Which does NOT belong with the others?", "🐧", "🐬", "🐋", "🦈"],
  ["Odd One Out", "Which does NOT belong with the others?", "🍎", "🟨", "🔺", "⚪"],
  ["Odd One Out", "Which does NOT belong with the others?", "9", "2", "4", "6"],
  ["Odd One Out", "Which does NOT belong with the others?", "🚲", "🌱", "🌳", "🌻"],
  ["Odd One Out", "Which does NOT belong with the others?", "🥕", "🍎", "🍌", "🍓"],
  ["What Comes Next?", "What comes next?  4  8  12  16  ?", "20", "18", "19", "21"],
  ["What Comes Next?", "What comes next?  7  14  21  28  ?", "35", "34", "36", "42"],
  ["What Comes Next?", "What comes next?  1  4  9  16  ?", "25", "20", "24", "26"],
  ["Odd One Out", "Which does NOT belong with the others?", "25", "12", "18", "24"],
  ["Odd One Out", "Which does NOT belong with the others?", "🐠", "🐝", "🦋", "🐞"],
].map(([category, prompt, answer, ...distractors]) => ({ category: category as LogicLevel["category"], prompt, answer, distractors, difficulty: "Medium" as Difficulty })));

const LEVEL_COUNT: Record<Subject, number> = { math: MATH_LEVEL_COUNT, science: SCIENCE_LEVELS.length, logic: LOGIC_LEVELS.length };

const COLORS = ["coral", "sky", "sun", "mint"];
const MASCOTS = ["🦊", "🐼", "🦁", "🐸", "🐨"];
const INITIAL_PROGRESS: AdventureProgress = {
  math: { levelIndex: 0, unlocked: 1, stars: 0 },
  science: { levelIndex: 0, unlocked: 1, stars: 0 },
  logic: { levelIndex: 0, unlocked: 1, stars: 0 },
};

// Wrong answers come from real mistakes: counting one too many/few, or mixing up tens.
function mathChoicesFor(level: MathLevel, index: number, visit: number) {
  const answer = level.a + level.b;
  const rng = makeRng(index * 7919 + visit * 104729 + 3);
  const near = shuffle(rng, [answer + 1, answer - 1, answer + 2, answer - 2]);
  const tensSlip = answer >= 20 ? [answer + 10, answer - 10] : [];
  const wrong = [...new Set([...shuffle(rng, tensSlip).slice(0, 1), ...near])].filter((n) => n >= 0 && n !== answer).slice(0, 3);
  return shuffle(rng, [answer, ...wrong].map(String));
}

// Answer position changes every time (seeded so server and browser agree).
function scienceChoicesFor(level: ScienceLevel, index: number, visit: number) {
  return shuffle(makeRng(index * 6151 + visit * 104729 + 7), [level.answer, ...level.distractors]);
}

function RodBlockPicture({ number, crossedBlocks = 0, safeRods = false }: { number: number; crossedBlocks?: number; safeRods?: boolean }) {
  const rods = Math.floor(number / 10);
  const blocks = number % 10;
  return <div className="number-picture" aria-label={`${number}: ${rods} rods and ${blocks} blocks`}><b>{number}</b><div className="place-value"><div className="tens-group" aria-label={`${rods} rods`}>{Array.from({ length: rods }, (_, index) => <i key={index} className={`ten-rod ${safeRods ? "safe-ten" : ""}`} />)}</div><div className="ones-group" aria-label={`${blocks} blocks`}>{Array.from({ length: blocks }, (_, index) => <i key={index} className={`one-block ${index < crossedBlocks ? "taken-block" : ""}`} />)}</div></div><small><span>▮ Rods</span><span>■ Blocks</span></small></div>;
}

function rodAndBlockExpansion(number: number) {
  const rods = Math.floor(number / 10);
  const blocks = number % 10;
  return `${number} = ${rods} ${rods === 1 ? "rod" : "rods"} + ${blocks} ${blocks === 1 ? "block" : "blocks"}`;
}

export default function Home() {
  const [discoveryMode, setDiscoveryMode] = useState(false);
  const [prep, setPrep] = useState(false);
  const [visit, setVisit] = useState(0);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [subject, setSubject] = useState<Subject>("math");
  const [progress, setProgress] = useState<AdventureProgress>(INITIAL_PROGRESS);
  const [streak, setStreak] = useState(0);
  const [wrongTries, setWrongTries] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">("playing");
  const [musicOn, setMusicOn] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [showLearn, setShowLearn] = useState(false);
  const [showMathHint, setShowMathHint] = useState(false);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const audioRef = useRef<AudioContext | null>(null);
  const musicTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const levels = subject === "math" ? MATH_LEVELS : subject === "science" ? SCIENCE_LEVELS : LOGIC_LEVELS;
  const current = progress[subject];
  const levelCount = LEVEL_COUNT[subject];
  const level = levels[current.levelIndex];
  const isMath = subject === "math";
  const isLogic = subject === "logic";
  const answer = isMath ? String((level as MathLevel).a + (level as MathLevel).b) : (level as ScienceLevel).answer;
  const choices = useMemo(() => isMath
    ? mathChoicesFor(level as MathLevel, current.levelIndex, visit)
    : scienceChoicesFor(level as ScienceLevel, current.levelIndex, visit), [isMath, level, current.levelIndex, visit]);
  const praise = ["Wow!", "Awesome!", "Super star!", "Brilliant!", "You got it!"][(current.levelIndex + visit) % 5];
  const questionText = isMath ? `${(level as MathLevel).a} plus ${(level as MathLevel).b}. How many altogether?` : (level as ScienceLevel).prompt;
  const quizVisible = started && !isLogic && !discoveryMode && !prep;

  // Read every quiz question aloud, then wake the answers up ("think first").
  useEffect(() => {
    if (!quizVisible) return;
    let done = false;
    const wake = () => { if (!done) { done = true; setReady(true); } };
    const fallback = setTimeout(wake, musicOn ? 5000 : 1200);
    if (musicOn) speak(questionText, { onEnd: () => setTimeout(wake, 200) });
    return () => { done = true; clearTimeout(fallback); };
  }, [quizVisible, questionText, visit, musicOn]);
  const totalStars = progress.math.stars + progress.science.stars + progress.logic.stars;

  useEffect(() => {
    const saved = localStorage.getItem("learning-adventure-progress");
    const oldMath = localStorage.getItem("math-adventure-progress");
    try {
      if (saved) {
        const data = JSON.parse(saved);
        // Browser-only progress is read after hydration so server and client first render match.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProgress({
          math: { levelIndex: Math.min(LEVEL_COUNT.math - 1, Math.max(0, data.math?.levelIndex || 0)), unlocked: Math.min(LEVEL_COUNT.math, Math.max(1, data.math?.unlocked || 1)), stars: Math.max(0, data.math?.stars || 0) },
          science: { levelIndex: Math.min(LEVEL_COUNT.science - 1, Math.max(0, data.science?.levelIndex || 0)), unlocked: Math.min(LEVEL_COUNT.science, Math.max(1, data.science?.unlocked || 1)), stars: Math.max(0, data.science?.stars || 0) },
          logic: { levelIndex: Math.min(LEVEL_COUNT.logic - 1, Math.max(0, data.logic?.levelIndex || 0)), unlocked: Math.min(LEVEL_COUNT.logic, Math.max(1, data.logic?.unlocked || 1)), stars: Math.max(0, data.logic?.stars || 0) },
        });
      } else if (oldMath) {
        const data = JSON.parse(oldMath);
        setProgress({ ...INITIAL_PROGRESS, math: { levelIndex: 0, unlocked: Math.min(LEVEL_COUNT.math, Math.max(1, data.unlocked || 1)), stars: Math.max(0, data.stars || 0) } });
      }
    } catch { localStorage.removeItem("learning-adventure-progress"); }
  }, []);

  useEffect(() => { localStorage.setItem("learning-adventure-progress", JSON.stringify(progress)); }, [progress]);
  useEffect(() => () => { if (musicTimer.current) clearInterval(musicTimer.current); audioRef.current?.close(); }, []);

  function audio() {
    if (!audioRef.current) audioRef.current = new AudioContext();
    if (audioRef.current.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  }

  function tone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.08, delay = 0) {
    if (!musicOn) return;
    const ctx = audio(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain).connect(ctx.destination); osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + duration);
  }

  function startMusic(force = false) {
    if ((!musicOn && !force) || musicTimer.current) return;
    // A soft 16-note pentatonic tune (instead of the same 4 notes forever); rests keep it calm.
    const notes = [392, 440, 523.3, 0, 440, 392, 329.6, 0, 293.7, 329.6, 392, 440, 392, 0, 329.6, 0]; let n = 0;
    const play = () => { const f = notes[n++ % notes.length]; if (f) tone(f, 0.45, "sine", 0.018); };
    play();
    musicTimer.current = setInterval(play, 700);
  }

  function toggleMusic() {
    const next = !musicOn; setMusicOn(next);
    if (!next && musicTimer.current) { clearInterval(musicTimer.current); musicTimer.current = null; }
    else if (next && started) setTimeout(() => startMusic(true), 0);
  }

  function resetPuzzle() { setSelected(null); setWrongTries(0); setWrongPicks([]); setStatus("playing"); setShowMathHint(false); setReady(false); setVisit((v) => v + 1); }
  function openPrep() { setPrep(true); setStarted(true); setShowMap(false); }
  function begin(nextSubject: Subject) { setSubject(nextSubject); setStarted(true); startMusic(); tone(392, 0.15, "sine", 0.08); tone(523.3, 0.25, "sine", 0.08, 0.12); }
  function switchSubject(nextSubject: Subject) { setPrep(false); setSubject(nextSubject); setShowMap(false); resetPuzzle(); }
  function speakPraise() { if (musicOn) speak(praise, { pitch: 1.35 }); }

  function pick(value: string, index: number) {
    if (status === "correct" || !ready || wrongPicks.includes(index)) return;
    setSelected(index);
    if (value === answer) {
      setStatus("correct"); const earned = wrongTries === 0 ? 3 : wrongTries === 1 ? 2 : 1;
      setProgress((previous) => ({ ...previous, [subject]: { ...previous[subject], stars: previous[subject].stars + earned, unlocked: Math.max(previous[subject].unlocked, Math.min(levelCount, current.levelIndex + 2)) } }));
      setStreak((value) => value + 1); tone(523.3, 0.18, "sine", 0.1); tone(659.3, 0.18, "sine", 0.1, 0.12); tone(784, 0.32, "sine", 0.1, 0.24); speakPraise();
    } else {
      setStatus("wrong"); setWrongPicks((picks) => [...picks, index]); setStreak(0); tone(180, 0.18, "sawtooth", 0.045);
      const tries = wrongTries + 1; setWrongTries(tries);
      if (tries >= 2) {
        // After two misses, teach instead of letting him keep guessing.
        if (isMath) { setShowMathHint(true); if (musicOn) speak((level as MathLevel).a < 10 && (level as MathLevel).b < 10 ? "Let's count the apples together." : "Let's count together. Put the rods together, then the blocks together."); }
        else if (musicOn) speak(`Let's think together. The answer is glowing. ${(level as ScienceLevel).prompt}`);
      } else if (musicOn) speak("Nearly! Try another one.");
    }
  }

  function nextLevel() {
    if (current.levelIndex === levelCount - 1) { setShowMap(true); return; }
    setProgress((previous) => ({ ...previous, [subject]: { ...previous[subject], levelIndex: previous[subject].levelIndex + 1 } })); resetPuzzle();
  }

  function chooseLevel(index: number) {
    if (index + 1 > current.unlocked) return;
    setProgress((previous) => ({ ...previous, [subject]: { ...previous[subject], levelIndex: index } })); resetPuzzle(); setShowMap(false);
  }

  return (
    <main className={`game-shell ${subject}-theme ${discoveryMode && !isLogic && !prep ? "discovery-screen" : ""} ${prep ? "prep-screen" : ""}`}>
      <div className="cloud cloud-one" aria-hidden="true">☁</div><div className="cloud cloud-two" aria-hidden="true">☁</div><div className="sparkles" aria-hidden="true">✦　·　✦　·　✦</div>
      <div className="sky-friends" aria-hidden="true"><span>🌈</span><span>{isMath ? "⭐" : isLogic ? "🪁" : "🦋"}</span><span>{isMath ? "🧮" : isLogic ? "🧩" : "🌼"}</span></div>
      <header className="topbar">
        <button className="brand" onClick={() => setShowMap(true)} aria-label="Open level map"><span className="brand-mark">{isMath ? "➕" : isLogic ? "🧩" : "🔬"}</span><span>Learning Adventure</span></button>
        <div className="subject-switch" aria-label="Choose a learning game"><button className={prep ? "active" : ""} onClick={openPrep}>🏆 LogIQids</button><button className={isMath && !prep ? "active" : ""} onClick={() => switchSubject("math")}>➕ Maths</button><button className={subject === "science" && !prep ? "active" : ""} onClick={() => switchSubject("science")}>🔬 Science</button><button className={isLogic && !prep ? "active" : ""} onClick={() => switchSubject("logic")}>🧩 Puzzles</button><button className="learn-button" onClick={() => setShowLearn(true)}>💡 Learn</button></div>
        <div className="stats"><div className="stat"><span>⭐</span><strong>{totalStars}</strong></div><div className="stat"><span>🔥</span><strong>{streak}</strong></div><button className="sound-button" onClick={toggleMusic} aria-label={musicOn ? "Turn music off" : "Turn music on"}>{musicOn ? "🔊" : "🔇"}</button></div>
      </header>
      {!isLogic && !prep && <div className="play-mode-switch" aria-label="Play style"><button aria-pressed={!discoveryMode} onClick={() => setDiscoveryMode(false)}>⭐ Level quizzes</button><button aria-pressed={discoveryMode} onClick={() => setDiscoveryMode(true)}>🔎 Discovery missions <small>with a grown-up</small></button></div>}
      {prep && <LogiquidsPrep soundOn={musicOn} />}
      {isLogic && started && !prep && <PuzzleAdventure soundOn={musicOn} />}
      {discoveryMode && !isLogic && !prep && <DiscoveryMissions key={subject} subject={subject as "math" | "science"} onQuiz={() => setDiscoveryMode(false)} soundOn={musicOn} />}
      <div hidden={discoveryMode || isLogic || prep}>
      <section className="level-strip" aria-label="Level progress"><div className="level-copy"><span className={`difficulty ${level.difficulty.toLowerCase()}`}>{level.difficulty}</span><h1>{isMath ? "Maths" : isLogic ? "Logic" : "Science"} · Level {current.levelIndex + 1}</h1></div><div className="progress-track"><span style={{ width: `${((current.levelIndex + 1) / levelCount) * 100}%` }} /></div><span className="progress-count">{current.levelIndex + 1} / {levelCount}</span></section>
      <section className={`play-card ${status} ${isMath ? "math-card" : isLogic ? "logic-card" : "science-card"}`} aria-live="polite">
        <div className="mascot" aria-hidden="true">{MASCOTS[Math.floor(current.levelIndex / 10)]}</div>
        <p className="instruction">{isMath ? ((level as MathLevel).a >= 10 ? "Use rods and blocks if you need a clue!" : "Connect the sum to the right answer!") : isLogic ? (level as LogicLevel).category === "Odd One Out" ? "Find the one that is different!" : "Choose what comes next!" : "Match the science question to the right answer!"}</p>
        {isMath ? <div key={`${subject}-${current.levelIndex}`} className="equation-bubble question-pop"><span>{(level as MathLevel).a}</span><b>+</b><span>{(level as MathLevel).b}</span><b>=</b><span className="question-mark">?</span></div> : <div key={`${subject}-${current.levelIndex}`} className={`equation-bubble question-pop ${isLogic ? "logic-prompt" : "science-prompt"}`}><span>{(level as ScienceLevel).prompt}</span></div>}
        <button className="hear-again" onClick={() => speak(questionText)} aria-label="Hear the question again">🔊 Hear it again</button>
        {isMath && <div className="math-hint"><button onClick={() => setShowMathHint((value) => !value)} aria-expanded={showMathHint}>{showMathHint ? "Hide the clue" : (level as MathLevel).a < 10 && (level as MathLevel).b < 10 ? "💡 Show me with apples" : "💡 Show rod & block hint"}</button>{showMathHint && (level as MathLevel).a < 10 && (level as MathLevel).b < 10 && <div className="dot-hint"><span>{"🍎".repeat((level as MathLevel).a)}</span><b>+</b><span>{"🍏".repeat((level as MathLevel).b)}</span><p>Count all the apples!</p></div>}{showMathHint && ((level as MathLevel).a >= 10 || (level as MathLevel).b >= 10) && <div className="hint-picture"><RodBlockPicture number={(level as MathLevel).a} /><span>+</span><RodBlockPicture number={(level as MathLevel).b} /><p className="hint-expansion">{rodAndBlockExpansion((level as MathLevel).a)}<br />{rodAndBlockExpansion((level as MathLevel).b)}</p><p>Put the <strong>rods</strong> together. Then put the <strong>blocks</strong> together.</p></div>}</div>}
        <div className="connection-zone"><svg className="connection-lines" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">{selected !== null && <path className={status === "correct" ? "right-line" : status === "wrong" ? "wrong-line" : ""} d={`M 500 0 C 500 100, ${125 + selected * 250} 90, ${125 + selected * 250} 220`} />}</svg><div className="trail-dot">✦</div><div className={`answers ${ready ? "" : "sleepy"}`}>{choices.map((choice, index) => <button key={`${choice}-${index}`} className={`answer ${COLORS[index]} ${selected === index ? "selected" : ""} ${wrongPicks.includes(index) ? "ruled-out" : ""} ${!isMath && wrongTries >= 2 && status !== "correct" && choice === answer ? "glow" : ""}`} onClick={() => pick(choice, index)} disabled={status === "correct" || !ready || wrongPicks.includes(index)} aria-label={`Answer ${choice}`}><span>{choice}</span><i aria-hidden="true" /></button>)}</div></div>
        <div className={`feedback ${status}`}>{status === "playing" && (ready ? <><span>👆</span> Tap an answer</> : <><span>👂</span> Listen…</>)}{status === "wrong" && <><span>{wrongTries >= 2 ? "💡" : "💪"}</span> {wrongTries >= 2 ? (isMath ? "Let’s use the clue — count them!" : "Look for the glowing answer!") : "Nearly! Try another one."}</>}{status === "correct" && <><span className="celebrate">🎉</span><div><strong>{praise}</strong><small>{isMath ? `You found ${answer}!` : isLogic ? `Great thinking — ${answer}!` : `That’s right — ${answer}!`}</small></div><button onClick={nextLevel}>{current.levelIndex === levelCount - 1 ? "See my map" : "Next level"} <span>→</span></button></>}</div>
      </section>
      <button className="map-button" onClick={() => setShowMap(true)}>🗺️ {isMath ? "Maths" : isLogic ? "Logic" : "Science"} map</button>
      </div>
      {status === "correct" && <div className="celebration-burst" aria-hidden="true"><span>🎉</span><span>⭐</span><span>🌟</span><span>🟣</span><span>✨</span><span>🟡</span><span>🎈</span><span>💜</span><span>⭐</span><span>🎊</span></div>}
      {!started && <div className="overlay"><div className="welcome-card"><div className="welcome-confetti" aria-hidden="true"><span>★</span><span>●</span><span>✦</span><span>▲</span><span>★</span></div><div className="welcome-mascot">🦊</div><p className="eyebrow">A special adventure for</p><h2 className="child-greeting" aria-label="Hi Hridhaan!"><small>Hi</small>{[..."Hridhaan!"].map((letter, index) => <span key={index}>{letter}</span>)}</h2><h3>What would you like to play?</h3><p>Solve puzzles, earn stars and collect stickers!</p><button className="puzzle-start prep-start" onClick={openPrep}>🏆 LogIQids exam prep <span>→</span></button><button className="puzzle-start" onClick={() => begin("logic")}>🧩 Puzzle Adventure <span>→</span></button><div className="welcome-choices"><button onClick={() => begin("math")}>➕ Maths <span>→</span></button><button className="science-start" onClick={() => begin("science")}>🔬 Science <span>→</span></button></div></div></div>}
      {showLearn && <div className="overlay learn-overlay" role="dialog" aria-modal="true" aria-label="Visual maths learning tricks"><div className="learn-card"><button className="close" onClick={() => setShowLearn(false)} aria-label="Close learning module">×</button><p className="eyebrow">Maths superpower</p><h2>Rods and blocks</h2><p className="learn-intro"><strong>One rod = ten.</strong> <strong>One block = one.</strong> See each number before you work it out.</p><article className="visual-trick addition-trick"><header><span>➕</span><div><h3>34 + 25</h3><p>Put the rods together. Then put the blocks together.</p></div></header><div className="math-visual"><RodBlockPicture number={34} /><span className="operator">+</span><RodBlockPicture number={25} /><span className="operator">=</span><div className="answer-picture"><RodBlockPicture number={59} /></div></div><div className="visual-steps"><span>3 rods + 2 rods = <strong>5 rods</strong></span><span>4 blocks + 5 blocks = <strong>9 blocks</strong></span></div><p className="memory-tip">“Rods together, blocks together!”</p></article><article className="visual-trick subtraction-trick"><header><span>➖</span><div><h3>47 − 5</h3><p>Keep the rods. Cross out five blocks.</p></div></header><div className="math-visual subtraction-visual"><RodBlockPicture number={47} crossedBlocks={5} safeRods /><span className="operator">− 5</span><span className="operator">=</span><div className="answer-picture"><RodBlockPicture number={42} safeRods /></div></div><div className="visual-steps"><span><strong>4 rods</strong> stay safe</span><span>7 blocks − 5 blocks = <strong>2 blocks</strong></span></div><p className="memory-tip">“The rods stay safe!”</p></article><section className="extra-examples" aria-label="More rod and block examples"><h3>More examples</h3><div><p><strong>26 + 13 = 39</strong><span>2 rods + 1 rod → 3 rods</span><span>6 blocks + 3 blocks → 9 blocks</span></p><p><strong>63 − 2 = 61</strong><span>6 rods stay safe</span><span>3 blocks − 2 blocks → 1 block</span></p></div></section><div className="learn-footer"><span>🧮</span><p>Now try the Maths game.</p><button onClick={() => { setShowLearn(false); switchSubject("math"); }}>Practise Maths →</button></div></div></div>}
      {showMap && <div className="overlay map-overlay" role="dialog" aria-modal="true" aria-label="Level map"><div className="map-card"><button className="close" onClick={() => setShowMap(false)} aria-label="Close level map">×</button><p className="eyebrow">Your {isMath ? "maths" : isLogic ? "logic" : "science"} adventure</p><h2>{isMath ? "Maths" : isLogic ? "Logic" : "Science"} map</h2><p>{current.unlocked === levelCount ? "Every level is unlocked — superstar!" : `${current.unlocked} of ${levelCount} levels unlocked`}</p><div className="level-grid">{levels.map((_, index) => { const isUnlocked = index + 1 <= current.unlocked; return <button key={index} disabled={!isUnlocked} onClick={() => chooseLevel(index)} className={`${isUnlocked ? "unlocked" : "locked"} ${index === current.levelIndex ? "current" : ""}`} aria-label={`Level ${index + 1}${isUnlocked ? "" : ", locked"}`}>{isUnlocked ? index + 1 : "🔒"}</button>; })}</div></div></div>}
    </main>
  );
}
