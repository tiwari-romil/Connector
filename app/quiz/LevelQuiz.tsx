"use client";

import { useEffect, useMemo, useState } from "react";
import { playCheer, playTone } from "../audio";
import { starsFor } from "../puzzles/model";
import { speak } from "../speech";
import LevelMap from "./LevelMap";
import RodBlockPicture from "./RodBlockPicture";
import { LEVEL_COUNT, MATH_LEVELS, SCIENCE_LEVELS, mathChoicesFor, recordWin, rodAndBlockExpansion, scienceChoicesFor, type QuizProgress, type QuizSubject } from "./content";

const COLORS = ["coral", "sky", "sun", "mint"];
const MASCOTS = ["🦊", "🐼", "🦁", "🐸", "🐨"];
const PRAISE = ["Wow!", "Awesome!", "Super star!", "Brilliant!", "You got it!"];
const TITLE: Record<QuizSubject, string> = { math: "Maths", science: "Science" };

type Props = {
  subject: QuizSubject;
  progress: QuizProgress;
  onProgress: (update: (previous: QuizProgress) => QuizProgress) => void;
  onAnswer: (correct: boolean) => void;
  soundOn: boolean;
};

export default function LevelQuiz({ subject, progress, onProgress, onAnswer, soundOn }: Props) {
  // Seeds the answer order, so it changes on every visit to a level.
  const [visit, setVisit] = useState(() => Math.floor(Math.random() * 100000));
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">("playing");
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const index = progress.levelIndex;
  const levelCount = LEVEL_COUNT[subject];
  const math = subject === "math" ? MATH_LEVELS[index] : null;
  const science = subject === "science" ? SCIENCE_LEVELS[index] : null;
  const difficulty = math?.difficulty ?? science!.difficulty;
  const answer = math ? String(math.a + math.b) : science!.answer;
  const choices = useMemo(() => (math ? mathChoicesFor(math, index, visit) : scienceChoicesFor(science!, index, visit)), [math, science, index, visit]);
  const smallSum = !!math && math.a < 10 && math.b < 10;
  const wrongTries = wrongPicks.length;
  const praise = PRAISE[(index + visit) % PRAISE.length];
  const questionText = math ? `${math.a} plus ${math.b}. How many altogether?` : science!.prompt;

  // Read every question aloud, then wake the answers up ("think first").
  useEffect(() => {
    let done = false;
    const wake = () => { if (!done) { done = true; setReady(true); } };
    const fallback = setTimeout(wake, soundOn ? 5000 : 1200);
    if (soundOn) speak(questionText, { onEnd: () => setTimeout(wake, 200) });
    return () => { done = true; clearTimeout(fallback); };
  }, [questionText, visit, soundOn]);

  function pick(value: string, choice: number) {
    if (status === "correct" || !ready || wrongPicks.includes(choice)) return;
    setSelected(choice);
    if (value === answer) {
      setStatus("correct");
      onProgress((previous) => recordWin(previous, index, starsFor(wrongTries), levelCount));
      onAnswer(true);
      if (soundOn) { playCheer(); speak(praise, { pitch: 1.35 }); }
      return;
    }
    setStatus("wrong"); setWrongPicks([...wrongPicks, choice]); onAnswer(false);
    if (soundOn) playTone(180, 0.18, "sawtooth", 0.045);
    if (wrongTries + 1 >= 2) {
      // After two misses, teach instead of letting the child keep guessing.
      if (math) setShowHint(true);
      if (soundOn) speak(math ? (smallSum ? "Let's count the apples together." : "Let's count together. Put the rods together, then the blocks together.") : `Let's think together. The answer is glowing. ${questionText}`);
    } else if (soundOn) speak("Nearly! Try another one.");
  }

  function resetPuzzle() { setSelected(null); setWrongPicks([]); setStatus("playing"); setShowHint(false); setReady(false); setVisit((v) => v + 1); }

  function nextLevel() {
    if (index === levelCount - 1) { setShowMap(true); return; }
    onProgress((previous) => ({ ...previous, levelIndex: previous.levelIndex + 1 }));
    resetPuzzle();
  }

  function chooseLevel(level: number) {
    if (level + 1 > progress.unlocked) return;
    onProgress((previous) => ({ ...previous, levelIndex: level }));
    resetPuzzle(); setShowMap(false);
  }

  // Keyboard: 1–4 pick an answer, Enter goes to the next level.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (showMap || target?.closest("input, textarea, select")) return;
      const n = Number(event.key);
      if (n >= 1 && n <= choices.length) pick(choices[n - 1], n - 1);
      // A focused button already handles Enter itself.
      else if (event.key === "Enter" && status === "correct" && !target?.closest("button")) nextLevel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return <>
    <section className="level-strip" aria-label="Level progress">
      <div className="level-copy"><span className={`difficulty ${difficulty.toLowerCase()}`}>{difficulty}</span><h1>{TITLE[subject]} · Level {index + 1}</h1></div>
      <div className="progress-track"><span style={{ width: `${((index + 1) / levelCount) * 100}%` }} /></div>
      <span className="progress-count">{index + 1} / {levelCount}</span>
    </section>

    <section className={`play-card ${status} ${math ? "math-card" : "science-card"}`} aria-live="polite">
      <div className="mascot" aria-hidden="true">{MASCOTS[Math.floor(index / 10) % MASCOTS.length]}</div>
      <p className="instruction">{math ? (math.a >= 10 ? "Use rods and blocks if you need a clue!" : "Connect the sum to the right answer!") : "Match the science question to the right answer!"}</p>
      {math
        ? <div key={index} className="equation-bubble question-pop"><span>{math.a}</span><b>+</b><span>{math.b}</span><b>=</b><span className="question-mark">?</span></div>
        : <div key={index} className="equation-bubble question-pop science-prompt"><span>{science!.prompt}</span></div>}
      <button className="hear-again" onClick={() => speak(questionText)} aria-label="Hear the question again">🔊 Hear it again</button>

      {math && <div className="math-hint">
        <button onClick={() => setShowHint((value) => !value)} aria-expanded={showHint}>{showHint ? "Hide the clue" : smallSum ? "💡 Show me with apples" : "💡 Show rod & block hint"}</button>
        {showHint && smallSum && <div className="dot-hint"><span>{"🍎".repeat(math.a)}</span><b>+</b><span>{"🍏".repeat(math.b)}</span><p>Count all the apples!</p></div>}
        {showHint && !smallSum && <div className="hint-picture">
          <RodBlockPicture number={math.a} /><span>+</span><RodBlockPicture number={math.b} />
          <p className="hint-expansion">{rodAndBlockExpansion(math.a)}<br />{rodAndBlockExpansion(math.b)}</p>
          <p>Put the <strong>rods</strong> together. Then put the <strong>blocks</strong> together.</p>
        </div>}
      </div>}

      <div className="connection-zone">
        <svg className="connection-lines" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">
          {selected !== null && <path className={status === "correct" ? "right-line" : status === "wrong" ? "wrong-line" : ""} d={`M 500 0 C 500 100, ${125 + selected * 250} 90, ${125 + selected * 250} 220`} />}
        </svg>
        <div className="trail-dot">✦</div>
        <div className={`answers ${ready ? "" : "sleepy"}`}>
          {choices.map((choice, i) => <button key={`${choice}-${i}`}
            className={`answer ${COLORS[i]} ${selected === i ? "selected" : ""} ${wrongPicks.includes(i) ? "ruled-out" : ""} ${!math && wrongTries >= 2 && status !== "correct" && choice === answer ? "glow" : ""}`}
            onClick={() => pick(choice, i)} disabled={status === "correct" || !ready || wrongPicks.includes(i)} aria-label={`Answer ${choice}`}>
            <span>{choice}</span><i aria-hidden="true" />
          </button>)}
        </div>
      </div>

      <div className={`feedback ${status}`}>
        {status === "playing" && (ready ? <><span>👆</span> Tap an answer</> : <><span>👂</span> Listen…</>)}
        {status === "wrong" && <><span>{wrongTries >= 2 ? "💡" : "💪"}</span> {wrongTries >= 2 ? (math ? "Let’s use the clue — count them!" : "Look for the glowing answer!") : "Nearly! Try another one."}</>}
        {status === "correct" && <>
          <span className="celebrate">🎉</span>
          <div><strong>{praise}</strong><small>{math ? `You found ${answer}!` : `That’s right — ${answer}!`}</small></div>
          <button onClick={nextLevel}>{index === levelCount - 1 ? "See my map" : "Next level"} <span>→</span></button>
        </>}
      </div>
    </section>

    <button className="map-button" onClick={() => setShowMap(true)}>🗺️ {TITLE[subject]} map</button>
    {status === "correct" && <div className="celebration-burst" aria-hidden="true">{["🎉", "⭐", "🌟", "🟣", "✨", "🟡", "🎈", "💜", "⭐", "🎊"].map((e, i) => <span key={i}>{e}</span>)}</div>}
    {showMap && <LevelMap title={TITLE[subject]} levelCount={levelCount} unlocked={progress.unlocked} current={index} onChoose={chooseLevel} onClose={() => setShowMap(false)} />}
  </>;
}
