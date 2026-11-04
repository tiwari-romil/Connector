"use client";

import { useEffect, useRef, useState } from "react";
import { playSelect, playStart, startMusic, stopMusic, unlockAudio } from "./audio";
import DiscoveryMissions from "./DiscoveryMissions";
import MemoryGames from "./memory/MemoryGames";
import OlympiadPrep from "./olympiad/OlympiadPrep";
import PuzzleAdventure from "./puzzles/PuzzleAdventure";
import CarryClub from "./quiz/CarryClub";
import LearnModal from "./quiz/LearnModal";
import LevelQuiz from "./quiz/LevelQuiz";
import { emptyProgress, readQuizProgress, type QuizProgress, type QuizSubject } from "./quiz/content";
import { speak, stopSpeaking, unlockSpeech } from "./speech";
import WelcomeScreen from "./WelcomeScreen";

type Mode = "prep" | "puzzles" | "memory" | QuizSubject;
// Maths and science have level quizzes and discovery missions; maths also has Carry Club.
type PlayStyle = "levels" | "discovery" | "carry";
const PROGRESS_KEY = "learning-adventure-progress";
const LEGACY_MATH_KEY = "math-adventure-progress";
const NAME_KEY = "player-name";

export default function Home() {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<Mode>("math");
  const [playStyle, setPlayStyle] = useState<PlayStyle>("levels");
  const [progress, setProgress] = useState<Record<QuizSubject, QuizProgress>>({ math: emptyProgress(), science: emptyProgress() });
  const [playerName, setPlayerName] = useState("");
  const [streak, setStreak] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [showLearn, setShowLearn] = useState(false);
  const soundRef = useRef(soundOn);

  const isQuiz = mode === "math" || mode === "science";
  const style: PlayStyle = mode === "science" && playStyle === "carry" ? "levels" : playStyle;
  const showDiscovery = isQuiz && style === "discovery";
  const showCarry = mode === "math" && style === "carry";
  const showLevels = isQuiz && style === "levels";
  const theme = mode === "puzzles" ? "logic" : mode === "prep" ? "math" : mode;
  const totalStars = progress.math.stars + progress.science.stars;

  useEffect(() => {
    // Browser-only data is read after hydration so the server and first browser render match.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(readQuizProgress(localStorage.getItem(PROGRESS_KEY), localStorage.getItem(LEGACY_MATH_KEY)));
      setPlayerName(localStorage.getItem(NAME_KEY) ?? "");
    } catch { /* storage blocked: play without saving */ }
  }, []);
  useEffect(() => () => stopMusic(), []);
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  useEffect(() => {
    // Every button tap gets a retro blip; taps that already played their own sound (answers, pads) skip it.
    const blip = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest?.("button");
      if (soundRef.current && button && !button.disabled) playSelect();
    };
    document.addEventListener("click", blip);
    return () => document.removeEventListener("click", blip);
  }, []);
  useEffect(() => {
    // Phone browsers only allow speech and sound that start from a tap, so unlock both on the first one.
    const unlock = () => { unlockSpeech(); unlockAudio(); };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  function updateProgress(subject: QuizSubject, update: (previous: QuizProgress) => QuizProgress) {
    setProgress((previous) => {
      const next = { ...previous, [subject]: update(previous[subject]) };
      try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
      return next;
    });
  }

  function saveName(name: string) {
    setPlayerName(name);
    try { if (name) localStorage.setItem(NAME_KEY, name); else localStorage.removeItem(NAME_KEY); } catch { /* storage blocked */ }
    if (name && soundOn) speak(`Hello ${name}!`);
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    if (next) { if (started) startMusic(); }
    else { stopMusic(); stopSpeaking(); }
  }

  function begin(next: Mode) {
    setMode(next); setStarted(true);
    if (next === "math" || next === "science") setPlayStyle("levels");
    if (soundOn) { startMusic(); playStart(); }
  }

  function goHome() { stopSpeaking(); setShowLearn(false); setStarted(false); }

  return (
    <main className={`game-shell ${theme}-theme ${showDiscovery ? "discovery-screen" : ""} ${mode === "prep" ? "prep-screen" : ""}`}>
      <div className="cloud cloud-one" aria-hidden="true">☁</div><div className="cloud cloud-two" aria-hidden="true">☁</div><div className="sparkles" aria-hidden="true">✦　·　✦　·　✦</div>
      <div className="sky-friends" aria-hidden="true"><span>🌈</span><span>{mode === "science" ? "🦋" : mode === "puzzles" ? "🪁" : mode === "memory" ? "🎵" : "⭐"}</span><span>{mode === "science" ? "🌼" : mode === "puzzles" ? "🧩" : mode === "memory" ? "🧠" : "🧮"}</span></div>

      <header className="topbar">
        <button className="brand" onClick={goHome} aria-label="Back to the start screen"><span className="brand-mark">{mode === "science" ? "🔬" : mode === "puzzles" ? "🧩" : mode === "prep" ? "🏆" : mode === "memory" ? "🧠" : "➕"}</span><span>Learning Adventure</span></button>
        <div className="subject-switch" aria-label="Choose a learning game">
          <button className={mode === "prep" ? "active" : ""} onClick={() => setMode("prep")}>🏆 Olympiad</button>
          <button className={mode === "math" ? "active" : ""} onClick={() => setMode("math")}>➕ Maths</button>
          <button className={mode === "science" ? "active" : ""} onClick={() => setMode("science")}>🔬 Science</button>
          <button className={mode === "puzzles" ? "active" : ""} onClick={() => setMode("puzzles")}>🧩 Puzzles</button>
          <button className={mode === "memory" ? "active" : ""} onClick={() => setMode("memory")}>🧠 Memory</button>
          <button className="learn-button" onClick={() => setShowLearn(true)}>💡 Learn</button>
        </div>
        <div className="stats">
          <div className="stat" aria-label={`${totalStars} quiz stars`}><span>⭐</span><strong>{totalStars}</strong></div>
          <div className="stat" aria-label={`${streak} correct in a row`}><span>🔥</span><strong>{streak}</strong></div>
          <button className="sound-button" onClick={toggleSound} aria-label={soundOn ? "Turn sound off" : "Turn sound on"}>{soundOn ? "🔊" : "🔇"}</button>
        </div>
      </header>

      {started && isQuiz && <div className="play-mode-switch" aria-label="Play style">
        <button aria-pressed={style === "levels"} onClick={() => setPlayStyle("levels")}>⭐ Level quizzes</button>
        {mode === "math" && <button aria-pressed={style === "carry"} onClick={() => setPlayStyle("carry")}>🦸 Carry Club</button>}
        <button aria-pressed={style === "discovery"} onClick={() => setPlayStyle("discovery")}>🔎 Discovery missions <small>with a grown-up</small></button>
      </div>}

      {started && mode === "prep" && <OlympiadPrep soundOn={soundOn} />}
      {started && mode === "puzzles" && <PuzzleAdventure soundOn={soundOn} />}
      {started && mode === "memory" && <MemoryGames soundOn={soundOn} />}
      {started && showCarry && <CarryClub soundOn={soundOn} />}
      {started && showDiscovery && <DiscoveryMissions key={mode} subject={mode} onQuiz={() => setPlayStyle("levels")} soundOn={soundOn} />}
      {started && showLevels && <LevelQuiz key={mode} subject={mode} progress={progress[mode]} soundOn={soundOn}
        onProgress={(update) => updateProgress(mode, update)} onAnswer={(correct) => setStreak((value) => (correct ? value + 1 : 0))} />}

      {!started && <WelcomeScreen playerName={playerName} onName={saveName} onPrep={() => begin("prep")} onPuzzles={() => begin("puzzles")} onMemory={() => begin("memory")} onMath={() => begin("math")} onScience={() => begin("science")} />}
      {showLearn && <LearnModal onClose={() => setShowLearn(false)} onPractise={() => { setShowLearn(false); begin("math"); }} />}
    </main>
  );
}
