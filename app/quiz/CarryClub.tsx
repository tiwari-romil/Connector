"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { playCheer, playFanfare, playPowerUp, playStart, playStep, playWrong } from "../audio";
import HoldToOpen from "../HoldToOpen";
import { GAME_LENGTH, MAX_LEVEL, pickLevel, starsFor } from "../puzzles/model";
import SkillReward, { LevelDots, RankBadge, RankProgress } from "../SkillReward";
import { speak, stopSpeaking, type Exclaim } from "../speech";
import { emptyTrack, rankFor, readTrack, recordTrack, type Track } from "../tracks";
import { CARRY_RANKS, PLACE_NAMES, carryColumns, carryLevelAbout, carryProblem } from "./carry";

const SAVE_KEY = "carry-club-v1";
const PRAISE = ["You carried it perfectly!", "Super adding!", "Column champion!", "You did every column!"];
const TEN_MAKE = ["Ten ones make one ten.", "Ten tens make one hundred.", "Ten hundreds make one thousand."];

type Game = { index: number; stars: number[]; starsBefore: number; a: number; b: number; level: number };
type Result = { misses: number; praise: string; levelUp: boolean };

function newSum(track: Track) {
  const level = pickLevel(track.level, Math.random());
  return { level, ...carryProblem(level, Math.floor(Math.random() * 2 ** 31)) };
}

export default function CarryClub({ soundOn }: { soundOn: boolean }) {
  const [track, setTrack] = useState<Track>(emptyTrack);
  const [screen, setScreen] = useState<"start" | "play" | "reward">("start");
  const [game, setGame] = useState<Game | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [gamesThisVisit, setGamesThisVisit] = useState(0);
  // Keys each round, so a new round always starts fresh.
  const [gamesStarted, setGamesStarted] = useState(0);
  const [grownUp, setGrownUp] = useState(false);

  useEffect(() => {
    // Read browser progress after hydration so server and client first render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setTrack(readTrack(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null"))); } catch { /* storage blocked or damaged */ }
    return () => stopSpeaking();
  }, []);

  function persist(next: Track) {
    setTrack(next);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
  }

  function start() {
    stopSpeaking();
    if (soundOn) { playStart(); }
    setResult(null);
    setGamesStarted((n) => n + 1);
    setGame({ index: 0, stars: [], starsBefore: track.stars, ...newSum(track) });
    setScreen("play");
  }

  function sumDone(misses: number) {
    if (!game || result) return;
    const next = recordTrack(track, misses);
    persist(next);
    const praise = misses >= 2 ? "You worked it out! Well done!" : PRAISE[Math.floor(Math.random() * PRAISE.length)];
    const levelUp = next.level > track.level;
    setResult({ misses, praise, levelUp });
    if (soundOn) { playCheer(); speak(`${game.a} plus ${game.b} is ${game.a + game.b}! ${praise}${levelUp ? " Level up!" : ""}`, { pitch: 1.3, exclaim: "cheer" }); }
    setGame({ ...game, stars: [...game.stars, starsFor(misses)] });
  }

  function next() {
    if (!game) return;
    if (game.index + 1 < GAME_LENGTH) {
      setResult(null);
      setGame({ ...game, index: game.index + 1, ...newSum(track) });
      return;
    }
    setGamesThisVisit((n) => n + 1);
    setScreen("reward");
    const after = rankFor(CARRY_RANKS, track.stars);
    if (soundOn) {
      playFanfare();
      speak(after.index > rankFor(CARRY_RANKS, game.starsBefore).index ? `New rank! You are now a ${after.rank.title}!` : "You finished! Great adding!", { exclaim: "cheer" });
    }
  }

  function toStart() { stopSpeaking(); setScreen("start"); setGame(null); setResult(null); }

  if (screen === "reward" && game) {
    return <SkillReward title="➕ Carry Club" stars={game.stars} ladder={CARRY_RANKS} starsBefore={game.starsBefore} starsAfter={track.stars}
      gamesThisVisit={gamesThisVisit} onAgain={start} onBack={toStart} backLabel="➕ Carry Club" />;
  }

  if (screen === "play" && game) {
    return <section className="pz-shell cc-play">
      <div className="pz-playbar">
        <button className="pz-icon-button" onClick={toStart} aria-label="Back to Carry Club">➕</button>
        <div className="pz-dots" aria-label={`Sum ${game.index + 1} of ${GAME_LENGTH}`}>
          {Array.from({ length: GAME_LENGTH }, (_, i) => <span key={i} className={i < game.index || (i === game.index && result) ? "done" : i === game.index ? "now" : ""} />)}
        </div>
        <RankBadge ladder={CARRY_RANKS} stars={track.stars} />
      </div>
      <div className="pz-card" key={`${gamesStarted}-${game.index}`}>
        <p className="pz-island">➕ Carry Club · Level {game.level}</p>
        <CarrySum a={game.a} b={game.b} soundOn={soundOn} onDone={sumDone} />
        {result && <div className="pz-feedback good" role="status">
          <span className="pz-bounce">🎉</span><strong>{result.praise}{result.levelUp && <b className="mm-level-up"> ⬆️ Level up!</b>}</strong>
          <span className="pz-earned">{"⭐".repeat(starsFor(result.misses))}</span>
          <button className="pz-big" onClick={next} autoFocus>{game.index + 1 < GAME_LENGTH ? "Next ➜" : "Finish 🏁"}</button>
        </div>}
      </div>
    </section>;
  }

  const { rank } = rankFor(CARRY_RANKS, track.stars);
  return <section className="pz-shell cc-start">
    <div className="cc-hero">
      <p className="pz-eyebrow">➕ Carry Club</p>
      <h2>Add big numbers, one column at a time!</h2>
      <div className="rk-badge big"><span>{rank.icon}</span></div>
      <p className="cc-rank"><b>{rank.title}</b> · ⭐ {track.stars} stars</p>
      <RankProgress ladder={CARRY_RANKS} stars={track.stars} />
      <LevelDots level={track.level} />
      <button className="pz-big" onClick={start}>▶ Start 5 sums</button>
    </div>
    {!grownUp && <HoldToOpen onOpen={() => setGrownUp(true)} />}
    {grownUp && <details className="pz-grownups" open>
      <summary>For grown-ups</summary>
      <p>Now at level {track.level} of {MAX_LEVEL}: {carryLevelAbout(track.level)}. Played {track.played} sum{track.played === 1 ? "" : "s"}, {track.played ? `${Math.round((track.firstTry / track.played) * 100)}%` : "—"} with no slips.</p>
      <p>Your child adds each column, ones first. When a column makes 10 or more, they tap the carried 1 to move it up to the next column, so carrying is something they do rather than watch. After two slips in a column, blocks appear for counting; the answer is never just given.</p>
      <p>Three sums in a row with no slips move up a level; two slips in a sum move down. Most sums are at the current level, some a little easier, a few a little harder. Ranks are earned with stars (1–3 per sum), so they never go down.</p>
      <ol className="cc-levels">{Array.from({ length: MAX_LEVEL }, (_, i) => <li key={i} className={i + 1 === track.level ? "now" : ""}>{carryLevelAbout(i + 1)}</li>)}</ol>
    </details>}
  </section>;
}

// ---------- one column-by-column sum ----------
function CarrySum({ a, b, soundOn, onDone }: { a: number; b: number; soundOn: boolean; onDone: (misses: number) => void }) {
  const columns = useMemo(() => carryColumns(a, b), [a, b]);
  const width = columns.length;
  const [col, setCol] = useState(0);
  const [stage, setStage] = useState<"add" | "carry" | "done">("add");
  const [typed, setTyped] = useState("");
  // Answer digits and carried 1s, indexed by place (0 = ones). Place `width` is the new front column.
  const [digits, setDigits] = useState<(number | null)[]>(() => Array(width + 1).fill(null));
  const [carried, setCarried] = useState<boolean[]>(() => Array(width + 1).fill(false));
  const [misses, setMisses] = useState(0);
  const [colMisses, setColMisses] = useState(0);
  const [shake, setShake] = useState(false);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (doneTimer.current) clearTimeout(doneTimer.current); }, []);

  const column = columns[col];
  const parts = [column.carryIn ? 1 : null, column.top, column.bottom].filter((n): n is number => n !== null);
  const say = (text: string, exclaim?: Exclaim) => { if (soundOn) speak(text, { exclaim }); };

  // Read out each column as it becomes the one to work on.
  useEffect(() => {
    if (stage !== "add") return;
    const place = PLACE_NAMES[col];
    say(`${col === 0 ? "Ones first." : `Now the ${place}.`} ${parts.length > 1 ? `${parts.join(" plus ")}. How many?` : `Just ${parts[0]}. What goes down?`}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [col, stage]);

  function finish(total: number) {
    setStage("done");
    doneTimer.current = setTimeout(() => onDone(total), 500);
  }

  function advance() {
    if (col + 1 < width) { setCol(col + 1); setColMisses(0); setStage("add"); }
    else finish(misses);
  }

  function check() {
    if (stage !== "add" || !typed) return;
    if (Number(typed) === column.total) {
      if (soundOn) playStep(col * 2);
      setDigits((d) => d.map((v, i) => (i === col ? column.digit : v)));
      setTyped("");
      if (!column.carryOut) { advance(); return; }
      setStage("carry");
      const where = col + 1 < width ? `carry it to the ${PLACE_NAMES[col + 1]}` : "bring it down to the front";
      say(`${column.total}! That's ten or more. ${TEN_MAKE[col]} Keep the ${column.digit} here, and tap the 1 to ${where}.`);
      return;
    }
    const slips = colMisses + 1;
    setMisses(misses + 1); setColMisses(slips); setTyped("");
    setShake(true); setTimeout(() => setShake(false), 450);
    if (soundOn) playWrong();
    say(slips >= 2 ? "Let's count the blocks together." : "Nearly! Count again.", "oops");
  }

  function carryOne() {
    if (stage !== "carry") return;
    if (soundOn) playPowerUp();
    if (col + 1 < width) { setCarried((c) => c.map((v, i) => (i === col + 1 ? true : v))); advance(); }
    else { setDigits((d) => d.map((v, i) => (i === width ? 1 : v))); finish(misses); }
  }

  function press(key: string) {
    if (stage === "carry") { if (key === "Enter" || key === " ") carryOne(); return; }
    if (stage !== "add") return;
    if (/^[0-9]$/.test(key)) setTyped((t) => (t.length < 2 ? t + key : t));
    else if (key === "Backspace") setTyped((t) => t.slice(0, -1));
    else if (key === "Enter") check();
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest("input, textarea, select")) return;
      if (/^[0-9]$/.test(event.key) || event.key === "Backspace" || ((event.key === "Enter" || event.key === " ") && !(event.target instanceof Element && event.target.closest("button")))) {
        event.preventDefault(); press(event.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // The front column only appears once the last carry needs it.
  const frontNeeded = digits[width] !== null || (stage === "carry" && col === width - 1);
  const places = Array.from({ length: frontNeeded ? width + 1 : width }, (_, i) => (frontNeeded ? width : width - 1) - i);
  const digitOf = (n: number, place: number) => (place < String(n).length ? Math.floor(n / 10 ** place) % 10 : "");
  const active = (place: number) => stage !== "done" && place === col;
  const target = (place: number) => stage === "carry" && place === col + 1;
  const showBlocks = stage === "add" && colMisses >= 2;

  return <>
    <h2 className="pz-prompt cc-ask">
      {stage === "carry" ? <>That&apos;s 10 or more! Carry the 1 ⬆️</> : stage === "done" ? <>{a} + {b} = {a + b} 🎉</>
        : <span className={`cc-equation ${shake ? "shake" : ""}`}>{parts.join(" + ")} = <b className={typed ? "typed" : ""}>{typed || "?"}</b></span>}
    </h2>
    <div className="cc-sum" style={{ gridTemplateColumns: `40px repeat(${places.length}, var(--cc-cell))` }} aria-label={`${a} plus ${b}`}>
      <span />{places.map((p) => <span key={p} className="cc-head">{PLACE_NAMES[p]}</span>)}
      <span />{places.map((p) => p === 0 || p > width - 1
        ? <span key={p} />
        : <button key={p} className={`cc-carry ${carried[p] ? "filled" : ""} ${target(p) ? "target" : ""}`} onClick={() => target(p) && carryOne()} tabIndex={target(p) ? 0 : -1} aria-label={carried[p] ? "carried 1" : target(p) ? "tap to carry the 1 here" : "carry box"}>{carried[p] ? "1" : ""}</button>)}
      <span />{places.map((p) => <span key={p} className={`cc-digit ${active(p) ? "on" : ""}`}>{digitOf(a, p)}</span>)}
      <span className="cc-plus">+</span>{places.map((p) => <span key={p} className={`cc-digit ${active(p) ? "on" : ""}`}>{digitOf(b, p)}</span>)}
      <span className="cc-line" style={{ gridColumn: `1 / span ${places.length + 1}` }} />
      <span />{places.map((p) => p === width && digits[p] === null
        ? <button key={p} className="cc-answer target" onClick={carryOne} aria-label="tap to bring the 1 down here" />
        : <span key={p} className={`cc-answer ${digits[p] !== null ? "done" : ""} ${active(p) && stage === "add" ? "on" : ""}`}>{digits[p] ?? ""}</span>)}
    </div>

    {stage === "carry" && <button className="cc-one" onClick={carryOne} autoFocus aria-label="Carry the 1">1<small>tap me!</small></button>}
    {showBlocks && <div className="cc-blocks" aria-label={`Count the blocks: ${parts.join(" and ")}`}>
      {parts.map((n, i) => <span key={i} className="cc-block-group">
        {i > 0 && <b>+</b>}
        {Array.from({ length: n }, (_, j) => <i key={j} className={`${column.carryIn && i === 0 ? "carry" : i === (column.carryIn ? 1 : 0) ? "top" : "bottom"} ${j === 4 ? "five" : ""}`} />)}
      </span>)}
      <p>Count all the blocks!</p>
    </div>}
    {stage === "add" && <div className="cc-keypad">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⬅️", "0", "✓"].map((key) => <button key={key}
        className={key === "✓" ? "ok" : key === "⬅️" ? "back" : ""} disabled={key === "✓" && !typed}
        onClick={() => press(key === "⬅️" ? "Backspace" : key === "✓" ? "Enter" : key)} aria-label={key === "⬅️" ? "Delete" : key === "✓" ? "Check my answer" : key}>{key}</button>)}
    </div>}
  </>;
}
