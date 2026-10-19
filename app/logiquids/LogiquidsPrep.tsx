"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { speak, stopSpeaking } from "../speech";
import { makeRng, shuffle } from "../puzzles/model";
import { LEVELS, MOCK_TESTS, QUESTIONS, TYPES, optionLabel, type Level, type Opt, type Question, type Visual } from "./bank";

type Mode = "practice" | "test";
type Session = { title: string; ids: string[]; mode: Mode; mock?: number };
type Save = { best: Record<string, number>; solved: string[]; mistakes: string[]; stars: number };
const KEY = "logiquids-prep-v1";
const EMPTY: Save = { best: {}, solved: [], mistakes: [], stars: 0 };
const BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));
const LETTERS = ["A", "B", "C", "D"];
const PRAISE = ["Super!", "Brilliant!", "You got it!", "Champion thinking!", "Wow, well spotted!", "Fantastic!"];

function loadSave(): Save {
  try { const raw = localStorage.getItem(KEY); if (!raw) return EMPTY; const d = JSON.parse(raw); return { best: d.best ?? {}, solved: Array.isArray(d.solved) ? d.solved : [], mistakes: Array.isArray(d.mistakes) ? d.mistakes : [], stars: Number(d.stars) || 0 }; } catch { return EMPTY; }
}
function storeSave(s: Save) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: progress just isn't kept */ } }

function readText(q: Question) {
  const lines = q.visual?.kind === "text" ? ". " + q.visual.lines.join(". ").replace(/→/g, " becomes ").replace(/\?/g, " what") : "";
  return q.prompt.replace(/"\?"/g, "the question mark") + lines + (q.note ? ". " + q.note : "");
}

export default function LogiquidsPrep({ soundOn }: { soundOn: boolean }) {
  const [save, setSave] = useState<Save>(EMPTY);
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, number[]>>({});
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [burst, setBurst] = useState(0);

  // Browser-only progress is read after hydration so server and client first render match.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSave(loadSave()); }, []);
  useEffect(() => {
    if (!session || finished || session.mode !== "test") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [session, finished]);
  useEffect(() => () => stopSpeaking(), []);

  function update(fn: (s: Save) => Save) { setSave((prev) => { const next = fn(prev); storeSave(next); return next; }); }

  function start(next: Session) {
    stopSpeaking(); setSession(next); setIndex(0); setPicks({}); setFinished(false); setSeconds(0); setStreak(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function practiceLevel(level: Level) {
    const pool = QUESTIONS.filter((q) => q.level === level);
    const fresh = pool.filter((q) => !save.solved.includes(q.id));
    const rng = makeRng(Date.now() % 100000);
    const ids = [...shuffle(rng, fresh), ...shuffle(rng, pool.filter((q) => save.solved.includes(q.id)))].slice(0, 10).map((q) => q.id);
    start({ title: `${LEVELS[level].icon} ${LEVELS[level].label} · 10 puzzles`, ids, mode: "practice" });
  }
  function practiceType(typeId: string) {
    const order: Record<Level, number> = { easy: 0, medium: 1, champ: 2 };
    const ids = QUESTIONS.filter((q) => q.type === typeId).sort((a, b) => order[a.level] - order[b.level]).map((q) => q.id);
    const t = TYPES.find((x) => x.id === typeId)!;
    start({ title: `${t.icon} ${t.title}`, ids, mode: "practice" });
  }

  function finish() {
    if (!session) return;
    const correct = session.ids.filter((id) => { const p = picks[id]; const q = BY_ID.get(id)!; return p && p[0] === q.answer; });
    const wrongIds = session.ids.filter((id) => !correct.includes(id));
    update((s) => {
      const best = { ...s.best };
      if (session.mock !== undefined) best[session.mock] = Math.max(best[session.mock] ?? 0, correct.length);
      return {
        ...s, best,
        solved: [...new Set([...s.solved, ...session.ids.filter((id) => picks[id]?.includes(BY_ID.get(id)!.answer))])],
        mistakes: [...new Set([...s.mistakes.filter((id) => !correct.includes(id)), ...wrongIds])],
        stars: s.stars + (session.mode === "test" ? correct.length : 0),
      };
    });
    setFinished(true); stopSpeaking();
    if (soundOn) speak(correct.length / session.ids.length >= 0.8 ? "Amazing work! You are ready for the exam." : "Good try! Let's look at the tricky ones together.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!session) return <PrepHome save={save} onMock={(i) => start({ title: `📝 Mock Test ${i + 1}`, ids: MOCK_TESTS[i], mode: "test", mock: i })} onLevel={practiceLevel} onType={practiceType}
    onMistakes={() => start({ title: "🔁 My tricky ones", ids: save.mistakes.slice(0, 15), mode: "practice" })} />;

  if (finished) return <Results session={session} picks={picks} seconds={seconds} onHome={() => setSession(null)}
    onRetry={(ids) => start({ title: "🔁 Try these again", ids, mode: "practice" })} />;

  const q = BY_ID.get(session.ids[index])!;
  const mine = picks[q.id] ?? [];
  const solved = session.mode === "practice" && mine.includes(q.answer);
  const revealed = session.mode === "practice" && (solved || mine.length >= 2);

  function choose(i: number) {
    if (session!.mode === "test") { setPicks((p) => ({ ...p, [q.id]: [i] })); return; }
    if (revealed || mine.includes(i)) return;
    const nextPicks = [...mine, i];
    setPicks((p) => ({ ...p, [q.id]: nextPicks }));
    if (i === q.answer) {
      const earned = nextPicks.length === 1 ? 3 : 2;
      update((s) => ({ ...s, stars: s.stars + earned, solved: [...new Set([...s.solved, q.id])], mistakes: nextPicks.length === 1 ? s.mistakes.filter((m) => m !== q.id) : s.mistakes }));
      setStreak((n) => n + 1); setBurst((b) => b + 1);
      if (soundOn) speak(PRAISE[(index + nextPicks.length) % PRAISE.length], { pitch: 1.35 });
    } else {
      setStreak(0);
      if (nextPicks.length >= 2) { update((s) => ({ ...s, mistakes: [...new Set([...s.mistakes, q.id])] })); if (soundOn) speak("Let's see why. " + q.why); }
      else if (soundOn) speak("Nearly! Look again carefully.");
    }
  }
  function go(delta: number) {
    stopSpeaking();
    const n = index + delta;
    if (n >= session!.ids.length) { finish(); return; }
    if (n >= 0) { setIndex(n); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  return <QuizScreen key={q.id} q={q} session={session} index={index} mine={mine} revealed={revealed} solved={solved} seconds={seconds} streak={streak} burst={burst} soundOn={soundOn}
    answeredCount={session.ids.filter((id) => picks[id]?.length).length} onChoose={choose} onGo={go} onQuit={() => { stopSpeaking(); setSession(null); }} onFinish={finish} />;
}

// ---------- home ----------
function PrepHome({ save, onMock, onLevel, onType, onMistakes }: { save: Save; onMock: (i: number) => void; onLevel: (l: Level) => void; onType: (t: string) => void; onMistakes: () => void }) {
  const solvedSet = useMemo(() => new Set(save.solved), [save.solved]);
  const levelCount = (l: Level) => QUESTIONS.filter((q) => q.level === l).length;
  return <section className="lq-shell">
    <header className="lq-hero">
      <div className="lq-hero-fox" aria-hidden="true">🦊</div>
      <div>
        <p className="lq-eyebrow">Exam practice · Junior KG</p>
        <h1>LogIQids Prep</h1>
        <p>{QUESTIONS.length} puzzles just like the real test, from easy warm-ups to tricky <b>LQ Champ</b> ones.</p>
      </div>
      <div className="lq-hero-stats">
        <span><b>{solvedSet.size}</b> / {QUESTIONS.length} solved</span>
        <span>⭐ <b>{save.stars}</b></span>
        <div className="lq-meter" aria-label={`${solvedSet.size} of ${QUESTIONS.length} solved`}><i style={{ width: `${(solvedSet.size / QUESTIONS.length) * 100}%` }} /></div>
      </div>
    </header>

    <h2 className="lq-h2">📝 Mock tests <small>25 questions each, like the real paper — answers shown at the end</small></h2>
    <div className="lq-mocks">
      {MOCK_TESTS.map((_, i) => <button key={i} className="lq-mock" onClick={() => onMock(i)}>
        <strong>Test {i + 1}</strong>
        <span>{save.best[i] !== undefined ? `Best: ${save.best[i]} / 25` : "Not tried yet"}</span>
        {save.best[i] !== undefined && <i className="lq-mock-bar"><b style={{ width: `${(save.best[i] / 25) * 100}%` }} /></i>}
      </button>)}
    </div>

    <h2 className="lq-h2">🎯 Practise by level <small>see the answer and the reason straight away</small></h2>
    <div className="lq-levels">
      {(Object.keys(LEVELS) as Level[]).map((l) => <button key={l} className={`lq-level lq-${l}`} onClick={() => onLevel(l)}>
        <span className="lq-level-icon">{LEVELS[l].icon}</span>
        <strong>{LEVELS[l].label}</strong>
        <span>{QUESTIONS.filter((q) => q.level === l && solvedSet.has(q.id)).length} / {levelCount(l)} solved · play 10</span>
      </button>)}
    </div>
    {save.mistakes.length > 0 && <button className="lq-mistakes" onClick={onMistakes}>🔁 Retry my tricky ones <b>{save.mistakes.length}</b></button>}

    <h2 className="lq-h2">🧩 Practise one kind of question <small>all {TYPES.length} kinds from the sample papers</small></h2>
    <div className="lq-types">
      {TYPES.map((t) => { const qs = QUESTIONS.filter((q) => q.type === t.id); const done = qs.filter((q) => solvedSet.has(q.id)).length; return <button key={t.id} className={`lq-type ${done === qs.length ? "done" : ""}`} onClick={() => onType(t.id)}>
        <span className="lq-type-icon">{t.icon}</span><span className="lq-type-name">{t.title}</span><small>{done}/{qs.length}</small>
      </button>; })}
    </div>
    <p className="lq-tip">💡 Exam tip for grown-ups: read each question aloud, let him point before he circles, and remind him to check <b>every</b> option — the tricky ones often look almost right.</p>
  </section>;
}

// ---------- quiz ----------
function QuizScreen({ q, session, index, mine, revealed, solved, seconds, streak, burst, soundOn, answeredCount, onChoose, onGo, onQuit, onFinish }: {
  q: Question; session: Session; index: number; mine: number[]; revealed: boolean; solved: boolean; seconds: number; streak: number; burst: number; soundOn: boolean; answeredCount: number;
  onChoose: (i: number) => void; onGo: (d: number) => void; onQuit: () => void; onFinish: () => void;
}) {
  const isTest = session.mode === "test";
  const total = session.ids.length;
  const last = index === total - 1;
  const canNext = isTest ? true : revealed;
  const readRef = useRef(false);

  useEffect(() => {
    if (readRef.current || !soundOn) return;
    readRef.current = true;
    const t = setTimeout(() => speak(readText(q)), 250);
    return () => clearTimeout(t);
  }, [q, soundOn]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase(); const n = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
      if (n >= 0 && n < q.options.length) onChoose(n);
      else if (e.key === "Enter" && canNext) onGo(1);
      else if (e.key === "ArrowLeft" && isTest) onGo(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const type = TYPES.find((t) => t.id === q.type)!;
  return <section className="lq-shell lq-quiz">
    <div className="lq-quizbar">
      <button className="lq-back" onClick={onQuit}>← Prep home</button>
      <strong className="lq-title">{session.title}</strong>
      <span className="lq-count">{isTest ? `⏱ ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : `🔥 ${streak}`}</span>
    </div>
    <div className="lq-progress" aria-label={`Question ${index + 1} of ${total}`}><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div>

    <article className={`lq-card ${solved ? "solved" : ""}`}>
      <div className="lq-qhead">
        <span className="lq-qnum">Q{index + 1}<small>/{total}</small></span>
        <span className={`lq-pill lq-${q.level}`}>{LEVELS[q.level].icon} {LEVELS[q.level].label}</span>
        <span className="lq-kind">{type.icon} {type.title}</span>
        <button className="lq-read" onClick={() => speak(readText(q))} aria-label="Read the question aloud">🔊 Read</button>
      </div>
      <h2 className="lq-prompt">{q.prompt}</h2>
      {q.note && <p className="lq-note">{q.note}</p>}
      {q.visual && <VisualView v={q.visual} />}
      <div className={`lq-options ${q.options.every((o) => typeof o !== "string") ? "pics" : ""}`}>
        {q.options.map((o, i) => {
          const picked = mine.includes(i);
          const state = isTest ? (picked ? "chosen" : "") : picked ? (i === q.answer ? "right" : "wrong") : revealed && i === q.answer ? "reveal" : "";
          return <button key={i} className={`lq-option ${state}`} onClick={() => onChoose(i)} disabled={!isTest && (revealed || picked)} aria-label={`Option ${LETTERS[i]}: ${optionLabel(o)}`}>
            <b className="lq-letter">{LETTERS[i]}</b><OptView o={o} />
          </button>;
        })}
      </div>

      {!isTest && <div className={`lq-feedback ${solved ? "good" : mine.length ? "try" : ""}`} aria-live="polite">
        {!mine.length && <span>👆 Look carefully, then tap an answer</span>}
        {mine.length > 0 && !revealed && <span>💪 Nearly! Look again — one option is greyed out now.</span>}
        {revealed && <div className="lq-why"><strong>{solved ? (mine.length === 1 ? "🎉 First try! ⭐⭐⭐" : "👏 Got it! ⭐⭐") : `💡 The answer is ${LETTERS[q.answer]}.`}</strong><p>{q.why}</p></div>}
      </div>}

      <div className="lq-nav">
        {isTest && <button className="lq-btn ghost" onClick={() => onGo(-1)} disabled={index === 0}>← Back</button>}
        {isTest && <span className="lq-answered">{answeredCount} of {total} answered</span>}
        {isTest && last ? <button className="lq-btn" onClick={onFinish}>Finish test ✓</button>
          : <button className="lq-btn" onClick={() => onGo(1)} disabled={!canNext}>{last ? "See my score →" : "Next →"}</button>}
      </div>
    </article>
    {solved && <div key={burst} className="lq-burst" aria-hidden="true">{["🎉", "⭐", "✨", "🌟", "🎈", "⭐", "🎊", "✨"].map((e, i) => <span key={i} style={{ "--i": i } as CSSProperties}>{e}</span>)}</div>}
  </section>;
}

function VisualView({ v }: { v: Visual }) {
  if (v.kind === "text") return <div className="lq-series">{v.lines.map((l, i) => <div key={i}>{l}</div>)}</div>;
  if (v.kind === "svg") return <div className={`lq-svg lq-${v.size ?? "m"}`} dangerouslySetInnerHTML={{ __html: v.svg }} />;
  if (v.kind === "pairs") return <div className="lq-pairs">{v.pairs.map(([a, b], i) => <div key={i}><span>{a}</span><b>➜</b><span className={b === "?" ? "lq-gap" : ""}>{b}</span></div>)}</div>;
  return <div className="lq-emoji-grid" style={{ gridTemplateColumns: `repeat(${v.cols}, 1fr)` }}>{v.items.map((e, i) => <span key={i}>{e}</span>)}</div>;
}

function OptView({ o }: { o: Opt }) {
  if (typeof o !== "string") return <span className="lq-opt-svg" dangerouslySetInnerHTML={{ __html: o.svg }} />;
  const emojiOnly = /^[\p{Extended_Pictographic}\u{FE0F}\u{200D}\s]+$/u.test(o);
  return <span className={emojiOnly ? "lq-opt-emoji" : "lq-opt-text"}>{o}</span>;
}

// ---------- results ----------
function Results({ session, picks, seconds, onHome, onRetry }: { session: Session; picks: Record<string, number[]>; seconds: number; onHome: () => void; onRetry: (ids: string[]) => void }) {
  const rows = session.ids.map((id) => { const q = BY_ID.get(id)!; const p = picks[id] ?? []; return { q, first: p[0], ok: p[0] === q.answer }; });
  const score = rows.filter((r) => r.ok).length;
  const wrong = rows.filter((r) => !r.ok);
  const pct = score / rows.length;
  const byLevel = (Object.keys(LEVELS) as Level[]).map((l) => ({ l, total: rows.filter((r) => r.q.level === l).length, ok: rows.filter((r) => r.q.level === l && r.ok).length })).filter((x) => x.total);
  return <section className="lq-shell">
    <div className="lq-result-card">
      <div className="lq-hero-fox" aria-hidden="true">{pct >= 0.8 ? "🏆" : pct >= 0.5 ? "🦊" : "🌱"}</div>
      <p className="lq-eyebrow">{session.title}</p>
      <h1 className="lq-score">{score} <small>/ {rows.length}</small></h1>
      <p className="lq-result-msg">{pct >= 0.9 ? "Superstar! You're exam-ready!" : pct >= 0.7 ? "Great work! Just a few tricky ones to look at." : pct >= 0.5 ? "Good effort! Let's learn from the ones you missed." : "Every puzzle you check makes you stronger. Let's look together!"}{session.mode === "test" ? ` (Time: ${Math.floor(seconds / 60)} min ${seconds % 60} s)` : ""}</p>
      <div className="lq-level-split">{byLevel.map((x) => <span key={x.l} className={`lq-pill lq-${x.l}`}>{LEVELS[x.l].icon} {LEVELS[x.l].label}: {x.ok}/{x.total}</span>)}</div>
      <div className="lq-nav center">
        <button className="lq-btn ghost" onClick={onHome}>← Prep home</button>
        {wrong.length > 0 && <button className="lq-btn" onClick={() => onRetry(wrong.map((r) => r.q.id))}>🔁 Try the {wrong.length} missed again</button>}
      </div>
    </div>
    {wrong.length > 0 && <>
      <h2 className="lq-h2">🔍 Let&apos;s look at the tricky ones</h2>
      <div className="lq-review">
        {wrong.map(({ q, first }) => <article key={q.id} className="lq-review-item">
          <p className="lq-review-q"><span className={`lq-pill lq-${q.level}`}>{LEVELS[q.level].icon}</span> Q{session.ids.indexOf(q.id) + 1}. {q.prompt}</p>
          {q.visual && <VisualView v={q.visual} />}
          <div className="lq-review-answers">
            <div className="lq-review-pick wrong"><small>{first === undefined ? "Not answered" : `You chose ${LETTERS[first]}`}</small>{first !== undefined && <OptView o={q.options[first]} />}</div>
            <div className="lq-review-pick right"><small>Correct: {LETTERS[q.answer]}</small><OptView o={q.options[q.answer]} /></div>
          </div>
          <p className="lq-review-why">💡 {q.why}</p>
        </article>)}
      </div>
    </>}
  </section>;
}
