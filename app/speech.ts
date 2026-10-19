// Shared read-aloud helper. Prefers an Indian-English voice, then any English voice.
let chosen: SpeechSynthesisVoice | null | undefined;

function voice(): SpeechSynthesisVoice | null {
  if (chosen !== undefined && chosen !== null) return chosen;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  chosen = voices.find((v) => v.lang === "en-IN") ?? voices.find((v) => v.lang.startsWith("en-GB")) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
  return chosen;
}

export function speak(text: string, options: { rate?: number; pitch?: number; onEnd?: () => void } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { options.onEnd?.(); return; }
  window.speechSynthesis.cancel();
  // Emoji are read out literally by some voices ("red apple emoji") — strip them.
  const clean = text.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();
  if (!clean) { options.onEnd?.(); return; }
  const utterance = new SpeechSynthesisUtterance(clean);
  const v = voice();
  if (v) { utterance.voice = v; utterance.lang = v.lang; }
  utterance.rate = options.rate ?? 0.88;
  utterance.pitch = options.pitch ?? 1.15;
  if (options.onEnd) { utterance.onend = options.onEnd; utterance.onerror = options.onEnd; }
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
