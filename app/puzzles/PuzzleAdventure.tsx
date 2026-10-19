"use client";

import { useEffect, useRef, useState } from "react";
import { playTone } from "../audio";
import { speak, stopSpeaking } from "../speech";
import {
  FAMILIES, FOX_NAMES, GAME_LENGTH, MAX_LEVEL, STICKERS, cleanName, emptySave, finishGame, generatePuzzle, levelFor, makeRng, planGame,
  readPuzzleSave, recordResult, solveMaze, starsFor, walk,
} from "./model";
import type { ChoicePuzzle, Display, Family, MazePuzzle, Move, OrderPuzzle, Puzzle, PuzzleSave, Token, Turn } from "./model";

const SAVE_KEY = "puzzle-adventure-v1";
const PRAISE: Record<Family, string[]> = {
  patterns: ["You spotted the pattern!", "Pattern master!", "You cracked the pattern!"],
  odd: ["Great detective work!", "You found the odd one!", "Sharp eyes!"],
  count: ["Super counting!", "You counted every one!", "Counting champion!"],
  sums: ["Brilliant adding!", "You worked it out!", "Number star!"],
  analogy: ["You found the pair!", "Clever thinking!", "Perfect match!"],
  order: ["Everything is in order!", "Great ordering!", "Step by step — well done!"],
  maze: ["The fox got the berries!", "Great path finding!", "Yummy berries — well done!"],
  shadow: ["Shadow detective!", "You matched the shape!", "Great looking!"],
  mirror: ["Mirror magic!", "You flipped it in your head!", "Super spotting!"],
  position: ["You found it!", "Great hide and seek!", "You know your directions!"],
  balance: ["Balance boss!", "You read the scale!", "Heavy thinking — well done!"],
  sudoku: ["Sudoku star!", "Every row works!", "You solved the grid!"],
};
const TURN_STYLE: Record<Turn, string> = { flipX: "scaleX(-1)", flipY: "scaleY(-1)", rot90: "rotate(90deg)", rot180: "rotate(180deg)" };
const SHAPE_COLORS: Record<string, string> = { red: "#ef4444", blue: "#3b82f6", green: "#22a55a", yellow: "#f5b90b", purple: "#9b5cf6" };
const ARROW: Record<Move, string> = { up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️" };

type Screen = "map" | "play" | "reward" | "book";
type Game = { choice: Family | "gym"; families: Family[]; index: number; stars: number[]; boss: boolean };

export default function PuzzleAdventure({ soundOn }: { soundOn: boolean }) {
  const [save, setSave] = useState<PuzzleSave>(emptySave);
  const [screen, setScreen] = useState<Screen>("map");
  const [game, setGame] = useState<Game | null>(null);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [misses, setMisses] = useState(0);
  const [solved, setSolved] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [sticker, setSticker] = useState<string | null>(null);
  const [gamesThisVisit, setGamesThisVisit] = useState(0);
  const [naming, setNaming] = useState(false);
  const readyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Read browser progress after hydration so server and client first render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setSave(readPuzzleSave(localStorage.getItem(SAVE_KEY))); } catch { /* storage blocked */ }
    return () => { stopSpeaking(); if (readyTimer.current) clearTimeout(readyTimer.current); };
  }, []);

  function persist(next: PuzzleSave) {
    setSave(next);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
  }

  function tone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.08, delay = 0) {
    if (soundOn) playTone(frequency, duration, type, volume, delay);
  }
  const say = (text: string, onEnd?: () => void) => { if (soundOn) speak(text, { onEnd }); else onEnd?.(); };

  function loadPuzzle(families: Family[], index: number, from: PuzzleSave, island: boolean): boolean {
    const family = families[index];
    const { level, boss } = levelFor(from, family, index, island, Math.random());
    const raw = generatePuzzle(family, level, Math.floor(Math.random() * 2 ** 31));
    const named = (text: string) => (from.foxName ? text.replace(/the fox/gi, from.foxName) : text);
    const next = { ...raw, prompt: named(raw.prompt), explain: named(raw.explain) } as Puzzle;
    setPuzzle(next);
    setPuzzleKey((k) => k + 1);
    setMisses(0); setSolved(false); setReady(false); setMessage("");
    // "Think first": answers wake up after the question is read (or 1.5 s when sound is off).
    if (readyTimer.current) clearTimeout(readyTimer.current);
    readyTimer.current = setTimeout(() => setReady(true), soundOn ? 4500 : 1500);
    // Only speech ends the wait early; with sound off the full 1.5 s pause applies.
    if (soundOn) speak(`${boss ? "Boss puzzle! " : ""}${next.prompt}`, { onEnd: () => { if (readyTimer.current) clearTimeout(readyTimer.current); readyTimer.current = setTimeout(() => setReady(true), 250); } });
    return boss;
  }

  function startGame(choice: Family | "gym") {
    const families = planGame(choice, makeRng(Math.floor(Math.random() * 2 ** 31)));
    setScreen("play");
    tone(392, 0.15); tone(523.3, 0.25, "sine", 0.08, 0.12);
    const boss = loadPuzzle(families, 0, save, choice !== "gym");
    setGame({ choice, families, index: 0, stars: [], boss });
  }

  function miss() {
    if (solved || !puzzle) return;
    const count = misses + 1;
    setMisses(count);
    tone(190, 0.18, "triangle", 0.06);
    if (count >= 2) { setMessage(puzzle.explain); say(`Let's look together. ${puzzle.explain}`); }
    else { setMessage("Nearly! Look again."); say("Nearly! Look again."); }
  }

  function solve() {
    if (solved || !puzzle || !game) return;
    setSolved(true);
    const praise = (game.boss ? "You beat the boss puzzle! " : "") + PRAISE[puzzle.family][Math.floor(Math.random() * 3)].replace("The fox", save.foxName || "The fox");
    setMessage(praise);
    tone(523.3, 0.18, "sine", 0.1); tone(659.3, 0.18, "sine", 0.1, 0.12); tone(784, 0.32, "sine", 0.1, 0.24);
    say(praise);
    persist(recordResult(save, puzzle.family, misses));
    setGame({ ...game, stars: [...game.stars, starsFor(misses)] });
  }

  function next() {
    if (!game) return;
    if (game.index + 1 < GAME_LENGTH) {
      const boss = loadPuzzle(game.families, game.index + 1, save, game.choice !== "gym");
      setGame({ ...game, index: game.index + 1, boss });
      return;
    }
    const today = new Date().toLocaleDateString("en-CA");
    const result = finishGame(save, today, makeRng(Math.floor(Math.random() * 2 ** 31)), game.choice === "gym");
    persist(result.save);
    setSticker(result.sticker);
    setGamesThisVisit((n) => n + 1);
    setScreen("reward");
    stopSpeaking();
    tone(523.3, 0.2); tone(659.3, 0.2, "sine", 0.08, 0.15); tone(784, 0.2, "sine", 0.08, 0.3); tone(1046.5, 0.4, "sine", 0.08, 0.45);
    say(result.sticker ? "You finished! Here is a new sticker for your book!" : "You finished! Your sticker book is full — amazing!");
  }

  function toMap() { stopSpeaking(); setScreen("map"); setGame(null); setPuzzle(null); }

  if (screen === "book") return <StickerBook save={save} onBack={() => setScreen("map")} />;

  if (screen === "reward" && game) {
    const earned = game.stars.reduce((a, b) => a + b, 0);
    return <section className="pz-shell pz-reward" aria-live="polite">
      <p className="pz-eyebrow">Game complete!</p>
      {sticker ? <div className="pz-sticker-pop" aria-label={`New sticker ${sticker}`}>{sticker}</div> : <div className="pz-sticker-pop">🏆</div>}
      <h2>{sticker ? "New sticker!" : "Your sticker book is full!"}</h2>
      <p className="pz-reward-stars" aria-label={`${earned} stars`}>{game.stars.map((s, i) => <span key={i}>{"⭐".repeat(s)}{"☆".repeat(3 - s)}</span>)}</p>
      {gamesThisVisit >= 3 && <p className="pz-break">🦊 {save.foxName || "The fox"} is getting sleepy! Time for a break — show Mum or Dad your sticker book.</p>}
      <div className="pz-actions">
        <button className="pz-big" onClick={() => startGame(game.choice)}>🔁 Play again</button>
        <button className="pz-big pz-secondary" onClick={toMap}>🗺️ Map</button>
        <button className="pz-big pz-secondary" onClick={() => setScreen("book")}>📒 Sticker book</button>
      </div>
    </section>;
  }

  if (screen === "play" && game && puzzle) {
    const info = FAMILIES.find((f) => f.id === puzzle.family)!;
    return <section className={`pz-shell pz-play pz-fam-${puzzle.family}`}>
      <div className="pz-playbar">
        <button className="pz-icon-button" onClick={toMap} aria-label="Back to the map">🗺️</button>
        <div className="pz-dots" aria-label={`Puzzle ${game.index + 1} of ${GAME_LENGTH}`}>
          {Array.from({ length: GAME_LENGTH }, (_, i) => <span key={i} className={`${i < game.index || (i === game.index && solved) ? "done" : i === game.index ? "now" : ""} ${game.choice !== "gym" && i === GAME_LENGTH - 1 ? "boss" : ""}`} />)}
        </div>
        <button className="pz-icon-button" onClick={() => say(puzzle.prompt)} aria-label="Hear the question again">🔊</button>
      </div>
      <div className="pz-card" key={puzzleKey}>
        <p className="pz-island">{info.icon} {info.title}{game.boss && <b className="pz-boss-tag">👑 Boss puzzle!</b>}</p>
        <h2 className="pz-prompt">{puzzle.prompt}</h2>
        {puzzle.interaction === "choice" && <ChoiceView puzzle={puzzle} ready={ready} help={misses >= 2} solved={solved} onMiss={miss} onSolve={solve} />}
        {puzzle.interaction === "order" && <OrderView puzzle={puzzle} ready={ready} help={misses >= 2} onMiss={miss} onSolve={solve} />}
        {puzzle.interaction === "maze" && <MazeView puzzle={puzzle} ready={ready} help={misses >= 2} onMiss={miss} onSolve={solve} onStep={() => tone(660, 0.06, "sine", 0.04)} />}
        <div className={`pz-feedback ${solved ? "good" : misses >= 2 ? "help" : misses ? "try" : ""}`} role="status">
          {solved ? <><span className="pz-bounce">🎉</span><strong>{message}</strong><span className="pz-earned">{"⭐".repeat(starsFor(misses))}</span><button className="pz-big" onClick={next} autoFocus>{game.index + 1 < GAME_LENGTH ? "Next ➜" : "Finish 🏁"}</button></>
            : message ? <><span>{misses >= 2 ? "💡" : "💪"}</span><span>{message}</span></>
            : !ready ? <><span>👂</span><span>Listen…</span></> : <><span>👆</span><span>Your turn!</span></>}
        </div>
      </div>
    </section>;
  }

  const today = new Date().toLocaleDateString("en-CA");
  return <section className="pz-shell pz-map">
    {naming && <FoxNamer current={save.foxName} onDone={(name) => { setNaming(false); if (name) { persist({ ...save, foxName: name }); say(`Hello! My name is ${name}!`); } }} />}
    <div className="pz-map-head">
      <div><p className="pz-eyebrow">🦊 Puzzle Adventure</p><h2>Where shall we go today?</h2></div>
      <button className="pz-fox-button" onClick={() => setNaming(true)} aria-label={save.foxName ? `Your fox is called ${save.foxName}. Change name` : "Give your fox a name"}>
        <span className="pz-fox-face">🦊</span>{save.foxName ? <b>{save.foxName}</b> : <b className="pz-fox-ask">Name me!</b>}
      </button>
      <button className="pz-book-button" onClick={() => setScreen("book")}>📒 Stickers <b>{save.stickers.length}</b></button>
    </div>
    <button className="pz-gym" onClick={() => startGame("gym")}>
      <span className="pz-gym-icon">🏋️</span>
      <span><strong>Brain Gym</strong><small>5 mixed puzzles · one a day keeps your brain strong!</small></span>
      <span className="pz-streak" aria-label={`${save.gym.streak} day streak`}>🔥 {save.gym.streak}{save.gym.last === today ? " ✓" : ""}</span>
    </button>
    <div className="pz-islands">
      {FAMILIES.map((f) => <button key={f.id} className={`pz-island-card pz-isle-${f.id}`} onClick={() => startGame(f.id)}>
        <span className="pz-island-icon">{f.icon}</span>
        <strong>{f.title}</strong>
        <span className="pz-level" aria-label={`Level ${save.levels[f.id]} of ${MAX_LEVEL}`}>{Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < save.levels[f.id] ? "on" : ""} />)}</span>
      </button>)}
    </div>
  </section>;
}

// ---------- token pictures ----------
function TokenView({ token, size = 1 }: { token: Token; size?: number }) {
  if (token.kind === "emoji") return <span className={`pz-emoji ${token.shadow ? "pz-silhouette" : ""}`} style={{ fontSize: `${(token.scale ?? 1) * size}em`, transform: token.turn ? TURN_STYLE[token.turn] : undefined }}
    aria-label={`${token.shadow ? "shadow of " : ""}${token.name ?? ""}${token.turn ? ` (${token.turn === "flipX" ? "facing the other way" : token.turn === "flipY" ? "upside down" : "turned"})` : ""}`}>{token.glyph}</span>;
  if (token.kind === "row") return <span className="pz-token-row">{token.items.map((t, i) => <TokenView key={i} token={t} size={size * 0.8} />)}</span>;
  if (token.kind === "number") return <span className="pz-number">{token.value}</span>;
  if (token.kind === "group") return <span className={`pz-group n${Math.min(token.count, 9)}`} aria-label={`${token.count}`}>{Array.from({ length: token.count }, (_, i) => <span key={i}>{token.glyph}</span>)}</span>;
  const fill = SHAPE_COLORS[token.color];
  return <svg className="pz-shape" viewBox="0 0 40 40" role="img" aria-label={`${token.color} ${token.shape}`} style={{ width: `${size * 1.1}em`, height: `${size * 1.1}em` }}>
    {token.shape === "circle" && <circle cx="20" cy="20" r="16" fill={fill} />}
    {token.shape === "square" && <rect x="5" y="5" width="30" height="30" rx="4" fill={fill} />}
    {token.shape === "triangle" && <polygon points="20,4 37,35 3,35" fill={fill} />}
    {token.shape === "star" && <polygon points="20,3 25,15 38,15 28,23 32,36 20,28 8,36 12,23 2,15 15,15" fill={fill} />}
    {token.shape === "heart" && <path d="M20 35 C6 25 2 17 6 10 C10 4 17 5 20 11 C23 5 30 4 34 10 C38 17 34 25 20 35 Z" fill={fill} />}
  </svg>;
}

// ---------- tap-an-answer puzzles ----------
function ChoiceView({ puzzle, ready, help, solved, onMiss, onSolve }: { puzzle: ChoicePuzzle; ready: boolean; help: boolean; solved: boolean; onMiss: () => void; onSolve: () => void }) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const d = puzzle.display;
  function choose(index: number) {
    if (!ready || solved || wrong.includes(index)) return;
    if (index === puzzle.answer) onSolve();
    else { setWrong((w) => [...w, index]); setShake(index); setTimeout(() => setShake(null), 450); onMiss(); }
  }
  useEffect(() => {
    if (!ready || solved) return;
    const onKey = (event: KeyboardEvent) => { const n = Number(event.key); if (n >= 1 && n <= puzzle.options.length) choose(n - 1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return <>
    {d.type !== "none" && <div className="pz-display">
      {d.type === "row" && <div className="pz-row">{d.items.map((t, i) => t ? <span key={i} className="pz-tile"><TokenView token={t} /></span> : <span key={i} className={`pz-tile pz-gap ${solved ? "filled" : ""}`}>{solved ? <TokenView token={puzzle.options[puzzle.answer]} /> : "?"}</span>)}</div>}
      {d.type === "analogy" && <div className="pz-analogy">
        <span className="pz-pair"><span className="pz-tile"><TokenView token={d.a} /></span><b>➜</b><span className="pz-tile"><TokenView token={d.b} /></span></span>
        <span className="pz-pair"><span className="pz-tile"><TokenView token={d.c} /></span><b>➜</b><span className={`pz-tile pz-gap ${solved ? "filled" : ""}`}>{solved ? <TokenView token={puzzle.options[puzzle.answer]} /> : "?"}</span></span>
      </div>}
      {d.type === "scene" && <CountScene key={puzzle.prompt + d.items.length} target={d.target} items={d.items} />}
      {d.type === "sum" && <SumPicture left={d.left} right={d.right} total={d.total} glyph={d.glyph} solved={solved} answer={puzzle.options[puzzle.answer]} />}
      {d.type === "single" && <div className={`pz-single ${d.label === "shadow" ? "pz-wall" : ""}`}>{d.label === "🪞" && <span className="pz-mirror-tag">🪞 mirror</span>}<TokenView token={d.token} size={1.4} /></div>}
      {d.type === "scales" && <div className="pz-scales">{d.scales.map((sc, i) => <Scale key={i} {...sc} />)}</div>}
      {d.type === "grid" && <GridPicture display={d} solvedToken={solved ? puzzle.options[puzzle.answer] : null} />}
    </div>}
    <div className={`pz-options n${puzzle.options.length} ${ready ? "awake" : "sleepy"}`}>
      {puzzle.options.map((option, i) => <button key={i} onClick={() => choose(i)} disabled={!ready || wrong.includes(i)}
        className={`pz-option ${wrong.includes(i) ? "wrong" : ""} ${shake === i ? "shake" : ""} ${help && i === puzzle.answer && !solved ? "glow" : ""} ${solved && i === puzzle.answer ? "right" : ""}`}
        aria-label={`Answer ${i + 1}`}><TokenView token={option} size={1} /></button>)}
    </div>
  </>;
}

function CountScene({ target, items }: { target: Token; items: { token: Token; x: number; y: number }[] }) {
  const [counted, setCounted] = useState<number[]>([]);
  const glyph = target.kind === "emoji" ? target.glyph : "";
  return <div className="pz-scene-wrap">
    <p className="pz-hint">Tap each <TokenView token={target} /> to count it {counted.length > 0 && <b className="pz-count-badge">{counted.length}</b>}</p>
    <div className="pz-scene">
      {items.map((item, i) => {
        const isTarget = item.token.kind === "emoji" && item.token.glyph === glyph;
        const order = counted.indexOf(i);
        return <button key={i} className={`pz-scene-item ${order >= 0 ? "counted" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }}
          onClick={() => { if (isTarget && order < 0) setCounted((c) => [...c, i]); else if (order >= 0) setCounted((c) => c.filter((x) => x !== i)); }}
          aria-label={isTarget ? (order >= 0 ? `counted ${order + 1}` : "count me") : "not this one"}>
          <TokenView token={item.token} />{order >= 0 && <i>{order + 1}</i>}
        </button>;
      })}
    </div>
  </div>;
}

function SumPicture({ left, right, total, glyph, solved, answer }: { left: number; right: number | null; total: number | null; glyph: string; solved: boolean; answer: Token }) {
  const group = (n: number, cls = "") => <span className={`pz-sum-group ${cls}`}>{Array.from({ length: n }, (_, i) => <span key={i}>{glyph}</span>)}</span>;
  if (right === null && total !== null) {
    // Missing number: show the whole as a frame, with the known part filled.
    return <div className="pz-sum">
      <div className="pz-sum-line"><b>{left}</b><span>+</span><b className={solved ? "" : "pz-q"}>{solved && answer.kind === "number" ? answer.value : "?"}</b><span>=</span><b>{total}</b></div>
      <span className="pz-frame">{Array.from({ length: total }, (_, i) => <span key={i} className={i < left ? "full" : solved ? "full new" : "empty"}>{i < left || solved ? glyph : ""}</span>)}</span>
    </div>;
  }
  return <div className="pz-sum">
    <div className="pz-sum-pictures">{group(left)}<span className="pz-plus">+</span>{group(right ?? 0, "second")}</div>
    <div className="pz-sum-line"><b>{left}</b><span>+</span><b>{right}</b><span>=</span><b className={solved ? "" : "pz-q"}>{solved && answer.kind === "number" ? answer.value : "?"}</b></div>
  </div>;
}

function Scale({ left, right, tilt }: { left: Token[]; right: Token[]; tilt: -1 | 0 | 1 }) {
  // tilt -1 = left side down (left heavier); the beam rotates around its middle.
  const angle = tilt * 9;
  return <div className="pz-scale" aria-label={tilt === 0 ? "the scale is level" : tilt === -1 ? "the left side is lower" : "the right side is lower"}>
    <div className="pz-beam" style={{ transform: `rotate(${angle}deg)` }}>
      <div className="pz-pan left" style={{ transform: `rotate(${-angle}deg)` }}><div className="pz-pan-items">{left.map((t, i) => <TokenView key={i} token={t} size={left.length > 2 ? 0.55 : 0.75} />)}</div><i /></div>
      <div className="pz-pan right" style={{ transform: `rotate(${-angle}deg)` }}><div className="pz-pan-items">{right.map((t, i) => <TokenView key={i} token={t} size={right.length > 2 ? 0.55 : 0.75} />)}</div><i /></div>
    </div>
    <div className="pz-stand" />
  </div>;
}

function GridPicture({ display, solvedToken }: { display: Extract<Display, { type: "grid" }>; solvedToken: Token | null }) {
  return <div className="pz-grid" style={{ gridTemplateColumns: `repeat(${display.size}, 1fr)` }}>
    {display.cells.map((cell, i) => <span key={i} className={`pz-grid-cell ${cell === "?" ? (solvedToken ? "pz-gap filled" : "pz-gap") : cell ? "" : "blank"}`}>
      {cell === "?" ? (solvedToken ? <TokenView token={solvedToken} size={1} /> : "?") : cell ? <TokenView token={cell} size={1} /> : ""}
    </span>)}
  </div>;
}

// ---------- put-in-order puzzles ----------
function OrderView({ puzzle, ready, help, onMiss, onSolve }: { puzzle: OrderPuzzle; ready: boolean; help: boolean; onMiss: () => void; onSolve: () => void }) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const done = placed.length === puzzle.cards.length;
  function tap(i: number) {
    if (!ready || done || placed.includes(i)) return;
    if (puzzle.order[i] === placed.length) {
      const next = [...placed, i];
      setPlaced(next);
      if (next.length === puzzle.cards.length) onSolve();
    } else { setShake(i); setTimeout(() => setShake(null), 450); onMiss(); }
  }
  return <>
    <div className="pz-slots">
      {puzzle.cards.map((_, slot) => <span key={slot} className={`pz-slot ${placed[slot] !== undefined ? "full" : ""}`}>
        <small>{slot + 1}</small>{placed[slot] !== undefined && <TokenView token={puzzle.cards[placed[slot]]} />}
      </span>)}
    </div>
    <div className={`pz-options n${puzzle.cards.length} ${ready ? "awake" : "sleepy"}`}>
      {puzzle.cards.map((card, i) => <button key={i} disabled={!ready || placed.includes(i)} onClick={() => tap(i)}
        className={`pz-option ${placed.includes(i) ? "used" : ""} ${shake === i ? "shake" : ""} ${help && !done && puzzle.order[i] === placed.length ? "glow" : ""}`}
        aria-label={`Card ${i + 1}`}><TokenView token={card} /></button>)}
    </div>
  </>;
}

// ---------- maze ----------
function MazeView({ puzzle, ready, help, onMiss, onSolve, onStep }: { puzzle: MazePuzzle; ready: boolean; help: boolean; onMiss: () => void; onSolve: () => void; onStep: () => void }) {
  const [fox, setFox] = useState<[number, number]>(puzzle.start);
  const [trail, setTrail] = useState<string[]>([]);
  const [program, setProgram] = useState<Move[]>([]);
  const [running, setRunning] = useState(false);
  const [bump, setBump] = useState(false);
  const [won, setWon] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const rocks = new Set(puzzle.rocks.map(([r, c]) => `${r},${c}`));
  const solutionCells = new Set(help ? walk(puzzle, solveMaze(puzzle)).path.map(([r, c]) => `${r},${c}`) : []);
  const maxProgram = Math.max(10, solveMaze(puzzle).length + 4);

  function wobble() { setBump(true); setTimeout(() => setBump(false), 450); }

  function stepDirect(move: Move) {
    if (!ready || won) return;
    const result = walk({ ...puzzle, start: fox }, [move]);
    if (result.bumped) { wobble(); onMiss(); return; }
    const pos = result.path[result.path.length - 1];
    setTrail((t) => [...t, `${fox[0]},${fox[1]}`]);
    setFox(pos); onStep();
    if (result.reached) { setWon(true); onSolve(); }
  }

  function run() {
    if (!ready || running || won || !program.length) return;
    const result = walk(puzzle, program);
    setRunning(true); setFox(puzzle.start); setTrail([]);
    let step = 1;
    timer.current = setInterval(() => {
      if (step < result.path.length) {
        const pos = result.path[step];
        setTrail(result.path.slice(0, step).map(([r, c]) => `${r},${c}`));
        setFox(pos); onStep(); step++;
        return;
      }
      if (timer.current) clearInterval(timer.current);
      if (result.reached) { setWon(true); setRunning(false); onSolve(); return; }
      wobble(); onMiss();
      setTimeout(() => { setFox(puzzle.start); setTrail([]); setRunning(false); }, 700);
    }, 420);
  }

  return <div className="pz-maze-wrap">
    <div className="pz-maze" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }} role="grid" aria-label="Maze">
      {Array.from({ length: puzzle.size * puzzle.size }, (_, i) => {
        const r = Math.floor(i / puzzle.size), c = i % puzzle.size, key = `${r},${c}`;
        const isFox = fox[0] === r && fox[1] === c;
        const isGoal = puzzle.goal[0] === r && puzzle.goal[1] === c;
        return <span key={key} role="gridcell" className={`pz-cell ${rocks.has(key) ? "rock" : ""} ${trail.includes(key) ? "trail" : ""} ${solutionCells.has(key) ? "hint" : ""}`}>
          {rocks.has(key) ? "🪨" : isFox ? <span className={`pz-fox ${bump ? "bump" : ""} ${won ? "happy" : ""}`}>🦊{won && <small>🍓</small>}</span> : isGoal ? "🍓" : ""}
        </span>;
      })}
    </div>
    {puzzle.program && <div className="pz-program" aria-label="Your plan">
      {program.length ? program.map((m, i) => <span key={i}>{ARROW[m]}</span>) : <em>Tap arrows to plan the path</em>}
    </div>}
    <div className={`pz-arrows ${ready ? "awake" : "sleepy"}`}>
      <button onClick={() => puzzle.program ? setProgram((p) => p.length < maxProgram ? [...p, "up"] : p) : stepDirect("up")} disabled={!ready || running || won} aria-label="Up" className="up">⬆️</button>
      <button onClick={() => puzzle.program ? setProgram((p) => p.length < maxProgram ? [...p, "left"] : p) : stepDirect("left")} disabled={!ready || running || won} aria-label="Left" className="left">⬅️</button>
      <button onClick={() => puzzle.program ? setProgram((p) => p.length < maxProgram ? [...p, "down"] : p) : stepDirect("down")} disabled={!ready || running || won} aria-label="Down" className="down">⬇️</button>
      <button onClick={() => puzzle.program ? setProgram((p) => p.length < maxProgram ? [...p, "right"] : p) : stepDirect("right")} disabled={!ready || running || won} aria-label="Right" className="right">➡️</button>
    </div>
    {puzzle.program && <div className="pz-actions">
      <button className="pz-big pz-secondary" onClick={() => setProgram((p) => p.slice(0, -1))} disabled={running || won || !program.length}>⌫ Undo</button>
      <button className="pz-big pz-go" onClick={run} disabled={!ready || running || won || !program.length}>▶ Go!</button>
    </div>}
  </div>;
}

// ---------- name the fox ----------
function FoxNamer({ current, onDone }: { current: string; onDone: (name: string) => void }) {
  const [typed, setTyped] = useState("");
  return <div className="overlay" role="dialog" aria-modal="true" aria-label="Name your fox">
    <div className="pz-namer">
      <div className="pz-namer-fox">🦊</div>
      <h2>What shall we call me?</h2>
      <div className="pz-name-choices">{FOX_NAMES.map((n) => <button key={n} className={n === current ? "on" : ""} onClick={() => onDone(n)}>{n}</button>)}</div>
      <form onSubmit={(e) => { e.preventDefault(); onDone(cleanName(typed)); }} className="pz-name-form">
        <label>Grown-ups can type a name <input value={typed} maxLength={12} onChange={(e) => setTyped(e.target.value)} placeholder="e.g. Laddoo" /></label>
        <button disabled={!cleanName(typed)}>Save</button>
      </form>
      <button className="pz-big pz-secondary" onClick={() => onDone("")}>Close</button>
    </div>
  </div>;
}

/** Press and hold for 2 seconds — easy for grown-ups, not something a 5-year-old taps by accident. */
function HoldToOpen({ onOpen }: { onOpen: () => void }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = () => { setHolding(true); timer.current = setTimeout(() => { setHolding(false); onOpen(); }, 2000); };
  const stop = () => { setHolding(false); if (timer.current) clearTimeout(timer.current); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <button className={`pz-hold ${holding ? "holding" : ""}`} onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onContextMenu={(e) => e.preventDefault()}
    onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) start(); }} onKeyUp={stop}>
    <span className="pz-hold-fill" />🔒 For grown-ups — press and hold
  </button>;
}

// ---------- sticker book + grown-up notes ----------
function StickerBook({ save, onBack }: { save: PuzzleSave; onBack: () => void }) {
  const [grownUp, setGrownUp] = useState(false);
  return <section className="pz-shell pz-book">
    <div className="pz-map-head">
      <div><p className="pz-eyebrow">📒 My sticker book</p><h2>{save.stickers.length} of {STICKERS.length} stickers</h2></div>
      <button className="pz-book-button" onClick={onBack}>🗺️ Map</button>
    </div>
    <div className="pz-stickers">{STICKERS.map((s) => <span key={s} className={save.stickers.includes(s) ? "have" : ""}>{save.stickers.includes(s) ? s : "?"}</span>)}</div>
    {!grownUp && <HoldToOpen onOpen={() => setGrownUp(true)} />}
    {grownUp && <details className="pz-grownups" open>
      <summary>For grown-ups</summary>
      <p>Each island adapts: three first-try answers in a row move up a level; two misses on one puzzle move down a level. About 1 in 5 puzzles is a little easier and 1 in 10 a little harder, so it stays “just a bit hard”. Games played: {save.games}. Brain Gym streak: {save.gym.streak} day{save.gym.streak === 1 ? "" : "s"}.</p>
      <table><thead><tr><th>Island</th><th>Skill</th><th>Level</th><th>Played</th><th>First try</th></tr></thead><tbody>
        {FAMILIES.map((f) => { const s = save.stats[f.id]; return <tr key={f.id}><td>{f.icon} {f.title}</td><td>{f.skill}</td><td>{save.levels[f.id]} / {MAX_LEVEL}</td><td>{s.played}</td><td>{s.played ? `${Math.round((s.firstTry / s.played) * 100)}%` : "—"}</td></tr>; })}
      </tbody></table>
      <p>Ask “How did you know?” after a puzzle. Explaining the answer out loud is where most of the learning happens.</p>
      <p>The last puzzle of every island game is a 👑 boss puzzle, one level harder than usual. Brain Gym mixes five islands and has no boss.</p>
    </details>}
  </section>;
}
