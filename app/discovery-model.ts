export type MissionSubject = "math" | "science";
export type MissionId = "build" | "subtract" | "groups" | "magnets" | "water" | "shadows";
export type Challenge = 0 | 1 | 2;
export const CHALLENGES = ["Explore", "Stretch", "Challenge"] as const;
export const MISSIONS: { id: MissionId; subject: MissionSubject; icon: string; title: string; skill: string }[] = [
  { id: "build", subject: "math", icon: "🧱", title: "Number builders", skill: "Addition & place value" },
  { id: "subtract", subject: "math", icon: "➖", title: "Take-away trail", skill: "Subtraction & regrouping" },
  { id: "groups", subject: "math", icon: "🔢", title: "Equal-group explorer", skill: "Repeated addition" },
  { id: "magnets", subject: "science", icon: "🧲", title: "Magnet detective", skill: "Materials & evidence" },
  { id: "water", subject: "science", icon: "🧊", title: "Changing water", skill: "Solids, liquids & gases" },
  { id: "shadows", subject: "science", icon: "🔦", title: "Shadow investigator", skill: "Light & shadows" },
];

export function mathMission(id: MissionId, challenge: Challenge, round: number) {
  const seed = round % 4;
  const a = id === "groups" ? 2 + challenge + (seed % 2) : [12, 27, 46][challenge] + seed * 2;
  const b = id === "groups" ? 3 + challenge + (seed % 2) : [3, 6, 17][challenge] + (seed % 2);
  const target = id === "subtract" ? a - b : id === "groups" ? a * b : a + b;
  const symbol = id === "subtract" ? "−" : id === "groups" ? "×" : "+";
  const explanation = id === "subtract"
    ? `${a} − ${b} = ${target}. Check it backwards: ${target} + ${b} = ${a}.`
    : id === "groups" ? `${a} equal groups of ${b} make ${target}. ${Array(a).fill(b).join(" + ")} = ${target}.`
    : `${a} + ${b} = ${target}. That is ${Math.floor(target / 10)} tens and ${target % 10} ones. Every 10 ones can be exchanged for 1 ten.`;
  return { a, b, target, symbol, explanation };
}

export type Experiment = {
  prompt: string; options: string[]; answer: number; observation: string;
  why: string; reasons: string[]; reason: number; clue: string; followup: string;
};
const EXPERIMENTS: Record<"magnets" | "water" | "shadows", Experiment[]> = {
  magnets: [
    { prompt: "A magnet moves close to an iron nail. What happens?", options: ["The nail is attracted", "The nail melts", "Nothing happens"], answer: 0, observation: "The iron nail moves towards the magnet.", why: "Why did the nail move?", reasons: ["Magnets attract everything", "Iron is a magnetic material", "The nail is shiny"], reason: 1, clue: "Think about what the nail is made of, rather than its colour or size.", followup: "Tell someone why a wooden pencil would behave differently." },
    { prompt: "Test an iron nail, a wooden block and an aluminium can. Which is attracted?", options: ["All three", "Only the iron nail", "Only the can"], answer: 1, observation: "The iron nail is attracted. The wood and aluminium are not attracted in this test.", why: "What does this evidence tell us?", reasons: ["All metals are magnetic", "Only heavy objects are magnetic", "Some metals are magnetic, but not all"], reason: 2, clue: "Iron and aluminium are both metals, but their results are different.", followup: "Predict what an iron paper clip would do. What material would you test next?" },
    { prompt: "Two bar magnets face each other with their north poles. Predict what happens.", options: ["They pull together", "They push apart", "They turn into one magnet"], answer: 1, observation: "The two north poles repel: they push apart.", why: "What rule explains this?", reasons: ["Matching poles repel; opposite poles attract", "Every pair of magnets attracts", "Magnets only work on nails"], reason: 0, clue: "Compare matching poles with opposite poles.", followup: "Turn one magnet around in your imagination. Predict what north and south would do." },
  ],
  water: [
    { prompt: "An ice cube is left in a warm room. What will it become?", options: ["A stone", "Liquid water", "More ice"], answer: 1, observation: "The ice takes in heat and melts into liquid water.", why: "What caused the change?", reasons: ["The ice absorbed heat", "The ice stopped being water", "The room removed all heat"], reason: 0, clue: "Ice is solid water. Think about heat moving from the warmer room to the ice.", followup: "With an adult, watch an ice cube in a bowl. Draw it before and after melting." },
    { prompt: "Liquid water is cooled below its freezing point long enough. What happens?", options: ["It becomes sand", "It disappears", "It freezes into ice"], answer: 2, observation: "As water loses heat, it can freeze into solid ice.", why: "How is this different from melting?", reasons: ["Freezing adds heat", "Freezing removes heat; melting adds heat", "Freezing changes water into a new material"], reason: 1, clue: "To melt ice we add heat. Think about reversing that change.", followup: "Explain how you could change this ice back into liquid water." },
    { prompt: "Drops form outside a cold bottle in a warm room. Where did the water come from?", options: ["Water vapour in the air", "The sealed bottle leaked", "The glass became water"], answer: 0, observation: "Water vapour in the air cools at the bottle and condenses into liquid drops.", why: "Which change is condensation?", reasons: ["Solid becoming liquid", "Liquid becoming gas", "Gas becoming liquid"], reason: 2, clue: "Before: invisible water vapour in the air. After: liquid drops.", followup: "Look at a cold sealed bottle with an adult. Can you find drops on its outside?" },
  ],
  shadows: [
    { prompt: "A torch shines at an opaque card in front of a screen. What appears on the screen?", options: ["A shadow", "A sound", "A second torch"], answer: 0, observation: "The card blocks the light, making a dark shadow on the screen.", why: "Why is the shadow darker?", reasons: ["The card makes black light", "The card blocks light from reaching that area", "The screen loses its colour"], reason: 1, clue: "Opaque means light cannot pass through. Follow the path from torch to screen.", followup: "Use a torch and your hand with an adult. What happens when you spread your fingers?" },
    { prompt: "Keep the torch and screen still. Move the card closer to the torch. What happens to its shadow?", options: ["It gets smaller", "It stays the same", "It gets larger"], answer: 2, observation: "Closer to the torch, the card blocks a wider part of the spreading light. Its shadow grows.", why: "How can we make this a fair comparison?", reasons: ["Change the torch, screen and card together", "Only change the card’s position", "Use a different torch each time"], reason: 1, clue: "To test one idea, change one thing and keep the others the same.", followup: "Predict the shadow size when the card moves closer to the screen instead." },
    { prompt: "Replace the opaque card with clear glass in the same setup. What would you expect?", options: ["A much darker shadow", "No light anywhere", "More light reaches the screen"], answer: 2, observation: "Clear glass lets most light through. It makes a much fainter shadow than the opaque card.", why: "What is the useful difference?", reasons: ["Glass is transparent; the card is opaque", "Every solid blocks all light", "The torch changed colour"], reason: 0, clue: "Transparent materials allow most light through. Opaque materials block it.", followup: "Name a transparent object and an opaque object in your room. Explain your choices." },
  ],
};
export function experimentFor(id: "magnets" | "water" | "shadows", challenge: Challenge) {
  return EXPERIMENTS[id][challenge];
}

export type DiscoverySave = { best: Record<string, number>; completed: number };
export function readDiscoverySave(raw: string | null): DiscoverySave {
  const result: DiscoverySave = { best: {}, completed: 0 };
  try {
    const data = JSON.parse(raw ?? "null");
    if (!data || typeof data !== "object") return result;
    for (const mission of MISSIONS) for (let tier = 0; tier < 3; tier++) {
      const key = `${mission.id}-${tier}`;
      const value = data.best?.[key];
      if (Number.isInteger(value) && value >= 1 && value <= 3) result.best[key] = value;
    }
    result.completed = Object.keys(result.best).length;
  } catch { /* A damaged or unavailable save should never stop play. */ }
  return result;
}
