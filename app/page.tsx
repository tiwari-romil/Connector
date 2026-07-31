"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Level = { a: number; b: number; difficulty: "Easy" | "Medium" | "Tricky" };

const LEVELS: Level[] = Array.from({ length: 50 }, (_, i) => {
  if (i < 15) return { a: 2 + ((i * 3) % 13), b: 3 + ((i * 7) % 13), difficulty: "Easy" };
  if (i < 35) return { a: 18 + ((i * 7) % 18), b: 6 + ((i * 5) % 16), difficulty: "Medium" };
  return { a: 30 + ((i * 5) % 31), b: 8 + ((i * 9) % 28), difficulty: "Tricky" };
});

const COLORS = ["coral", "sky", "sun", "mint"];
const MASCOTS = ["🦊", "🐼", "🦁", "🐸", "🐨"];

function choicesFor(level: Level, index: number) {
  const answer = level.a + level.b;
  const pool = [answer, answer + 2, Math.max(1, answer - 3), answer + 5];
  const shift = index % 4;
  return [...pool.slice(shift), ...pool.slice(0, shift)];
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [levelIndex, setLevelIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(1);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wrongTries, setWrongTries] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">("playing");
  const [musicOn, setMusicOn] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const musicTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const level = LEVELS[levelIndex];
  const answer = level.a + level.b;
  const choices = useMemo(() => choicesFor(level, levelIndex), [level, levelIndex]);

  useEffect(() => {
    const saved = localStorage.getItem("math-adventure-progress");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      setUnlocked(Math.min(50, Math.max(1, data.unlocked || 1)));
      setStars(Math.max(0, data.stars || 0));
    } catch {
      localStorage.removeItem("math-adventure-progress");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("math-adventure-progress", JSON.stringify({ unlocked, stars }));
  }, [unlocked, stars]);

  useEffect(() => () => {
    if (musicTimer.current) clearInterval(musicTimer.current);
    audioRef.current?.close();
  }, []);

  function audio() {
    if (!audioRef.current) audioRef.current = new AudioContext();
    if (audioRef.current.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  }

  function tone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.08, delay = 0) {
    const ctx = audio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  function startMusic(force = false) {
    if ((!musicOn && !force) || musicTimer.current) return;
    const notes = [261.6, 329.6, 392, 523.3];
    let n = 0;
    tone(notes[0], 0.28, "triangle", 0.025);
    musicTimer.current = setInterval(() => {
      tone(notes[n++ % notes.length], 0.3, "triangle", 0.025);
    }, 620);
  }

  function toggleMusic() {
    const next = !musicOn;
    setMusicOn(next);
    if (!next && musicTimer.current) {
      clearInterval(musicTimer.current);
      musicTimer.current = null;
    } else if (next && started) {
      setTimeout(() => startMusic(true), 0);
    }
  }

  function begin() {
    setStarted(true);
    startMusic();
    tone(392, 0.15, "sine", 0.08);
    tone(523.3, 0.25, "sine", 0.08, 0.12);
  }

  function pick(value: number, index: number) {
    if (status === "correct") return;
    setSelected(index);
    if (value === answer) {
      setStatus("correct");
      const earned = wrongTries === 0 ? 3 : wrongTries === 1 ? 2 : 1;
      setStars((value) => value + earned);
      setStreak((value) => value + 1);
      setUnlocked((value) => Math.max(value, Math.min(50, levelIndex + 2)));
      tone(523.3, 0.18, "sine", 0.1);
      tone(659.3, 0.18, "sine", 0.1, 0.12);
      tone(784, 0.32, "sine", 0.1, 0.24);
    } else {
      setStatus("wrong");
      setWrongTries((value) => value + 1);
      setStreak(0);
      tone(180, 0.18, "sawtooth", 0.045);
      setTimeout(() => {
        setStatus("playing");
        setSelected(null);
      }, 750);
    }
  }

  function nextLevel() {
    if (levelIndex === 49) {
      setShowMap(true);
      return;
    }
    setLevelIndex((value) => value + 1);
    setSelected(null);
    setWrongTries(0);
    setStatus("playing");
  }

  function chooseLevel(index: number) {
    if (index + 1 > unlocked) return;
    setLevelIndex(index);
    setSelected(null);
    setWrongTries(0);
    setStatus("playing");
    setShowMap(false);
  }

  return (
    <main className="game-shell">
      <div className="cloud cloud-one" aria-hidden="true">☁</div>
      <div className="cloud cloud-two" aria-hidden="true">☁</div>
      <div className="sparkles" aria-hidden="true">✦　·　✦　·　✦</div>

      <header className="topbar">
        <button className="brand" onClick={() => setShowMap(true)} aria-label="Open level map">
          <span className="brand-mark">➕</span>
          <span>Math Adventure</span>
        </button>
        <div className="stats">
          <div className="stat"><span>⭐</span><strong>{stars}</strong></div>
          <div className="stat"><span>🔥</span><strong>{streak}</strong></div>
          <button className="sound-button" onClick={toggleMusic} aria-label={musicOn ? "Turn music off" : "Turn music on"}>
            {musicOn ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      <section className="level-strip" aria-label="Level progress">
        <div className="level-copy">
          <span className={`difficulty ${level.difficulty.toLowerCase()}`}>{level.difficulty}</span>
          <h1>Level {levelIndex + 1}</h1>
        </div>
        <div className="progress-track"><span style={{ width: `${((levelIndex + 1) / 50) * 100}%` }} /></div>
        <span className="progress-count">{levelIndex + 1} / 50</span>
      </section>

      <section className={`play-card ${status}`} aria-live="polite">
        <div className="mascot" aria-hidden="true">{MASCOTS[Math.floor(levelIndex / 10)]}</div>
        <p className="instruction">Connect the sum to the right answer!</p>
        <div className="equation-bubble">
          <span>{level.a}</span><b>+</b><span>{level.b}</span><b>=</b><span className="question-mark">?</span>
        </div>

        <div className="connection-zone">
          <svg className="connection-lines" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">
            {selected !== null && (
              <path className={status === "correct" ? "right-line" : status === "wrong" ? "wrong-line" : ""}
                d={`M 500 0 C 500 100, ${125 + selected * 250} 90, ${125 + selected * 250} 220`} />
            )}
          </svg>
          <div className="trail-dot">✦</div>
          <div className="answers">
            {choices.map((choice, index) => (
              <button key={`${choice}-${index}`} className={`answer ${COLORS[index]} ${selected === index ? "selected" : ""}`}
                onClick={() => pick(choice, index)} disabled={status === "correct"} aria-label={`Answer ${choice}`}>
                <span>{choice}</span><i aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <div className={`feedback ${status}`}>
          {status === "playing" && <><span>👆</span> Tap an answer</>}
          {status === "wrong" && <><span>💪</span> Nearly! Try another one.</>}
          {status === "correct" && (
            <>
              <span className="celebrate">🎉</span>
              <div><strong>Amazing!</strong><small>You found {answer}!</small></div>
              <button onClick={nextLevel}>{levelIndex === 49 ? "See my map" : "Next level"} <span>→</span></button>
            </>
          )}
        </div>
      </section>

      <button className="map-button" onClick={() => setShowMap(true)}>🗺️ Level map</button>

      {!started && (
        <div className="overlay">
          <div className="welcome-card">
            <div className="welcome-confetti" aria-hidden="true">
              <span>★</span><span>●</span><span>✦</span><span>▲</span><span>★</span>
            </div>
            <div className="welcome-mascot">🦊</div>
            <p className="eyebrow">A special adventure for</p>
            <h2 className="child-greeting" aria-label="Hi Hridhaan!">
              <small>Hi</small>{[..."Hridhaan!"].map((letter, index) => <span key={index}>{letter}</span>)}
            </h2>
            <h3>Ready for a Math Adventure?</h3>
            <p>Find the right answers, earn stars and unlock every level.</p>
            <button onClick={begin}>Let’s play, Hridhaan! <span>🚀</span></button>
          </div>
        </div>
      )}

      {showMap && (
        <div className="overlay map-overlay" role="dialog" aria-modal="true" aria-label="Level map">
          <div className="map-card">
            <button className="close" onClick={() => setShowMap(false)} aria-label="Close level map">×</button>
            <p className="eyebrow">Your adventure</p>
            <h2>Level map</h2>
            <p>{unlocked === 50 ? "Every level is unlocked — superstar!" : `${unlocked} of 50 levels unlocked`}</p>
            <div className="level-grid">
              {LEVELS.map((item, index) => {
                const isUnlocked = index + 1 <= unlocked;
                return (
                  <button key={index} disabled={!isUnlocked} onClick={() => chooseLevel(index)}
                    className={`${isUnlocked ? "unlocked" : "locked"} ${index === levelIndex ? "current" : ""}`}
                    aria-label={`Level ${index + 1}${isUnlocked ? "" : ", locked"}`}>
                    {isUnlocked ? index + 1 : "🔒"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
