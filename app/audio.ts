// Shared Web Audio helpers: soft, warm sound effects and a gentle music loop, all synthesised,
// so the game ships no sound files. Every note is a rounded triangle/sine "music box" tone with a
// soft attack, played through a warm low-pass filter and a light echo — no buzzy square waves.
let context: AudioContext | null = null;
let output: AudioNode | null = null;

/** Master boost for every effect: callers pass relative levels, this lifts them to an audible level. */
const TONE_GAIN = 2.5;
/** Ceiling per tone, so overlapping notes in a chord or fanfare do not clip. */
const MAX_TONE_VOLUME = 0.3;
/** Background music level, kept under the effects and the narration. */
const MUSIC_VOLUME = 0.5;

/** Builds the shared warm output: low-pass filter to round off the highs, plus a soft echo for space. */
function warmOutput(c: AudioContext): AudioNode {
  const input = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = 2600; filter.Q.value = 0.4;
  const echo = c.createDelay(1); echo.delayTime.value = 0.19;
  const feedback = c.createGain(); feedback.gain.value = 0.22;
  const wet = c.createGain(); wet.gain.value = 0.18;
  input.connect(filter);
  filter.connect(c.destination);
  filter.connect(echo); echo.connect(feedback).connect(echo); echo.connect(wet).connect(c.destination);
  return input;
}

function audio(): { c: AudioContext; out: AudioNode } | null {
  try {
    if (!context) { context = new AudioContext(); output = warmOutput(context); }
    if (context.state === "suspended") void context.resume();
    return { c: context, out: output! };
  } catch { return null; }
}

type Voice = {
  frequency: number; duration: number; type?: OscillatorType; volume?: number; delay?: number;
  /** Glide to this pitch over the note, for a soft "bloop". */
  slideTo?: number;
  /** Add a quiet octave-up shimmer, like a music box or marimba. Defaults to on. */
  shimmer?: boolean;
};

function voice(c: AudioContext, destination: AudioNode, v: Voice, at = c.currentTime) {
  const start = at + (v.delay ?? 0);
  const end = start + v.duration;
  const peak = Math.min((v.volume ?? 0.08) * TONE_GAIN, MAX_TONE_VOLUME);
  const partials: [number, number][] = v.shimmer === false ? [[1, 1]] : [[1, 1], [2, 0.22]];
  for (const [ratio, share] of partials) {
    const osc = c.createOscillator(); const gain = c.createGain();
    osc.type = ratio === 1 ? v.type ?? "triangle" : "sine";
    osc.frequency.setValueAtTime(v.frequency * ratio, start);
    if (v.slideTo) osc.frequency.exponentialRampToValueAtTime(v.slideTo * ratio, end);
    // A short fade-in avoids clicks; the shimmer dies away faster than the body, like a struck bell.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak * share, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, ratio === 1 ? end : start + Math.min(v.duration, 0.25));
    osc.connect(gain).connect(destination);
    osc.start(start); osc.stop(end + 0.03);
  }
}

/** When the last game sound played, so a tap that already made its own sound skips the select blip. */
let lastCueAt = -Infinity;

function cue(...voices: Voice[]) {
  try {
    const a = audio(); if (!a) return;
    lastCueAt = performance.now();
    for (const v of voices) voice(a.c, a.out, v);
  } catch { /* audio unavailable */ }
}

/** Phones keep sound switched off until the page is tapped; call this during the first tap. */
export function unlockAudio() { audio(); }

export function playTone(frequency: number, duration: number, type: OscillatorType = "triangle", volume = 0.08, delay = 0) {
  cue({ frequency, duration, type, volume, delay });
}

// ---------- notes ----------
const NOTE_OFFSET: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

/** "C5" → 523.25 Hz. Sharps are written "F#4". */
export function noteFrequency(name: string): number {
  const match = /^([A-G])(#?)(\d)$/.exec(name);
  if (!match) throw new Error(`Not a note: ${name}`);
  const semitones = NOTE_OFFSET[match[1]] + (match[2] ? 1 : 0) + (Number(match[3]) - 4) * 12;
  return 440 * 2 ** (semitones / 12);
}
const n = noteFrequency;

// ---------- sound effects ----------

/** Soft "pop" for tapping any button. Skipped when the tap already played its own sound. */
export function playSelect() {
  if (performance.now() - lastCueAt < 120) return;
  cue({ frequency: n("A5"), slideTo: n("D6"), duration: 0.08, type: "sine", volume: 0.05, shimmer: false });
}

/** Two warm rising notes: "let's go". */
export function playStart() {
  cue({ frequency: n("G4"), duration: 0.22, volume: 0.08 },
    { frequency: n("C5"), duration: 0.4, volume: 0.08, delay: 0.14 });
}

/** Rising music-box sparkle for a right answer. */
export function playCorrect() {
  cue({ frequency: n("E5"), duration: 0.25, volume: 0.07 },
    { frequency: n("G5"), duration: 0.25, volume: 0.07, delay: 0.09 },
    { frequency: n("C6"), duration: 0.55, volume: 0.07, delay: 0.18 });
}

/** Two soft, falling low notes for a wrong answer — a kind "hmm-mm", never a buzzer. */
export function playWrong() {
  cue({ frequency: n("E4"), duration: 0.22, type: "sine", volume: 0.09, shimmer: false },
    { frequency: n("C4"), slideTo: n("A3"), duration: 0.4, type: "sine", volume: 0.09, delay: 0.18, shimmer: false });
}

/** One step of progress (a digit in a sequence, a column, a maze move); climbs gently with `index`. */
export function playStep(index = 0) {
  const scale = ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6"];
  cue({ frequency: n(scale[Math.min(index, scale.length - 1)]), duration: 0.2, volume: 0.06 });
}

/** Soft upward glide and chime, for carrying the 1. */
export function playPowerUp() {
  cue({ frequency: n("C5"), slideTo: n("C6"), duration: 0.22, type: "sine", volume: 0.06, shimmer: false },
    { frequency: n("E6"), duration: 0.45, volume: 0.06, delay: 0.2 });
}

/** Bright little jingle for a solved question. */
export function playCheer() {
  const arp = ["C5", "E5", "G5", "C6"].map((note, i): Voice => ({ frequency: n(note), duration: 0.3, volume: 0.06, delay: i * 0.08 }));
  cue(...arp,
    { frequency: n("E6"), duration: 0.6, volume: 0.05, delay: 0.34 },
    { frequency: n("C4"), duration: 0.7, type: "sine", volume: 0.09, delay: 0.34, shimmer: false });
}

/** Happy fanfare for finishing a whole game. */
export function playFanfare() {
  const melody: [string, number, number][] = [["C5", 0, 0.25], ["E5", 0.13, 0.25], ["G5", 0.26, 0.25], ["C6", 0.39, 0.4], ["A5", 0.7, 0.22], ["B5", 0.83, 0.22], ["C6", 0.96, 0.9]];
  const bass: [string, number, number][] = [["C3", 0, 0.4], ["G3", 0.39, 0.35], ["F3", 0.7, 0.3], ["C3", 0.96, 0.9]];
  cue(...melody.map(([note, delay, duration]): Voice => ({ frequency: n(note), duration, delay, volume: 0.065 })),
    ...bass.map(([note, delay, duration]): Voice => ({ frequency: n(note), duration, delay, type: "sine", volume: 0.1, shimmer: false })));
}

// ---------- background music ----------
/** Seconds per eighth-note step (a relaxed 100 bpm). */
const STEP = 0.3;
/** Melody, one eighth note per entry; "-" holds the note before it. Eight bars, A then B. */
export const MUSIC_LEAD = (
  "C5 E5 G5 E5 A5 G5 E5 -  F5 A5 G5 E5 D5 E5 C5 -  C5 E5 G5 C6 B5 G5 A5 -  G5 F5 E5 D5 C5 - G4 - " +
  "A5 - G5 E5 F5 - E5 C5  D5 E5 F5 A5 G5 - - -  E5 G5 C6 G5 F5 A5 C6 A5  G5 B5 D6 B5 C6 - - -"
).trim().split(/\s+/);
/** Bass line, one quarter note (two steps) per entry. */
export const MUSIC_BASS = (
  "C3 G3 A2 E3  F2 C3 C3 G3  C3 G3 A2 E3  G2 D3 C3 G2 " +
  "A2 E3 F2 C3  D3 A2 G2 D3  C3 G3 F2 C3  G2 D3 C3 G2"
).trim().split(/\s+/);

let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicBus: GainNode | null = null;
let musicStep = 0;
let nextStepAt = 0;

function playMusicStep(c: AudioContext, bus: AudioNode, step: number, at: number) {
  const lead = MUSIC_LEAD[step];
  if (lead !== "-") {
    let length = 1;
    while (MUSIC_LEAD[(step + length) % MUSIC_LEAD.length] === "-") length++;
    voice(c, bus, { frequency: n(lead), duration: length * STEP * 0.95 + 0.15, volume: 0.035 }, at);
  }
  if (step % 2 === 0) voice(c, bus, { frequency: n(MUSIC_BASS[step / 2]), duration: STEP * 1.9, type: "sine", volume: 0.07, shimmer: false }, at);
}

function scheduleMusic(c: AudioContext) {
  if (!musicBus) return;
  // Stay silent in a background tab, and pick up cleanly when the child comes back.
  if (typeof document !== "undefined" && document.hidden) { nextStepAt = c.currentTime + 0.1; return; }
  if (nextStepAt < c.currentTime) nextStepAt = c.currentTime + 0.05;
  while (nextStepAt < c.currentTime + 0.2) {
    playMusicStep(c, musicBus, musicStep, nextStepAt);
    musicStep = (musicStep + 1) % MUSIC_LEAD.length;
    nextStepAt += STEP;
  }
}

/** Starts the looping background tune. Safe to call again while it is already playing. */
export function startMusic() {
  try {
    const a = audio(); if (!a || musicTimer) return;
    const { c, out } = a;
    musicBus = c.createGain(); musicBus.gain.value = MUSIC_VOLUME; musicBus.connect(out);
    musicStep = 0; nextStepAt = c.currentTime + 0.1;
    scheduleMusic(c);
    musicTimer = setInterval(() => scheduleMusic(c), 50);
  } catch { /* audio unavailable */ }
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  if (musicBus && context) {
    const bus = musicBus;
    bus.gain.setTargetAtTime(0, context.currentTime, 0.08);
    setTimeout(() => bus.disconnect(), 600);
  }
  musicBus = null;
}
