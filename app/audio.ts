// Shared Web Audio helpers: short synthesised tones, so the game ships no sound files.
let context: AudioContext | null = null;

export function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.08, delay = 0) {
  try {
    if (!context) context = new AudioContext();
    if (context.state === "suspended") context.resume();
    const osc = context.createOscillator(); const gain = context.createGain();
    osc.type = type; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, context.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + duration);
    osc.connect(gain).connect(context.destination);
    osc.start(context.currentTime + delay); osc.stop(context.currentTime + delay + duration);
  } catch { /* audio unavailable */ }
}

/** Rising three-note "well done". */
export function playCheer() {
  playTone(523.3, 0.18, "sine", 0.1); playTone(659.3, 0.18, "sine", 0.1, 0.12); playTone(784, 0.32, "sine", 0.1, 0.24);
}

/** Two-note "let's go". */
export function playStart() {
  playTone(392, 0.15); playTone(523.3, 0.25, "sine", 0.08, 0.12);
}
