"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "Easy" | "Medium" | "Tricky";
type Subject = "math" | "science" | "logic";
type MathLevel = { a: number; b: number; difficulty: Difficulty };
type ScienceLevel = { prompt: string; answer: string; distractors: string[]; difficulty: Difficulty };
type LogicLevel = ScienceLevel & { category: "Odd One Out" | "What Comes Next?" };
type Progress = { levelIndex: number; unlocked: number; stars: number };
type AdventureProgress = Record<Subject, Progress>;

const MATH_LEVELS: MathLevel[] = Array.from({ length: 50 }, (_, i) => {
  if (i < 15) return { a: 6 + ((i * 3) % 10), b: 2 + (i % 8), difficulty: "Easy" };
  if (i < 35) return { a: 12 + ((i * 7) % 28), b: 11 + ((i * 5) % 25), difficulty: "Medium" };
  return { a: 28 + ((i * 9) % 42), b: 19 + ((i * 7) % 36), difficulty: "Tricky" };
});

const SCIENCE_CHALLENGES = [
  ["Which organ pumps blood around your body?", "Heart", "Lungs", "Stomach", "Brain"],
  ["Which gas do humans need to breathe?", "Oxygen", "Carbon dioxide", "Helium", "Steam"],
  ["Which gas do plants take in to make food?", "Carbon dioxide", "Oxygen", "Nitrogen", "Steam"],
  ["What part of a plant takes in water from soil?", "Roots", "Petals", "Fruit", "Stem"],
  ["What do leaves use sunlight to make?", "Food for the plant", "Rain", "Soil", "Seeds"],
  ["Which material is best for a raincoat?", "Waterproof plastic", "Paper", "Cotton wool", "Tissue"],
  ["A magnet attracts which material?", "Iron", "Wood", "Glass", "Rubber"],
  ["Which change is reversible?", "Ice melting", "Paper burning", "Wood rotting", "Egg cooking"],
  ["What happens to water when it is heated enough?", "It evaporates", "It freezes", "It becomes soil", "It turns to metal"],
  ["What do we call water vapour cooling into tiny drops?", "Condensation", "Evaporation", "Freezing", "Melting"],
  ["Which force pulls objects toward Earth?", "Gravity", "Magnetism", "Friction", "Electricity"],
  ["What force slows a bike when brakes touch the wheel?", "Friction", "Gravity", "Light", "Sound"],
  ["What travels fastest?", "Light", "Sound", "A bicycle", "A river"],
  ["Which item needs electricity to work?", "A lamp", "A book", "A wooden spoon", "A ball"],
  ["Which simple machine helps lift a flag?", "Pulley", "Magnet", "Battery", "Thermometer"],
  ["Why does the Moon seem to change shape?", "We see different lit parts", "It melts every month", "Clouds paint it", "It grows at night"],
  ["How long does Earth take to go around the Sun?", "One year", "One day", "One week", "One month"],
  ["What causes day and night?", "Earth spins", "The Sun moves around Earth", "Clouds cover space", "The Moon turns off"],
  ["Which planet is known for its rings?", "Saturn", "Earth", "Mars", "Mercury"],
  ["What protects Earth from too much sunlight?", "The atmosphere", "A rainbow", "The ocean floor", "Mountains"],
  ["Which animal is a herbivore?", "Rabbit", "Lion", "Eagle", "Shark"],
  ["What is a food chain's main energy source?", "The Sun", "The Moon", "Rocks", "Wind"],
  ["Why are bees important to many plants?", "They pollinate flowers", "They make soil", "They eat leaves", "They cool air"],
  ["Which habitat has very little rain?", "Desert", "Rainforest", "Pond", "Ocean"],
  ["What should you use to measure temperature?", "Thermometer", "Ruler", "Balance", "Compass"],
  ["Which action saves the most water?", "Turn off the tap while brushing", "Leave taps running", "Use extra water", "Throw water away"],
  ["What makes a shadow?", "An object blocking light", "A loud sound", "A cold day", "A smell"],
  ["Which material lets light pass through clearly?", "Clear glass", "Wood", "Cardboard", "Metal"],
  ["Why do we wear sunscreen?", "To protect skin from UV light", "To make rain", "To cool water", "To charge batteries"],
  ["What should you do before touching an electrical plug?", "Ask an adult", "Wet your hands", "Pull the wire", "Put it in water"],
  ["Which object will float in water?", "A cork", "A steel spoon", "A coin", "A rock"],
  ["What does a balanced diet provide?", "Different nutrients", "Only sugar", "Only water", "Only salt"],
  ["What is recycling?", "Making new things from used materials", "Throwing rubbish outside", "Burning all paper", "Using more plastic"],
  ["Why do people wash hands with soap?", "To remove germs", "To change skin colour", "To make hands bigger", "To grow nails"],
  ["What does a magnifying glass do?", "Makes tiny objects look bigger", "Makes objects lighter", "Measures temperature", "Creates electricity"],
];

const SCIENCE_HINTS = [
  "Think about a balloon moving up and down in your chest when you breathe.",
  "Plants use a gas from the air, while we breathe in the gas they release.",
  "Think about steam on a bathroom mirror after a warm shower.",
  "Think about water drops forming on the outside of a cold bottle.",
  "Imagine a ball falling when you let go of it.",
  "Rubbing your hands together makes them warm because of this force.",
  "A lightning flash is seen before we hear its thunder.",
  "Think of a torch, television, or fan at home.",
  "A flag goes up a rope over a wheel at the top of a pole.",
  "The Moon does not make its own light—it reflects sunlight.",
  "A birthday comes around after Earth makes one big trip around the Sun.",
  "Earth spins like a top; the side facing the Sun has daytime.",
  "It is the big planet that looks like it has a hoop around it.",
  "Air around Earth acts like a protective blanket.",
  "A herbivore eats plants, like carrots, grass, or leaves.",
  "Plants use sunlight to grow, so they start many food chains.",
  "Bees carry pollen between flowers when they collect nectar.",
  "Think of a place with lots of sand and cactus plants.",
  "A thermometer is used when you have a fever or check the weather.",
  "Turning off the tap while brushing saves water from being wasted.",
  "Put your hand between a torch and a wall to make one.",
  "You can see through a clean window because light travels through it.",
  "Sunscreen is like a shield for skin on a sunny day.",
  "Electricity can be dangerous, so an adult should help with plugs.",
  "Try thinking of what happens when you drop each item into a bowl of water.",
  "Your body needs a mix—fruit, vegetables, grains, and protein—not just one food.",
  "An old bottle can become something new instead of becoming rubbish.",
  "Soap helps wash away tiny germs that we cannot see.",
  "A magnifying glass helps you look closely at tiny things like an ant's legs.",
  "Look for the repeating step size between every number.",
  "Try saying the number pattern aloud slowly, one jump at a time.",
  "Check whether the pattern adds, subtracts, doubles, or repeats shapes.",
  "Cover the last item and predict the next group before looking at the choices.",
  "For an odd-one-out question, find the rule that three items share.",
  "Small clues matter: count shapes, watch direction, and notice colour order.",
];
const EARLY_SCIENCE_HINTS = [
  "Look outside in the morning—what bright object lights the sky?",
  "At bedtime, look up: it changes shape but shines in the sky.",
  "Clouds are made from water; think about what falls on an umbrella.",
  "After rain and sunshine, coloured bands can appear in the sky.",
  "Plants drink from the soil, just like we drink from a cup.",
  "The part under the soil drinks water for the plant.",
  "Leaves use sunlight, like tiny solar panels for plants.",
  "A tiny seed can become a big plant when it gets water and sunlight.",
  "This insect buzzes and visits flowers to collect nectar.",
  "Watch a butterfly in a garden—it uses these to move through the air.",
  "A dog's feet are not like a fish's fins or a car's wheels.",
  "Think of an animal with feathers that can build a nest.",
  "A fish needs water around its gills to breathe.",
  "This animal jumps and likes ponds or wet places.",
  "This big cat makes a loud sound in the jungle.",
];

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
  ["What can a magnet stick to?", "Metal", "Water", "Paper", "Wood"],
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
].map(([prompt, answer, ...distractors], index) => {
  const challenge = index >= 15 ? SCIENCE_CHALLENGES[index - 15] : undefined;
  const [challengePrompt, challengeAnswer, ...challengeDistractors] = challenge ?? [prompt, answer, ...distractors];
  return {
    prompt: challengePrompt,
    answer: challengeAnswer,
    distractors: challengeDistractors,
    difficulty: index < 15 ? "Easy" : index < 35 ? "Medium" : "Tricky",
  };
});

const LOGIC_CHALLENGES = [
  ["What Comes Next?", "What comes next?  2  4  6  8  ?", "10", "9", "11", "12"],
  ["What Comes Next?", "What comes next?  15  20  25  30  ?", "35", "34", "36", "40"],
  ["What Comes Next?", "What comes next?  30  27  24  21  ?", "18", "17", "19", "15"],
  ["What Comes Next?", "What comes next?  5  10  15  20  ?", "25", "24", "26", "30"],
  ["What Comes Next?", "What comes next?  1  4  7  10  ?", "13", "12", "14", "15"],
  ["What Comes Next?", "What comes next?  2  5  8  11  ?", "14", "13", "15", "16"],
  ["What Comes Next?", "What comes next?  20  18  16  14  ?", "12", "11", "13", "10"],
  ["What Comes Next?", "What comes next?  3  6  12  24  ?", "48", "36", "42", "50"],
  ["What Comes Next?", "What comes next?  1  2  4  7  11  ?", "16", "15", "17", "18"],
  ["What Comes Next?", "What comes next?  10  9  7  4  ?", "0", "1", "2", "3"],
  ["What Comes Next?", "What comes next?  ▲  ●  ●  ▲  ●  ●  ?", "▲", "●", "■", "★"],
  ["What Comes Next?", "What comes next?  🔴  🔵  🟢  🔴  🔵  ?", "🟢", "🔴", "🔵", "🟡"],
  ["What Comes Next?", "What comes next?  🐶  🐱  🐱  🐶  🐱  🐱  ?", "🐶", "🐱", "🐭", "🐰"],
  ["What Comes Next?", "What comes next?  □  ■  □□  ■■  □□□  ?", "■■■", "□□□", "■■", "□□□□"],
  ["What Comes Next?", "What comes next?  ↗  →  ↘  ↓  ?", "↙", "↑", "←", "↖"],
  ["Odd One Out", "Which does NOT belong with the others?", "🐧", "🐬", "🐋", "🦈"],
  ["Odd One Out", "Which does NOT belong with the others?", "🍎", "🟨", "🔺", "⚪"],
  ["Odd One Out", "Which does NOT belong with the others?", "9", "2", "4", "6"],
  ["Odd One Out", "Which does NOT belong with the others?", "🚲", "🌱", "🌳", "🌻"],
  ["Odd One Out", "Which does NOT belong with the others?", "🥕", "🍎", "🍌", "🍓"],
  ["What Comes Next?", "What comes next?  4  8  12  16  ?", "20", "18", "19", "21"],
  ["What Comes Next?", "What comes next?  100  90  80  70  ?", "60", "59", "61", "50"],
  ["What Comes Next?", "What comes next?  7  14  21  28  ?", "35", "34", "36", "42"],
  ["What Comes Next?", "What comes next?  1  3  6  10  15  ?", "21", "20", "22", "25"],
  ["What Comes Next?", "What comes next?  50  45  40  35  ?", "30", "29", "31", "25"],
  ["What Comes Next?", "What comes next?  🟣  🟣  🟡  🟣  🟣  🟡  ?", "🟣", "🟡", "🔵", "🟢"],
  ["What Comes Next?", "What comes next?  △  ○  □  △  ○  ?", "□", "△", "○", "☆"],
  ["What Comes Next?", "What comes next?  1  4  9  16  ?", "25", "20", "24", "26"],
  ["What Comes Next?", "What comes next?  32  28  24  20  ?", "16", "15", "17", "18"],
  ["What Comes Next?", "What comes next?  6  11  16  21  ?", "26", "25", "27", "28"],
  ["What Comes Next?", "What comes next?  ⬆️  ➡️  ⬇️  ⬅️  ?", "⬆️", "➡️", "⬇️", "↗️"],
  ["Odd One Out", "Which does NOT belong with the others?", "25", "12", "18", "24"],
  ["Odd One Out", "Which does NOT belong with the others?", "🚗", "🔺", "🔻", "◀"],
  ["Odd One Out", "Which does NOT belong with the others?", "🐠", "🐝", "🦋", "🐞"],
  ["Odd One Out", "Which does NOT belong with the others?", "🎸", "🌧️", "❄️", "☀️"],
];

// Each row contains four display choices. The matching index below is the verified
// correct choice for that row, keeping answer validation independent of choice order.
const LOGIC_ANSWER_INDEXES = [
  ...Array(25).fill(3),
  1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1,
];

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
].map(([category, prompt, ...choices], index) => {
  const challenge = index >= 15 ? LOGIC_CHALLENGES[index - 15] : undefined;
  if (challenge) {
    const [challengeCategory, challengePrompt, challengeAnswer, ...challengeDistractors] = challenge;
    return {
      category: challengeCategory as LogicLevel["category"],
      prompt: challengePrompt,
      answer: challengeAnswer,
      distractors: challengeDistractors,
      difficulty: index < 15 ? "Easy" : index < 35 ? "Medium" : "Tricky",
    };
  }
  const answerIndex = LOGIC_ANSWER_INDEXES[index];
  const answer = choices[answerIndex];
  return {
    category: category as LogicLevel["category"],
    prompt,
    answer,
    distractors: choices.filter((_, choiceIndex) => choiceIndex !== answerIndex),
    difficulty: index < 18 ? "Easy" : index < 35 ? "Medium" : "Tricky",
  };
});

const COLORS = ["coral", "sky", "sun", "mint"];
const MASCOTS = ["🦊", "🐼", "🦁", "🐸", "🐨"];
const INITIAL_PROGRESS: AdventureProgress = {
  math: { levelIndex: 0, unlocked: 1, stars: 0 },
  science: { levelIndex: 0, unlocked: 1, stars: 0 },
  logic: { levelIndex: 0, unlocked: 1, stars: 0 },
};

function mathChoicesFor(level: MathLevel, index: number) {
  const answer = level.a + level.b;
  const pool = [String(answer), String(answer + 2), String(Math.max(1, answer - 3)), String(answer + 5)];
  const shift = index % 4;
  return [...pool.slice(shift), ...pool.slice(0, shift)];
}

function expandedForm(value: number) {
  const tens = Math.floor(value / 10) * 10;
  const ones = value % 10;
  return [tens > 0 ? String(tens) : "", ones > 0 ? String(ones) : ""].filter(Boolean).join(" + ") || "0";
}

function scienceChoicesFor(level: ScienceLevel, index: number) {
  const pool = [level.answer, ...level.distractors];
  const shift = index % 4;
  return [...pool.slice(shift), ...pool.slice(0, shift)];
}

function logicChoicesFor(level: LogicLevel, index: number) {
  if (level.category === "What Comes Next?" && /^\d+$/.test(level.answer)) {
    const answer = Number(level.answer);
    const pool = [String(answer), String(Math.max(0, answer - 1)), String(answer + 1), String(answer + 2)];
    const shift = index % 4;
    return [...pool.slice(shift), ...pool.slice(0, shift)];
  }
  return scienceChoicesFor(level, index);
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [subject, setSubject] = useState<Subject>("math");
  const [progress, setProgress] = useState<AdventureProgress>(INITIAL_PROGRESS);
  const [streak, setStreak] = useState(0);
  const [wrongTries, setWrongTries] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">("playing");
  const [musicOn, setMusicOn] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [mapRange, setMapRange] = useState(0);
  const [expandedHint, setExpandedHint] = useState<number | null>(null);
  const [showScienceHint, setShowScienceHint] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const musicTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const levels = subject === "math" ? MATH_LEVELS : subject === "science" ? SCIENCE_LEVELS : LOGIC_LEVELS;
  const current = progress[subject];
  const level = levels[current.levelIndex];
  const isMath = subject === "math";
  const isLogic = subject === "logic";
  const answer = isMath ? String((level as MathLevel).a + (level as MathLevel).b) : (level as ScienceLevel).answer;
  const choices = useMemo(() => isMath
    ? mathChoicesFor(level as MathLevel, current.levelIndex)
    : isLogic
      ? logicChoicesFor(level as LogicLevel, current.levelIndex)
      : scienceChoicesFor(level as ScienceLevel, current.levelIndex), [isMath, isLogic, level, current.levelIndex]);
  const praise = current.levelIndex % 2 === 0 ? "Wow!" : "Awesome!";
  const totalStars = progress.math.stars + progress.science.stars + progress.logic.stars;
  const mapStart = mapRange * 10;
  const mapLevels = levels.slice(mapStart, mapStart + 10);
  const scienceHint = current.levelIndex < 15 ? EARLY_SCIENCE_HINTS[current.levelIndex] : SCIENCE_HINTS[current.levelIndex - 15] ?? "Read the question again and look for a clue from everyday life.";

  useEffect(() => {
    const saved = localStorage.getItem("learning-adventure-progress");
    const oldMath = localStorage.getItem("math-adventure-progress");
    try {
      if (saved) {
        const data = JSON.parse(saved);
        setProgress({
          math: { levelIndex: Math.min(49, Math.max(0, data.math?.levelIndex || 0)), unlocked: Math.min(50, Math.max(1, data.math?.unlocked || 1)), stars: Math.max(0, data.math?.stars || 0) },
          science: { levelIndex: Math.min(49, Math.max(0, data.science?.levelIndex || 0)), unlocked: Math.min(50, Math.max(1, data.science?.unlocked || 1)), stars: Math.max(0, data.science?.stars || 0) },
          logic: { levelIndex: Math.min(49, Math.max(0, data.logic?.levelIndex || 0)), unlocked: Math.min(50, Math.max(1, data.logic?.unlocked || 1)), stars: Math.max(0, data.logic?.stars || 0) },
        });
      } else if (oldMath) {
        const data = JSON.parse(oldMath);
        setProgress({ ...INITIAL_PROGRESS, math: { levelIndex: 0, unlocked: Math.min(50, Math.max(1, data.unlocked || 1)), stars: Math.max(0, data.stars || 0) } });
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
    const ctx = audio(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain).connect(ctx.destination); osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + duration);
  }

  function startMusic(force = false) {
    if ((!musicOn && !force) || musicTimer.current) return;
    const notes = [261.6, 329.6, 392, 523.3]; let n = 0;
    tone(notes[0], 0.28, "triangle", 0.025);
    musicTimer.current = setInterval(() => tone(notes[n++ % notes.length], 0.3, "triangle", 0.025), 620);
  }

  function toggleMusic() {
    const next = !musicOn; setMusicOn(next);
    if (!next && musicTimer.current) { clearInterval(musicTimer.current); musicTimer.current = null; }
    else if (next && started) setTimeout(() => startMusic(true), 0);
  }

  function resetPuzzle() { setSelected(null); setWrongTries(0); setStatus("playing"); setExpandedHint(null); setShowScienceHint(false); }
  function begin(nextSubject: Subject) { setSubject(nextSubject); setStarted(true); startMusic(); tone(392, 0.15, "sine", 0.08); tone(523.3, 0.25, "sine", 0.08, 0.12); }
  function switchSubject(nextSubject: Subject) { setSubject(nextSubject); setShowMap(false); resetPuzzle(); }
  function speakPraise() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); const message = new SpeechSynthesisUtterance(praise);
    message.rate = 0.9; message.pitch = 1.35; message.volume = 1; window.speechSynthesis.speak(message);
  }

  function pick(value: string, index: number) {
    if (status === "correct") return;
    setSelected(index);
    if (value === answer) {
      setStatus("correct"); const earned = wrongTries === 0 ? 3 : wrongTries === 1 ? 2 : 1;
      setProgress((previous) => ({ ...previous, [subject]: { ...previous[subject], stars: previous[subject].stars + earned, unlocked: Math.max(previous[subject].unlocked, Math.min(50, current.levelIndex + 2)) } }));
      setStreak((value) => value + 1); tone(523.3, 0.18, "sine", 0.1); tone(659.3, 0.18, "sine", 0.1, 0.12); tone(784, 0.32, "sine", 0.1, 0.24); speakPraise();
    } else {
      setStatus("wrong"); setWrongTries((value) => value + 1); setStreak(0); tone(180, 0.18, "sawtooth", 0.045);
      setTimeout(() => { setStatus("playing"); setSelected(null); }, 750);
    }
  }

  function nextLevel() {
    if (current.levelIndex === 49) { setMapRange(4); setShowMap(true); return; }
    setProgress((previous) => ({ ...previous, [subject]: { ...previous[subject], levelIndex: previous[subject].levelIndex + 1 } })); resetPuzzle();
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (!started || showMap || target?.matches("input, textarea, select")) return;
      if (status === "correct" && event.key === "Enter") { event.preventDefault(); nextLevel(); return; }
      const option = Number(event.key);
      if (status === "playing" && Number.isInteger(option) && option >= 1 && option <= 4) {
        event.preventDefault();
        pick(choices[option - 1], option - 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [choices, showMap, started, status]);

  function chooseLevel(index: number) {
    if (index + 1 > current.unlocked) return;
    setProgress((previous) => ({ ...previous, [subject]: { ...previous[subject], levelIndex: index } })); resetPuzzle(); setShowMap(false);
  }

  return (
    <main className={`game-shell ${subject}-theme`}>
      <div className="sky-cycle" aria-hidden="true"><span className="sky-sun">☀️</span><span className="sky-moon">🌙</span><span className="sky-rainbow">🌈</span><span className="sky-rain">│ │ │ │ │</span><span className="sky-snow">❄ ❄ ❄ ❄</span><span className="sky-stars">✦ · ✧ · ★ · ✦</span></div>
      <div className="cloud cloud-one" aria-hidden="true">☁</div><div className="cloud cloud-two" aria-hidden="true">☁</div><div className="sparkles" aria-hidden="true">✦　·　✦　·　✦</div>
      <nav className="level-nav" aria-label="Level groups">{Array.from({ length: 5 }, (_, range) => { const start = range * 10 + 1; const end = start + 9; const unlockedInRange = Math.max(0, Math.min(10, current.unlocked - range * 10)); return <button key={range} className={range === Math.floor(current.levelIndex / 10) ? "active" : ""} onClick={() => { setMapRange(range); setShowMap(true); }}><strong>{start}–{end}</strong><small>{unlockedInRange}/10</small></button>; })}</nav>
      <header className="topbar">
        <button className="brand" onClick={() => { setMapRange(Math.floor(current.levelIndex / 10)); setShowMap(true); }} aria-label="Open level map"><img className="brand-logo" src="/images/connector-game-logo-stem.png" alt="Connector" /><span>Learning Adventure</span></button>
        <div className="subject-switch" aria-label="Choose a learning game"><button className={isMath ? "active" : ""} onClick={() => switchSubject("math")}>➕ Maths</button><button className={subject === "science" ? "active" : ""} onClick={() => switchSubject("science")}>🔬 Science</button><button className={isLogic ? "active" : ""} onClick={() => switchSubject("logic")}>🧩 Logic</button></div>
        <div className="stats"><div className="stat"><span>⭐</span><strong>{totalStars}</strong></div><div className="stat"><span>🔥</span><strong>{streak}</strong></div><button className="sound-button" onClick={toggleMusic} aria-label={musicOn ? "Turn music off" : "Turn music on"}>{musicOn ? "🔊" : "🔇"}</button></div>
      </header>
      <section className="level-strip" aria-label="Level progress"><div className="level-copy"><span className={`difficulty ${level.difficulty.toLowerCase()}`}>{level.difficulty}</span><h1>{isMath ? "Maths" : isLogic ? "Logic" : "Science"} · Level {current.levelIndex + 1}</h1></div><div className="progress-track"><span style={{ width: `${((current.levelIndex + 1) / 50) * 100}%` }} /></div><span className="progress-count">{current.levelIndex + 1} / 50</span></section>
      <section className={`play-card ${status} ${isMath ? "math-card" : isLogic ? "logic-card" : "science-card"}`} aria-live="polite">
        <div className="mascot" aria-hidden="true">{MASCOTS[Math.floor(current.levelIndex / 10)]}</div>
        <p className="instruction">{isMath ? "Tap a number to see its tens and ones, then connect the sum!" : isLogic ? (level as LogicLevel).category === "Odd One Out" ? "Find the one that is different!" : "Choose what comes next!" : "Think like a scientist and choose the best answer!"}</p>
        {isMath ? <><div className="equation-bubble"><button className="number-hint" onClick={() => setExpandedHint((level as MathLevel).a)} aria-label={`Show expanded form for ${(level as MathLevel).a}`}>{(level as MathLevel).a}</button><b>+</b><button className="number-hint" onClick={() => setExpandedHint((level as MathLevel).b)} aria-label={`Show expanded form for ${(level as MathLevel).b}`}>{(level as MathLevel).b}</button><b>=</b><span className="question-mark">?</span></div>{expandedHint !== null && <button className="expanded-form" onClick={() => setExpandedHint(null)} aria-label="Hide expanded form">{expandedHint} = {expandedForm(expandedHint)} <small>tap to hide</small></button>}</> : <div className={`equation-bubble ${isLogic ? "logic-prompt" : "science-prompt"}`}><span>{(level as ScienceLevel).prompt}</span></div>}
        {!isMath && !isLogic && <div className="science-hint"><button onClick={() => setShowScienceHint((visible) => !visible)} aria-expanded={showScienceHint}>💡 {showScienceHint ? "Hide clue" : "Need a clue?"}</button>{showScienceHint && <p>{scienceHint}</p>}</div>}
        <div className="connection-zone"><svg className="connection-lines" viewBox="0 0 1000 220" preserveAspectRatio="none">{selected !== null && <path className={status === "correct" ? "right-line" : status === "wrong" ? "wrong-line" : ""} d={`M 500 0 C 500 100, ${125 + selected * 250} 90, ${125 + selected * 250} 220`} />}</svg><div className="trail-dot">✦</div><div className="answers">{choices.map((choice, index) => <button key={`${choice}-${index}`} className={`answer ${COLORS[index]} ${selected === index ? "selected" : ""}`} onClick={() => pick(choice, index)} disabled={status === "correct"} aria-label={`${index + 1}. Answer ${choice}`}><kbd aria-hidden="true">{index + 1}</kbd><span>{choice}</span><i aria-hidden="true" /></button>)}</div></div>
        <div className={`feedback ${status}`}>{status === "playing" && <><span>⌨️</span> Press 1, 2, 3, or 4 — or tap an answer</>}{status === "wrong" && <><span>💪</span> Nearly! Try another one.</>}{status === "correct" && <><span className="celebrate">🎉</span><div><strong>{praise}</strong><small>{isMath ? `You found ${answer}!` : isLogic ? `Great thinking — ${answer}!` : `That’s right — ${answer}!`} Press Enter for the next question.</small></div><button onClick={nextLevel}>{current.levelIndex === 49 ? "See my map" : "Next level"} <span>→</span></button></>}</div>
      </section>
      <button className="map-button" onClick={() => { setMapRange(Math.floor(current.levelIndex / 10)); setShowMap(true); }}>🗺️ {isMath ? "Maths" : isLogic ? "Logic" : "Science"} map</button>
      {!started && <div className="overlay"><div className="welcome-card"><div className="welcome-confetti" aria-hidden="true"><span>★</span><span>●</span><span>✦</span><span>▲</span><span>★</span></div><img className="welcome-logo" src="/images/connector-game-logo-stem.png" alt="Connector maths and science game" /><p className="eyebrow">A special adventure for</p><h2 className="child-greeting" aria-label="Hi Hridhaan!"><small>Hi</small>{[..."Hridhaan!"].map((letter, index) => <span key={index}>{letter}</span>)}</h2><h3>What would you like to play?</h3><p>Choose a game, earn stars and unlock every level.</p><div className="welcome-choices"><button onClick={() => begin("math")}>➕ Maths <span>→</span></button><button className="science-start" onClick={() => begin("science")}>🔬 Science <span>→</span></button><button className="logic-start" onClick={() => begin("logic")}>🧩 Logic <span>→</span></button></div></div></div>}
      {showMap && <div className="overlay map-overlay" role="dialog" aria-modal="true" aria-label="Level map"><div className="map-card"><button className="close" onClick={() => setShowMap(false)} aria-label="Close level map">×</button><p className="eyebrow">Your {isMath ? "maths" : isLogic ? "logic" : "science"} adventure</p><h2>Levels {mapStart + 1}–{mapStart + 10}</h2><p>{current.unlocked === 50 ? "Every level is unlocked — superstar!" : `${current.unlocked} of 50 levels unlocked`}</p><div className="map-ranges">{Array.from({ length: 5 }, (_, range) => <button key={range} className={range === mapRange ? "active" : ""} onClick={() => setMapRange(range)}>{range * 10 + 1}–{range * 10 + 10}</button>)}</div><div className="level-grid">{mapLevels.map((_, offset) => { const index = mapStart + offset; const isUnlocked = index + 1 <= current.unlocked; return <button key={index} disabled={!isUnlocked} onClick={() => chooseLevel(index)} className={`${isUnlocked ? "unlocked" : "locked"} ${index === current.levelIndex ? "current" : ""}`} aria-label={`Level ${index + 1}${isUnlocked ? "" : ", locked"}`}>{isUnlocked ? index + 1 : "🔒"}</button>; })}</div></div></div>}
    </main>
  );
}
