"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "Easy" | "Medium" | "Tricky";
type Subject = "math" | "science" | "logic";
type MathLevel = { a: number; b: number; difficulty: Difficulty };
type ScienceLevel = { prompt: string; answer: string; distractors: string[]; difficulty: Difficulty };
type LogicLevel = ScienceLevel & { category: "Odd One Out" | "What Comes Next?" };
type Progress = { levelIndex: number; unlocked: number; stars: number };
type AdventureProgress = Record<Subject, Progress>;

const MATH_LEVELS: MathLevel[] = Array.from({ length: 50 }, (_, i) => {
  if (i < 18) return { a: 10 + ((i * 3) % 10), b: 1 + (i % 4), difficulty: "Easy" };
  if (i < 35) return { a: 15 + ((i * 4) % 10), b: 2 + (i % 6), difficulty: "Medium" };
  return { a: 20 + ((i * 3) % 10), b: 4 + (i % 6), difficulty: "Tricky" };
});

const SCIENCE_LEVELS: ScienceLevel[] = [
  ["What gives us light in the day?", "The Sun", "The Moon", "A shoe", "A book"],
  ["What do we see in the sky at night?", "The Moon", "A fish", "A tree", "A bus"],
  ["What falls from clouds?", "Rain", "Sand", "Leaves", "Shoes"],
  ["What has many beautiful colours after rain?", "A rainbow", "A spoon", "A sock", "A chair"],
  ["What does a plant need to drink?", "Water", "Juice", "Milk", "Paint"],
  ["Which part of a plant drinks water?", "Roots", "Wings", "Wheels", "Tail"],
  ["Which part of a plant is usually green?", "A leaf", "A cloud", "A shell", "A stone"],
  ["What can grow into a plant?", "A seed", "A button", "A crayon", "A coin"],
  ["What insect visits flowers?", "A bee", "A snail", "A worm", "A spider"],
  ["What does a butterfly use to fly?", "Wings", "Paws", "Fins", "Hooves"],
  ["What does a dog have on its feet?", "Paws", "Fins", "Wheels", "Roots"],
  ["What animal lays eggs and has feathers?", "A bird", "A cat", "A dog", "A cow"],
  ["Where does a fish live?", "In water", "In a tree", "In a nest", "In a cave"],
  ["What animal likes to hop?", "A frog", "A lion", "A whale", "A snake"],
  ["What sound does a lion make?", "A roar", "A meow", "A quack", "A moo"],
  ["What sound does a cat make?", "A meow", "A roar", "A bark", "A buzz"],
  ["Which body part helps us see?", "Eyes", "Ears", "Feet", "Elbows"],
  ["Which body part helps us hear?", "Ears", "Nose", "Hands", "Knees"],
  ["Which body part helps us smell?", "Nose", "Toes", "Hair", "Fingers"],
  ["Which body part helps us taste?", "Tongue", "Thumb", "Ear", "Knee"],
  ["Which body part helps us feel things?", "Hands", "Teeth", "Eyes", "Hair"],
  ["What do we use to chew food?", "Teeth", "Ears", "Toes", "Fingers"],
  ["What helps us breathe?", "Lungs", "Shoes", "Pockets", "Buttons"],
  ["What keeps our heart healthy?", "Moving our body", "Eating rocks", "Never sleeping", "Skipping water"],
  ["What cleans our hands?", "Soap", "Sand", "Glue", "Paint"],
  ["What cleans our teeth?", "A toothbrush", "A fork", "A comb", "A ruler"],
  ["What protects our head on a bike?", "A helmet", "A scarf", "A sock", "A spoon"],
  ["What keeps us warm in winter?", "A coat", "An ice cube", "A fan", "A puddle"],
  ["What feels very cold?", "Ice", "Fire", "Soup", "Sunshine"],
  ["What feels very hot?", "Fire", "Snow", "Ice", "Rain"],
  ["What can a magnet stick to?", "Metal", "Water", "Paper", "Wood"],
  ["What shape can roll easily?", "A ball", "A box", "A book", "A brick"],
  ["What is usually hard?", "A rock", "A pillow", "A sponge", "A cloud"],
  ["What is usually soft?", "A pillow", "A stone", "A spoon", "A wall"],
  ["Where does wood come from?", "A tree", "A cloud", "A fish", "A star"],
  ["What can paper be made from?", "Trees", "Shoes", "Rainbows", "Sandwiches"],
  ["Where does a car travel?", "On a road", "In the sky", "Under water", "On a roof"],
  ["Where does a boat travel?", "On water", "On a road", "In a tree", "On rails"],
  ["Where does an aeroplane fly?", "In the sky", "In a pond", "In a cave", "On rails"],
  ["Where does a train travel?", "On rails", "In the sky", "On water", "In a nest"],
  ["What tells us it is daytime?", "The Sun", "A pillow", "A starfish", "A shoe"],
  ["What is the big planet we live on?", "Earth", "A balloon", "A biscuit", "A hat"],
  ["What can we do with an empty bottle?", "Recycle it", "Throw it in a river", "Hide it in soil", "Break it"],
  ["What shines in the night sky?", "A star", "A chair", "A sock", "A sandwich"],
  ["What is made when light is blocked?", "A shadow", "A rainbow", "A song", "A smell"],
  ["What does water become when it freezes?", "Ice", "Smoke", "Sand", "Wood"],
  ["What does ice become when it melts?", "Water", "Rock", "Paper", "Wind"],
  ["What can make leaves move?", "Wind", "A spoon", "A pencil", "A sock"],
  ["What helps plants grow?", "Rain", "Plastic", "Paint", "Dust"],
  ["What do we use to look at tiny things?", "A magnifying glass", "A pillow", "A fork", "A shoe"],
].map(([prompt, answer, ...distractors], index) => ({
  prompt,
  answer,
  distractors,
  difficulty: index < 18 ? "Easy" : index < 35 ? "Medium" : "Tricky",
}));

const LOGIC_LEVELS: LogicLevel[] = [
  ["Odd One Out", "Which one is different?", "🐶", "🐱", "🐭", "🍎"],
  ["Odd One Out", "Which one is different?", "🍌", "🍎", "🍇", "🚗"],
  ["Odd One Out", "Which one is different?", "🚗", "🚌", "🚲", "🐟"],
  ["Odd One Out", "Which one is different?", "🌞", "⭐", "🌙", "🧸"],
  ["Odd One Out", "Which one is different?", "⚽", "🏀", "🎾", "🍪"],
  ["Odd One Out", "Which one is different?", "👟", "🧦", "👢", "🐸"],
  ["Odd One Out", "Which one is different?", "🐸", "🐰", "🦘", "🚂"],
  ["Odd One Out", "Which one is different?", "🍓", "🍒", "🍅", "🛏️"],
  ["Odd One Out", "Which one is different?", "🦁", "🐯", "🐻", "🌳"],
  ["Odd One Out", "Which one is different?", "✏️", "🖍️", "🖊️", "🥪"],
  ["Odd One Out", "Which one is different?", "🐠", "🐬", "🐳", "🌼"],
  ["Odd One Out", "Which one is different?", "🪥", "🧼", "🛁", "🚀"],
  ["Odd One Out", "Which one is different?", "🥕", "🥦", "🌽", "🎈"],
  ["Odd One Out", "Which one is different?", "👒", "🧢", "🎩", "🍕"],
  ["Odd One Out", "Which one is different?", "🐔", "🦆", "🐦", "🚁"],
  ["Odd One Out", "Which one is different?", "🌧️", "❄️", "🌈", "🛴"],
  ["Odd One Out", "Which one is different?", "🛏️", "🪑", "🛋️", "🍭"],
  ["Odd One Out", "Which one is different?", "🥛", "🧃", "💧", "🧱"],
  ["Odd One Out", "Which one is different?", "🖐️", "👂", "👃", "🪁"],
  ["Odd One Out", "Which one is different?", "🚒", "🚑", "🚓", "🦋"],
  ["Odd One Out", "Which one is different?", "🐌", "🐛", "🐜", "🎸"],
  ["Odd One Out", "Which one is different?", "☕", "🥣", "🍽️", "⚽"],
  ["Odd One Out", "Which one is different?", "🏠", "🏫", "🏥", "🍉"],
  ["Odd One Out", "Which one is different?", "🖼️", "📚", "🧩", "🐘"],
  ["Odd One Out", "Which one is different?", "🌲", "🌻", "🌷", "🚤"],
  ["What Comes Next?", "What comes next?  🔴  🔵  🔴  🔵  ?", "🔴", "🔵", "🟢", "🟡"],
  ["What Comes Next?", "What comes next?  🐶  🐱  🐶  🐱  ?", "🐶", "🐱", "🐭", "🐰"],
  ["What Comes Next?", "What comes next?  1  2  3  ?", "4", "2", "5", "1"],
  ["What Comes Next?", "What comes next?  🌞  🌙  🌞  🌙  ?", "🌞", "🌙", "⭐", "☁️"],
  ["What Comes Next?", "What comes next?  🍎  🍌  🍎  🍌  ?", "🍎", "🍌", "🍇", "🍓"],
  ["What Comes Next?", "What comes next?  2  4  6  ?", "8", "7", "5", "10"],
  ["What Comes Next?", "What comes next?  🟥  🟨  🟥  🟨  ?", "🟥", "🟨", "🟦", "🟩"],
  ["What Comes Next?", "What comes next?  🐸  🐸  🐰  🐸  🐸  ?", "🐰", "🐸", "🐶", "🐱"],
  ["What Comes Next?", "What comes next?  5  4  3  ?", "2", "1", "4", "6"],
  ["What Comes Next?", "What comes next?  ⭐  ❤️  ⭐  ❤️  ?", "⭐", "❤️", "🌙", "🌈"],
  ["What Comes Next?", "What comes next?  🚌  🚗  🚌  🚗  ?", "🚌", "🚗", "🚲", "🚂"],
  ["What Comes Next?", "What comes next?  1  3  5  ?", "7", "6", "4", "8"],
  ["What Comes Next?", "What comes next?  🟢  🟢  🟡  🟢  🟢  ?", "🟡", "🟢", "🔵", "🔴"],
  ["What Comes Next?", "What comes next?  🐟  🐟  🦀  🐟  🐟  ?", "🦀", "🐟", "🐙", "🐬"],
  ["What Comes Next?", "What comes next?  10  9  8  ?", "7", "6", "9", "5"],
  ["What Comes Next?", "What comes next?  🍓  🍒  🍓  🍒  ?", "🍓", "🍒", "🍇", "🍌"],
  ["What Comes Next?", "What comes next?  ▲  ●  ▲  ●  ?", "▲", "●", "■", "★"],
  ["What Comes Next?", "What comes next?  🧦  👟  🧦  👟  ?", "🧦", "👟", "👢", "🧤"],
  ["What Comes Next?", "What comes next?  3  6  9  ?", "12", "10", "11", "8"],
  ["What Comes Next?", "What comes next?  🌧️  ☀️  🌧️  ☀️  ?", "🌧️", "☀️", "🌈", "❄️"],
  ["What Comes Next?", "What comes next?  🐝  🦋  🐝  🦋  ?", "🐝", "🦋", "🐞", "🐛"],
  ["What Comes Next?", "What comes next?  4  5  6  ?", "7", "8", "5", "3"],
  ["What Comes Next?", "What comes next?  🔺  🔺  🔵  🔺  🔺  ?", "🔵", "🔺", "🟨", "🟩"],
  ["What Comes Next?", "What comes next?  🥕  🥦  🥕  🥦  ?", "🥕", "🥦", "🌽", "🍅"],
  ["What Comes Next?", "What comes next?  7  8  9  ?", "10", "11", "8", "6"],
].map(([category, prompt, answer, ...distractors], index) => ({
  category: category as LogicLevel["category"], prompt, answer, distractors,
  difficulty: index < 18 ? "Easy" : index < 35 ? "Medium" : "Tricky",
}));

const COLORS = ["coral", "sky", "sun", "mint"];
const MASCOTS = ["🦊", "🐼", "🦁", "🐸", "🐨"];
const INITIAL_PROGRESS: AdventureProgress = {
  math: { levelIndex: 0, unlocked: 1, stars: 0 },
  science: { levelIndex: 0, unlocked: 1, stars: 0 },
  logic: { levelIndex: 0, unlocked: 1, stars: 0 },
};

function mathChoicesFor(level: MathLevel, index: number) {
  const answer = level.a + level.b;
  const pool = [String(answer), String(answer + 2), String(Math.max(1, answer - 3)), String(answer + 5)];
  const shift = index % 4;
  return [...pool.slice(shift), ...pool.slice(0, shift)];
}

function scienceChoicesFor(level: ScienceLevel, index: number) {
  const pool = [level.answer, ...level.distractors];
  const shift = index % 4;
  return [...pool.slice(shift), ...pool.slice(0, shift)];
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [subject, setSubject] = useState<Subject>("math");
  const [progress, setProgress] = useState<AdventureProgress>(INITIAL_PROGRESS);
  const [streak, setStreak] = useState(0);
  const [wrongTries, setWrongTries] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<"playing" | "correct" | "wrong">("playing");
  const [musicOn, setMusicOn] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const musicTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const levels = subject === "math" ? MATH_LEVELS : subject === "science" ? SCIENCE_LEVELS : LOGIC_LEVELS;
  const current = progress[subject];
  const level = levels[current.levelIndex];
  const isMath = subject === "math";
  const isLogic = subject === "logic";
  const answer = isMath ? String((level as MathLevel).a + (level as MathLevel).b) : (level as ScienceLevel).answer;
  const choices = useMemo(() => isMath
    ? mathChoicesFor(level as MathLevel, current.levelIndex)
    : scienceChoicesFor(level as ScienceLevel, current.levelIndex), [isMath, level, current.levelIndex]);
  const praise = current.levelIndex % 2 === 0 ? "Wow!" : "Awesome!";
  const totalStars = progress.math.stars + progress.science.stars + progress.logic.stars;

  useEffect(() => {
    const saved = localStorage.getItem("learning-adventure-progress");
    const oldMath = localStorage.getItem("math-adventure-progress");
    try {
      if (saved) {
        const data = JSON.parse(saved);
        setProgress({
          math: { levelIndex: Math.min(49, Math.max(0, data.math?.levelIndex || 0)), unlocked: Math.min(50, Math.max(1, data.math?.unlocked || 1)), stars: Math.max(0, data.math?.stars || 0) },
          science: { levelIndex: Math.min(49, Math.max(0, data.science?.levelIndex || 0)), unlocked: Math.min(50, Math.max(1, data.science?.unlocked || 1)), stars: Math.max(0, data.science?.stars || 0) },
          logic: { levelIndex: Math.min(49, Math.max(0, data.logic?.levelIndex || 0)), unlocked: Math.min(50, Math.max(1, data.logic?.unlocked || 1)), stars: Math.max(0, data.logic?.stars || 0) },
        });
      } else if (oldMath) {
        const data = JSON.parse(oldMath);
        setProgress({ ...INITIAL_PROGRESS, math: { levelIndex: 0, unlocked: Math.min(50, Math.max(1, data.unlocked || 1)), stars: Math.max(0, data.stars || 0) } });
      }
    } catch { localStorage.removeItem("learning-adventure-progress"); }
  }, []);

  useEffect(() => { localStorage.setItem("learning-adventure-progress", JSON.stringify(progress)); }, [progress]);
  useEffect(() => () => { if (musicTimer.current) clearInterval(musicTimer.current); audioRef.current?.close(); }, []);

  function audio() {
    if (!audioRef.current) audioRef.current = new AudioContext();
    if (audioRef.current.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  }

  function tone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.08, delay = 0) {
    const ctx = audio(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime + delay); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain).connect(ctx.destination); osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + duration);
  }

  function startMusic(force = false) {
    if ((!musicOn && !force) || musicTimer.current) return;
    const notes = [261.6, 329.6, 392, 523.3]; let n = 0;
    tone(notes[0], 0.28, "triangle", 0.025);
    musicTimer.current = setInterval(() => tone(notes[n++ % notes.length], 0.3, "triangle", 0.025), 620);
  }

  function toggleMusic() {
    const next = !musicOn; setMusicOn(next);
    if (!next && musicTimer.current) { clearInterval(musicTimer.current); musicTimer.current = null; }
    else if (next && started) setTimeout(() => startMusic(true), 0);
  }

  function resetPuzzle() { setSelected(null); setWrongTries(0); setStatus("playing"); }
  function begin(nextSubject: Subject) { setSubject(nextSubject); setStarted(true); startMusic(); tone(392, 0.15, "sine", 0.08); tone(523.3, 0.25, "sine", 0.08, 0.12); }
  function switchSubject(nextSubject: Subject) { setSubject(nextSubject); setShowMap(false); resetPuzzle(); }
  function speakPraise() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); const message = new SpeechSynthesisUtterance(praise);
    message.rate = 0.9; message.pitch = 1.35; message.volume = 1; window.speechSynthesis.speak(message);
  }

  function pick(value: string, index: number) {
    if (status === "correct") return;
    setSelected(index);
    if (value === answer) {
      setStatus("correct"); const earned = wrongTries === 0 ? 3 : wrongTries === 1 ? 2 : 1;
      setProgress((previous) => ({ ...previous, [subject]: { ...previous[subject], stars: previous[subject].stars + earned, unlocked: Math.max(previous[subject].unlocked, Math.min(50, current.levelIndex + 2)) } }));
      setStreak((value) => value + 1); tone(523.3, 0.18, "sine", 0.1); tone(659.3, 0.18, "sine", 0.1, 0.12); tone(784, 0.32, "sine", 0.1, 0.24); speakPraise();
    } else {
      setStatus("wrong"); setWrongTries((value) => value + 1); setStreak(0); tone(180, 0.18, "sawtooth", 0.045);
      setTimeout(() => { setStatus("playing"); setSelected(null); }, 750);
    }
  }

  function nextLevel() {
    if (current.levelIndex === 49) { setShowMap(true); return; }
    setProgress((previous) => ({ ...previous, [subject]: { ...previous[subject], levelIndex: previous[subject].levelIndex + 1 } })); resetPuzzle();
  }

  function chooseLevel(index: number) {
    if (index + 1 > current.unlocked) return;
    setProgress((previous) => ({ ...previous, [subject]: { ...previous[subject], levelIndex: index } })); resetPuzzle(); setShowMap(false);
  }

  return (
    <main className={`game-shell ${subject}-theme`}>
      <div className="cloud cloud-one" aria-hidden="true">☁</div><div className="cloud cloud-two" aria-hidden="true">☁</div><div className="sparkles" aria-hidden="true">✦　·　✦　·　✦</div>
      <header className="topbar">
        <button className="brand" onClick={() => setShowMap(true)} aria-label="Open level map"><span className="brand-mark">{isMath ? "➕" : isLogic ? "🧩" : "🔬"}</span><span>Learning Adventure</span></button>
        <div className="subject-switch" aria-label="Choose a learning game"><button className={isMath ? "active" : ""} onClick={() => switchSubject("math")}>➕ Maths</button><button className={subject === "science" ? "active" : ""} onClick={() => switchSubject("science")}>🔬 Science</button><button className={isLogic ? "active" : ""} onClick={() => switchSubject("logic")}>🧩 Logic</button></div>
        <div className="stats"><div className="stat"><span>⭐</span><strong>{totalStars}</strong></div><div className="stat"><span>🔥</span><strong>{streak}</strong></div><button className="sound-button" onClick={toggleMusic} aria-label={musicOn ? "Turn music off" : "Turn music on"}>{musicOn ? "🔊" : "🔇"}</button></div>
      </header>
      <section className="level-strip" aria-label="Level progress"><div className="level-copy"><span className={`difficulty ${level.difficulty.toLowerCase()}`}>{level.difficulty}</span><h1>{isMath ? "Maths" : isLogic ? "Logic" : "Science"} · Level {current.levelIndex + 1}</h1></div><div className="progress-track"><span style={{ width: `${((current.levelIndex + 1) / 50) * 100}%` }} /></div><span className="progress-count">{current.levelIndex + 1} / 50</span></section>
      <section className={`play-card ${status} ${isMath ? "math-card" : isLogic ? "logic-card" : "science-card"}`} aria-live="polite">
        <div className="mascot" aria-hidden="true">{MASCOTS[Math.floor(current.levelIndex / 10)]}</div>
        <p className="instruction">{isMath ? "Connect the sum to the right answer!" : isLogic ? (level as LogicLevel).category === "Odd One Out" ? "Find the one that is different!" : "Choose what comes next!" : "Match the science question to the right answer!"}</p>
        {isMath ? <div className="equation-bubble"><span>{(level as MathLevel).a}</span><b>+</b><span>{(level as MathLevel).b}</span><b>=</b><span className="question-mark">?</span></div> : <div className={`equation-bubble ${isLogic ? "logic-prompt" : "science-prompt"}`}><span>{(level as ScienceLevel).prompt}</span></div>}
        <div className="connection-zone"><svg className="connection-lines" viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">{selected !== null && <path className={status === "correct" ? "right-line" : status === "wrong" ? "wrong-line" : ""} d={`M 500 0 C 500 100, ${125 + selected * 250} 90, ${125 + selected * 250} 220`} />}</svg><div className="trail-dot">✦</div><div className="answers">{choices.map((choice, index) => <button key={`${choice}-${index}`} className={`answer ${COLORS[index]} ${selected === index ? "selected" : ""}`} onClick={() => pick(choice, index)} disabled={status === "correct"} aria-label={`Answer ${choice}`}><span>{choice}</span><i aria-hidden="true" /></button>)}</div></div>
        <div className={`feedback ${status}`}>{status === "playing" && <><span>👆</span> Tap an answer</>}{status === "wrong" && <><span>💪</span> Nearly! Try another one.</>}{status === "correct" && <><span className="celebrate">🎉</span><div><strong>{praise}</strong><small>{isMath ? `You found ${answer}!` : isLogic ? `Great thinking — ${answer}!` : `That’s right — ${answer}!`}</small></div><button onClick={nextLevel}>{current.levelIndex === 49 ? "See my map" : "Next level"} <span>→</span></button></>}</div>
      </section>
      <button className="map-button" onClick={() => setShowMap(true)}>🗺️ {isMath ? "Maths" : isLogic ? "Logic" : "Science"} map</button>
      {!started && <div className="overlay"><div className="welcome-card"><div className="welcome-confetti" aria-hidden="true"><span>★</span><span>●</span><span>✦</span><span>▲</span><span>★</span></div><div className="welcome-mascot">🦊</div><p className="eyebrow">A special adventure for</p><h2 className="child-greeting" aria-label="Hi Hridhaan!"><small>Hi</small>{[..."Hridhaan!"].map((letter, index) => <span key={index}>{letter}</span>)}</h2><h3>What would you like to play?</h3><p>Choose a game, earn stars and unlock every level.</p><div className="welcome-choices"><button onClick={() => begin("math")}>➕ Maths <span>→</span></button><button className="science-start" onClick={() => begin("science")}>🔬 Science <span>→</span></button><button className="logic-start" onClick={() => begin("logic")}>🧩 Logic <span>→</span></button></div></div></div>}
      {showMap && <div className="overlay map-overlay" role="dialog" aria-modal="true" aria-label="Level map"><div className="map-card"><button className="close" onClick={() => setShowMap(false)} aria-label="Close level map">×</button><p className="eyebrow">Your {isMath ? "maths" : isLogic ? "logic" : "science"} adventure</p><h2>{isMath ? "Maths" : isLogic ? "Logic" : "Science"} map</h2><p>{current.unlocked === 50 ? "Every level is unlocked — superstar!" : `${current.unlocked} of 50 levels unlocked`}</p><div className="level-grid">{levels.map((_, index) => { const isUnlocked = index + 1 <= current.unlocked; return <button key={index} disabled={!isUnlocked} onClick={() => chooseLevel(index)} className={`${isUnlocked ? "unlocked" : "locked"} ${index === current.levelIndex ? "current" : ""}`} aria-label={`Level ${index + 1}${isUnlocked ? "" : ", locked"}`}>{isUnlocked ? index + 1 : "🔒"}</button>; })}</div></div></div>}
    </main>
  );
}
