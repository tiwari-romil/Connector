// Shared read-aloud helper. Picks the most natural-sounding English voice on the device,
// preferring Indian English, and keeps the delivery calm and warm rather than squeaky.
/** Narration sits below full volume so it does not drown out the game's tones. */
export const SPEECH_VOLUME = 0.6;

/** Highest pitch we ask for: pushing synthetic voices higher makes them sound squeaky and robotic. */
const MAX_PITCH = 1.12;

type VoiceInfo = Pick<SpeechSynthesisVoice, "name" | "lang" | "localService">;

/**
 * How pleasant a voice is likely to sound; higher is better, below zero means "not English".
 * Neural voices (Edge "Natural", Google, Apple "Enhanced"/"Premium") beat the older robotic ones,
 * and an accent match only breaks ties between voices of the same quality.
 */
export function voiceScore(v: VoiceInfo): number {
  const lang = v.lang.replace("_", "-");
  if (!/^en(-|$)/i.test(lang)) return -1;
  let score = lang === "en-IN" ? 3 : lang.startsWith("en-GB") ? 2 : 1;
  if (/natural|neural/i.test(v.name)) score += 12;
  else if (/premium|enhanced/i.test(v.name)) score += 10;
  else if (/google/i.test(v.name)) score += 7;
  else if (/samantha|karen|moira|tessa|serena|daniel|veena|rishi/i.test(v.name)) score += 5;
  if (/female|neerja|sonia|libby|aria|jenny|ava|emma|samantha|karen|moira|tessa|serena|veena/i.test(v.name)) score += 2;
  if (!v.localService) score += 1;
  if (/espeak|compact/i.test(v.name)) score -= 8;
  return score;
}

let chosen: SpeechSynthesisVoice | null | undefined;
let listening = false;

function voice(): SpeechSynthesisVoice | null {
  if (!listening) {
    // Some browsers (Edge's natural voices, Chrome's Google voices) arrive late; re-pick when they do.
    listening = true;
    window.speechSynthesis.addEventListener?.("voiceschanged", () => { chosen = undefined; });
  }
  if (chosen) return chosen;
  let best: SpeechSynthesisVoice | null = null;
  for (const v of window.speechSynthesis.getVoices()) if (voiceScore(v) >= 0 && (!best || voiceScore(v) > voiceScore(best))) best = v;
  chosen = best;
  return chosen;
}

/** Happy one-word reactions, said a little brighter than the line that follows. */
export const EXCLAMATIONS = {
  cheer: ["Woohoo!", "Wow!", "Awesome!", "Amazing!", "Yay!", "Hooray!"],
  oops: ["Oops!", "Uh-oh!", "Whoops!"],
} as const;
export type Exclaim = keyof typeof EXCLAMATIONS;

/** A random exclamation of this kind that does not repeat the first word of `text` ("Wow! Wow!"). */
export function pickExclamation(kind: Exclaim, text: string, random = Math.random): string {
  const opening = text.trim().split(/\s+/)[0]?.replace(/[^a-z-]/gi, "").toLowerCase() ?? "";
  const options = EXCLAMATIONS[kind].filter((word) => word.replace(/[^a-z-]/gi, "").toLowerCase() !== opening);
  return options[Math.floor(random() * options.length)];
}

function utter(text: string, rate: number, pitch: number) {
  const utterance = new SpeechSynthesisUtterance(text);
  const v = voice();
  if (v) { utterance.voice = v; utterance.lang = v.lang; }
  utterance.rate = rate; utterance.pitch = Math.min(pitch, MAX_PITCH); utterance.volume = SPEECH_VOLUME;
  return utterance;
}

export function speak(text: string, options: { rate?: number; pitch?: number; exclaim?: Exclaim; onEnd?: () => void } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { options.onEnd?.(); return; }
  window.speechSynthesis.cancel();
  // Emoji are read out literally by some voices ("red apple emoji") — strip them.
  const clean = text.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();
  if (!clean) { options.onEnd?.(); return; }
  // The exclamation is its own utterance so it can sound a little brighter than the sentence after it.
  if (options.exclaim) {
    const cheer = options.exclaim === "cheer";
    window.speechSynthesis.speak(utter(pickExclamation(options.exclaim, clean), cheer ? 1 : 0.92, cheer ? MAX_PITCH : 1.02));
  }
  const utterance = utter(clean, options.rate ?? 0.92, options.pitch ?? 1.05);
  if (options.onEnd) { utterance.onend = options.onEnd; utterance.onerror = options.onEnd; }
  window.speechSynthesis.speak(utterance);
}

/**
 * iPhones and iPads only allow speech that starts from a tap. Speaking a silent space during the
 * first tap unlocks the voice for the rest of the visit, so later prompts can be read aloud.
 */
export function unlockSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const silent = new SpeechSynthesisUtterance(" ");
  silent.volume = 0;
  window.speechSynthesis.speak(silent);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
