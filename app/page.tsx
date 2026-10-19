"use client";

import { useEffect, useRef, useState } from "react";
import { playStart, playTone } from "./audio";
import DiscoveryMissions from "./DiscoveryMissions";
import OlympiadPrep from "./olympiad/OlympiadPrep";
import PuzzleAdventure from "./puzzles/PuzzleAdventure";
import LearnModal from "./quiz/LearnModal";
import LevelQuiz from "./quiz/LevelQuiz";
import { emptyProgress, readQuizProgress, type QuizProgress, type QuizSubject } from "./quiz/content";
import { speak, stopSpeaking } from "./speech";
import WelcomeScreen from "./WelcomeScreen";

type Mode = "prep" | "puzzles" | QuizSubject;
const PROGRESS_KEY = "learning-adventure-progress";
const LEGACY_MATH_KEY = "math-adventure-progress";
const NAME_KEY = "player-name";
// A soft 16-note pentatonic tune; the rests (0) keep it calm.
const TUNE = [392, 440, 523.3, 0, 440, 392, 329.6, 0, 293.7, 329.6, 392, 440, 392, 0, 329.6, 0];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<Mode>("math");
  const [discoveryMode, setDiscoveryMode] = useState(false);
  const [progress, setProgress] = useState<Record<QuizSubject, QuizProgress>>({ math: emptyProgress(), science: emptyProgress() });
  const [playerName, setPlayerName] = useState("");
  const [streak, setStreak] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [showLearn, setShowLearn] = useState(false);
  const musicTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const isQuiz = mode === "math" || mode === "science";
  const showDiscovery = isQuiz && discoveryMode;
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
  useEffect(() => () => { if (musicTimer.current) clearInterval(musicTimer.current); }, []);

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

  function startMusic() {
    if (musicTimer.current) return;
    let note = 0;
    const play = () => { const frequency = TUNE[note++ % TUNE.length]; if (frequency) playTone(frequency, 0.45, "sine", 0.018); };
    play();
    musicTimer.current = setInterval(play, 700);
  }

  function stopMusic() {
    if (musicTimer.current) { clearInterval(musicTimer.current); musicTimer.current = null; }
  }

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    if (next) { if (started) startMusic(); }
    else { stopMusic(); stopSpeaking(); }
  }

  function begin(next: Mode) {
    setMode(next); setStarted(true);
    if (next === "math" || next === "science") setDiscoveryMode(false);
    if (soundOn) { startMusic(); playStart(); }
  }

  function goHome() { stopSpeaking(); setShowLearn(false); setStarted(false); }

  return (
    <main className={`game-shell ${theme}-theme ${showDiscovery ? "discovery-screen" : ""} ${mode === "prep" ? "prep-screen" : ""}`}>
      <div className="cloud cloud-one" aria-hidden="true">☁</div><div className="cloud cloud-two" aria-hidden="true">☁</div><div className="sparkles" aria-hidden="true">✦　·　✦　·　✦</div>
      <div className="sky-friends" aria-hidden="true"><span>🌈</span><span>{mode === "science" ? "🦋" : mode === "puzzles" ? "🪁" : "⭐"}</span><span>{mode === "science" ? "🌼" : mode === "puzzles" ? "🧩" : "🧮"}</span></div>

      <header className="topbar">
        <button className="brand" onClick={goHome} aria-label="Back to the start screen"><span className="brand-mark">{mode === "science" ? "🔬" : mode === "puzzles" ? "🧩" : mode === "prep" ? "🏆" : "➕"}</span><span>Learning Adventure</span></button>
        <div className="subject-switch" aria-label="Choose a learning game">
          <button className={mode === "prep" ? "active" : ""} onClick={() => setMode("prep")}>🏆 Olympiad</button>
          <button className={mode === "math" ? "active" : ""} onClick={() => setMode("math")}>➕ Maths</button>
          <button className={mode === "science" ? "active" : ""} onClick={() => setMode("science")}>🔬 Science</button>
          <button className={mode === "puzzles" ? "active" : ""} onClick={() => setMode("puzzles")}>🧩 Puzzles</button>
          <button className="learn-button" onClick={() => setShowLearn(true)}>💡 Learn</button>
        </div>
        <div className="stats">
          <div className="stat" aria-label={`${totalStars} quiz stars`}><span>⭐</span><strong>{totalStars}</strong></div>
          <div className="stat" aria-label={`${streak} correct in a row`}><span>🔥</span><strong>{streak}</strong></div>
          <button className="sound-button" onClick={toggleSound} aria-label={soundOn ? "Turn sound off" : "Turn sound on"}>{soundOn ? "🔊" : "🔇"}</button>
        </div>
      </header>

      {started && isQuiz && <div className="play-mode-switch" aria-label="Play style">
        <button aria-pressed={!discoveryMode} onClick={() => setDiscoveryMode(false)}>⭐ Level quizzes</button>
        <button aria-pressed={discoveryMode} onClick={() => setDiscoveryMode(true)}>🔎 Discovery missions <small>with a grown-up</small></button>
      </div>}

      {started && mode === "prep" && <OlympiadPrep soundOn={soundOn} />}
      {started && mode === "puzzles" && <PuzzleAdventure soundOn={soundOn} />}
      {started && showDiscovery && <DiscoveryMissions key={mode} subject={mode} onQuiz={() => setDiscoveryMode(false)} soundOn={soundOn} />}
      {started && isQuiz && !discoveryMode && <LevelQuiz key={mode} subject={mode} progress={progress[mode]} soundOn={soundOn}
        onProgress={(update) => updateProgress(mode, update)} onAnswer={(correct) => setStreak((value) => (correct ? value + 1 : 0))} />}

      {!started && <WelcomeScreen playerName={playerName} onName={saveName} onPrep={() => begin("prep")} onPuzzles={() => begin("puzzles")} onMath={() => begin("math")} onScience={() => begin("science")} />}
      {showLearn && <LearnModal onClose={() => setShowLearn(false)} onPractise={() => { setShowLearn(false); begin("math"); }} />}
    </main>
  );
}
