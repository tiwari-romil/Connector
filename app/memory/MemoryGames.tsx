"use client";

import { useEffect, useRef, useState } from "react";
import { playCheer, playFanfare, playStart, playStep, playTone, playWrong } from "../audio";
import HoldToOpen from "../HoldToOpen";
import { GAME_LENGTH, MAX_LEVEL, starsFor } from "../puzzles/model";
import SkillReward, { LevelDots, RankBadge, RankProgress } from "../SkillReward";
import { speak, stopSpeaking, type Exclaim } from "../speech";
import { rankFor, recordTrack, type Rank } from "../tracks";
import {
  BAND, BAND_RANKS, NUMBER_HOLD_MS, NUMBER_RANKS, bandSetup, bandTune, numberRound, numberSetup, readMemorySave, recordSpan,
  type BandSetup, type MemoryGame, type MemorySave, type NumberSetup,
} from "./model";

const SAVE_KEY = "memory-games-v1";
const GAMES: Record<MemoryGame, { icon: string; title: string; blurb: string; ranks: readonly Rank[]; praise: string[] }> = {
  band: { icon: "🎵", title: "Echo the Band", blurb: "Listen to the animals, then play their tune back", ranks: BAND_RANKS, praise: ["You played it perfectly!", "What a great musician!", "The band loves it!", "You remembered every note!"] },
  numbers: { icon: "🔢", title: "Hold the Numbers", blurb: "Remember the numbers, then tap them back", ranks: NUMBER_RANKS, praise: ["Super memory!", "You kept them all in your head!", "Brilliant remembering!", "Number champion!"] },
};

type Round = { level: number } & ({ kind: "band"; setup: BandSetup; tune: number[] } | { kind: "numbers"; setup: NumberSetup; shown: number[]; answer: number[] });
type Game = { kind: MemoryGame; index: number; stars: number[]; bonus: number; starsBefore: number; round: Round };
type Result = { misses: number; praise: string; levelUp: boolean };

function makeRound(kind: MemoryGame, level: number, bonus: number): Round {
  const seed = Math.floor(Math.random() * 2 ** 31);
  if (kind === "band") { const setup = bandSetup(level, bonus); return { level, kind, setup, tune: bandTune(setup, seed) }; }
  const setup = numberSetup(level);
  return { level, kind, setup, ...numberRound(setup, seed) };
}

/** Timers that are all cancelled together (on replay or when the round closes). */
function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  return { later, clear };
}

export default function MemoryGames({ soundOn }: { soundOn: boolean }) {
  const [save, setSave] = useState<MemorySave>(() => readMemorySave(null));
  const [screen, setScreen] = useState<"hub" | "play" | "reward">("hub");
  const [game, setGame] = useState<Game | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [gamesThisVisit, setGamesThisVisit] = useState(0);
  // Keys each round, so a new round always starts fresh.
  const [gamesStarted, setGamesStarted] = useState(0);
  const [grownUp, setGrownUp] = useState(false);

  useEffect(() => {
    // Read browser progress after hydration so server and client first render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setSave(readMemorySave(localStorage.getItem(SAVE_KEY))); } catch { /* storage blocked */ }
    return () => stopSpeaking();
  }, []);

  function persist(next: MemorySave) {
    setSave(next);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
  }
  function start(kind: MemoryGame) {
    stopSpeaking();
    if (soundOn) { playStart(); }
    setResult(null);
    setGamesStarted((n) => n + 1);
    setGame({ kind, index: 0, stars: [], bonus: 0, starsBefore: save[kind].stars, round: makeRound(kind, save[kind].level, 0) });
    setScreen("play");
  }

  function roundDone(misses: number) {
    if (!game || result) return;
    const { kind, round } = game;
    const track = recordTrack(save[kind], misses);
    const length = round.kind === "band" ? round.tune.length : round.shown.length;
    persist(recordSpan({ ...save, [kind]: track }, kind, length, round.kind === "numbers" && round.setup.backwards, misses));
    const praise = misses >= 2 ? "You did it together! Well done!" : GAMES[kind].praise[Math.floor(Math.random() * GAMES[kind].praise.length)];
    const levelUp = track.level > save[kind].level;
    setResult({ misses, praise, levelUp });
    if (soundOn) { playCheer(); speak(levelUp ? `${praise} Level up!` : praise, { pitch: 1.3, exclaim: "cheer" }); }
    // In the band, a first-try win makes the next tune one note longer (up to two extra).
    setGame({ ...game, stars: [...game.stars, starsFor(misses)], bonus: kind === "band" && misses === 0 ? game.bonus + 1 : 0 });
  }

  function next() {
    if (!game) return;
    if (game.index + 1 < GAME_LENGTH) {
      setResult(null);
      setGame({ ...game, index: game.index + 1, round: makeRound(game.kind, save[game.kind].level, game.bonus) });
      return;
    }
    setGamesThisVisit((n) => n + 1);
    setScreen("reward");
    const ladder = GAMES[game.kind].ranks;
    const after = rankFor(ladder, save[game.kind].stars);
    if (soundOn) {
      playFanfare();
      speak(after.index > rankFor(ladder, game.starsBefore).index ? `New rank! You are now a ${after.rank.title}!` : "You finished! Great remembering!", { exclaim: "cheer" });
    }
  }

  function toHub() { stopSpeaking(); setScreen("hub"); setGame(null); setResult(null); }

  if (screen === "reward" && game) {
    const info = GAMES[game.kind];
    return <SkillReward title={`${info.icon} ${info.title}`} stars={game.stars} ladder={info.ranks} starsBefore={game.starsBefore} starsAfter={save[game.kind].stars}
      gamesThisVisit={gamesThisVisit} onAgain={() => start(game.kind)} onBack={toHub} backLabel="🧠 Memory games" />;
  }

  if (screen === "play" && game) {
    const info = GAMES[game.kind];
    return <section className={`pz-shell mm-play mm-playing-${game.kind}`}>
      <div className="pz-playbar">
        <button className="pz-icon-button" onClick={toHub} aria-label="Back to the memory games">🧠</button>
        <div className="pz-dots" aria-label={`Round ${game.index + 1} of ${GAME_LENGTH}`}>
          {Array.from({ length: GAME_LENGTH }, (_, i) => <span key={i} className={i < game.index || (i === game.index && result) ? "done" : i === game.index ? "now" : ""} />)}
        </div>
        <RankBadge ladder={info.ranks} stars={save[game.kind].stars} />
      </div>
      <div className="pz-card" key={`${gamesStarted}-${game.index}`}>
        <p className="pz-island">{info.icon} {info.title} · Level {game.round.level}</p>
        {game.round.kind === "band"
          ? <BandRound setup={game.round.setup} tune={game.round.tune} soundOn={soundOn} onDone={roundDone} />
          : <NumbersRound setup={game.round.setup} shown={game.round.shown} answer={game.round.answer} soundOn={soundOn} onDone={roundDone} />}
        {result && <div className="pz-feedback good" role="status">
          <span className="pz-bounce">🎉</span><strong>{result.praise}{result.levelUp && <b className="mm-level-up"> ⬆️ Level up!</b>}</strong>
          <span className="pz-earned">{"⭐".repeat(starsFor(result.misses))}</span>
          <button className="pz-big" onClick={next} autoFocus>{game.index + 1 < GAME_LENGTH ? "Next ➜" : "Finish 🏁"}</button>
        </div>}
      </div>
    </section>;
  }

  const totalStars = save.band.stars + save.numbers.stars;
  return <section className="pz-shell mm-hub">
    <div className="pz-map-head">
      <div><p className="pz-eyebrow">🧠 Memory games</p><h2>What shall we remember today?</h2></div>
      <span className="pz-book-button" aria-label={`${totalStars} memory stars`}>⭐ <b>{totalStars}</b></span>
    </div>
    <div className="mm-games">
      {(Object.keys(GAMES) as MemoryGame[]).map((kind) => {
        const info = GAMES[kind];
        return <button key={kind} className={`mm-game-card mm-card-${kind}`} onClick={() => start(kind)}>
          <span className="mm-game-icon">{info.icon}</span>
          <strong>{info.title}</strong>
          <small>{info.blurb}</small>
          <RankBadge ladder={info.ranks} stars={save[kind].stars} small />
          <RankProgress ladder={info.ranks} stars={save[kind].stars} />
          <LevelDots level={save[kind].level} />
        </button>;
      })}
    </div>
    {!grownUp && <HoldToOpen onOpen={() => setGrownUp(true)} />}
    {grownUp && <details className="pz-grownups" open>
      <summary>For grown-ups</summary>
      <p>Both games adapt like the puzzle islands: three first-try rounds in a row move up a level; two misses in a round move down a level. Ranks are earned with stars (1–3 per round, never taken away), so every game moves towards the next rank even on a hard day; the level is what adapts.</p>
      <table><thead><tr><th>Game</th><th>Level</th><th>Played</th><th>First try</th><th>Longest</th></tr></thead><tbody>
        {(Object.keys(GAMES) as MemoryGame[]).map((kind) => {
          const t = save[kind], info = GAMES[kind];
          const longest = kind === "band" ? (save.bestTune ? `${save.bestTune} notes` : "—") : `${save.bestForward || "—"} fwd · ${save.bestBackward || "—"} back`;
          return <tr key={kind}><td>{info.icon} {info.title}</td><td>{t.level} / {MAX_LEVEL}</td><td>{t.played}</td><td>{t.played ? `${Math.round((t.firstTry / t.played) * 100)}%` : "—"}</td><td>{longest}</td></tr>;
        })}
      </tbody></table>
      <p><b>Echo the Band</b> trains remembering a sequence of sounds and places. Each first-try win in a game makes the next tune one note longer. <b>Hold the Numbers</b> trains working memory, the “keep it in your head” skill that carrying in sums needs. Backwards rounds are a big stretch: most 5–6 year olds manage 2–3 backwards.</p>
      <p>“Longest” counts only rounds finished without the glowing help.</p>
    </details>}
  </section>;
}

// ---------- Echo the Band ----------
function BandRound({ setup, tune, soundOn, onDone }: { setup: BandSetup; tune: number[]; soundOn: boolean; onDone: (misses: number) => void }) {
  const [phase, setPhase] = useState<"listen" | "turn" | "done">("listen");
  const [lit, setLit] = useState<number | null>(null);
  const [played, setPlayed] = useState(0);
  const [step, setStep] = useState(0);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const { later, clear } = useTimers();

  const note = (pad: number, seconds: number) => { if (soundOn) playTone(BAND[pad].frequency, seconds, "triangle", 0.13); };
  // Speak, then continue — with a fallback in case the speech engine never reports the end.
  function sayThen(text: string, then: () => void, exclaim?: Exclaim) {
    clear();
    let done = false;
    const go = () => { if (!done) { done = true; then(); } };
    if (soundOn) speak(text, { exclaim, onEnd: () => later(go, 250) });
    later(go, soundOn ? 4000 : 900);
  }

  function playTune(slow: boolean) {
    clear();
    setPhase("listen"); setStep(0); setPlayed(0); setWrong(null);
    const gap = slow ? Math.round(setup.gapMs * 1.4) : setup.gapMs;
    tune.forEach((pad, i) => {
      later(() => { setLit(pad); setPlayed(i + 1); note(pad, (gap / 1000) * 0.75); }, 300 + i * gap);
      later(() => setLit(null), 300 + i * gap + gap * 0.6);
    });
    later(() => { setPhase("turn"); if (soundOn) speak("Your turn!"); }, 300 + tune.length * gap);
  }

  useEffect(() => {
    sayThen("Listen to the band!", () => playTune(false));
    // Runs once per round; the parent remounts this component for every new tune.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tap(pad: number) {
    if (phase !== "turn") return;
    setLit(pad); later(() => setLit(null), 260);
    if (pad === tune[step]) {
      note(pad, 0.35);
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep === tune.length) { setPhase("done"); later(() => onDone(misses), 450); }
      return;
    }
    // A wrong pad shakes instead of lighting up, so it can't be mistaken for part of the tune.
    const count = misses + 1;
    setLit(null); setMisses(count); setWrong(pad); setPhase("listen");
    if (soundOn) playWrong();
    if (count === 1) sayThen("Nearly! Listen again.", () => playTune(false), "oops");
    else sayThen("Let's play it together. Follow the glowing animal!", () => playTune(true));
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { const n = Number(event.key); if (n >= 1 && n <= setup.pads) tap(n - 1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const help = misses >= 2 && phase === "turn";
  return <>
    <h2 className={`pz-prompt mm-say ${phase === "turn" ? "go" : ""}`}>{phase === "listen" ? "Listen to the band… 👂" : phase === "turn" ? "Your turn! Play it back 🎶" : "Bravo! 👏"}</h2>
    <div className={`mm-band n${setup.pads} ${phase === "listen" ? "listening" : ""}`}>
      {BAND.slice(0, setup.pads).map((animal, pad) => <button key={animal.name}
        className={`mm-pad ${animal.color} ${lit === pad ? "lit" : ""} ${help && tune[step] === pad ? "hint" : ""} ${wrong === pad && phase === "listen" ? "wrong" : ""}`}
        onClick={() => tap(pad)} disabled={phase !== "turn"} aria-label={`${animal.name}, ${animal.note}`}>
        <span>{animal.animal}</span><small>{animal.note}</small>
      </button>)}
    </div>
    <div className="mm-notes" aria-label={phase === "listen" ? `Note ${played} of ${tune.length}` : `${step} of ${tune.length} notes played`}>
      {tune.map((_, i) => <span key={i} className={(phase === "listen" ? i < played : i < step) ? "on" : ""}>♪</span>)}
    </div>
    {phase !== "done" && <p className="mm-fox" role="status">🦊 {phase === "listen" ? (misses >= 2 ? "Watch carefully — I'll play it slowly." : `${tune.length} notes. Watch and listen!`) : help ? "Tap the glowing animal!" : `${step} of ${tune.length} so far${step ? ", nice!" : ""}`}</p>}
  </>;
}

// ---------- Hold the Numbers ----------
function NumbersRound({ setup, shown, answer, soundOn, onDone }: { setup: NumberSetup; shown: number[]; answer: number[]; soundOn: boolean; onDone: (misses: number) => void }) {
  const [phase, setPhase] = useState<"show" | "turn" | "done">("show");
  const [visible, setVisible] = useState(0);
  const [entered, setEntered] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const { later, clear } = useTimers();

  function sayThen(text: string, then: () => void, exclaim?: Exclaim) {
    clear();
    let done = false;
    const go = () => { if (!done) { done = true; then(); } };
    if (soundOn) speak(text, { exclaim, onEnd: () => later(go, 250) });
    later(go, soundOn ? 4500 : 900);
  }

  function showNumbers() {
    clear();
    setPhase("show"); setEntered([]); setVisible(0); setWrong(null);
    const gap = setup.showMs;
    shown.forEach((digit, i) => later(() => {
      setVisible(i + 1);
      if (soundOn) speak(String(digit), { rate: 1.05 });
    }, 300 + i * gap));
    later(() => {
      setPhase("turn");
      if (soundOn) speak(setup.backwards ? "Now tap them backwards. Start with the last one!" : "Now tap them in the same order!");
    }, 300 + (shown.length - 1) * gap + NUMBER_HOLD_MS + gap);
  }

  useEffect(() => {
    sayThen(setup.backwards ? "Remember these numbers. Then turn them around!" : "Remember these numbers!", showNumbers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tap(digit: number) {
    if (phase !== "turn") return;
    if (digit === answer[entered.length]) {
      if (soundOn) playStep(entered.length);
      const next = [...entered, digit];
      setEntered(next);
      if (next.length === answer.length) { setPhase("done"); later(() => onDone(misses), 450); }
      return;
    }
    const count = misses + 1;
    setMisses(count); setWrong(digit);
    if (soundOn) playWrong();
    setPhase("show");
    sayThen(count === 1 ? "Nearly! Let's look again." : "Let's look together. Then tap the glowing number!", showNumbers, "oops");
    // After sayThen, which clears pending timers, so the wrong-key shake still ends on time.
    later(() => setWrong(null), 450);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { const n = Number(event.key); if (n >= 1 && n <= 9) tap(n); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const help = misses >= 2 && phase === "turn";
  return <>
    <h2 className={`pz-prompt mm-say ${phase === "turn" ? "go" : ""}`}>
      {phase === "show" ? "Remember these! 🧠" : phase === "turn" ? (setup.backwards ? "Tap them backwards! ⬅️" : "Tap them in order! ➡️") : "You remembered! 🎉"}
    </h2>
    {setup.backwards && <p className="mm-backwards" aria-hidden="true">🔄 Backwards round: the last number comes first!</p>}
    <div className="mm-digits" aria-live="polite">
      {phase === "show"
        ? shown.map((digit, i) => <span key={i} className={`mm-digit ${i < visible ? "seen" : "waiting"}`}>{i < visible ? digit : ""}</span>)
        : answer.map((_, i) => <span key={i} className={`mm-digit slot ${i < entered.length ? "filled" : i === entered.length && phase === "turn" ? "next" : ""}`}>{entered[i] ?? "?"}</span>)}
    </div>
    <div className={`mm-keypad ${phase === "turn" ? "" : "sleepy"}`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => <button key={digit}
        className={`${help && answer[entered.length] === digit ? "hint" : ""} ${wrong === digit ? "wrong" : ""}`}
        onClick={() => tap(digit)} disabled={phase !== "turn"} aria-label={`${digit}`}>{digit}</button>)}
    </div>
  </>;
}
