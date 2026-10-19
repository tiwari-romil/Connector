"use client";

import { useEffect, useRef, useState } from "react";
import { CHALLENGES, MISSIONS, experimentFor, mathMission, readDiscoverySave } from "./discovery-model";
import type { Challenge, DiscoverySave, MissionId, MissionSubject } from "./discovery-model";

type Props = { subject: MissionSubject; onQuiz: () => void; soundOn: boolean };

export default function DiscoveryMissions({ subject, onQuiz, soundOn }: Props) {
  const [mission, setMission] = useState<MissionId>(subject === "math" ? "build" : "magnets");
  const [challenge, setChallenge] = useState<Challenge>(0);
  const [round, setRound] = useState(0);
  const [save, setSave] = useState<DiscoverySave>({ best: {}, completed: 0 });
  const [savedLocally, setSavedLocally] = useState(true);
  const [session, setSession] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [lab, setLab] = useState(false);
  const notebookRef = useRef<HTMLDialogElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const active = MISSIONS.find((item) => item.id === mission)!;
  const badgeCount = Object.values(save.best).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    // Read device-local progress after hydration so the server and first browser render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setSave(readDiscoverySave(localStorage.getItem("discovery-missions-v1"))); }
    catch { setSavedLocally(false); }
  }, []);

  function selectMission(id: MissionId) { if (id === mission) return; setMission(id); setRound(0); setFinished(false); }
  function finish() {
    if (finished) return;
    const key = `${mission}-${challenge}`;
    const best = { ...save.best, [key]: 3 };
    const nextSave = { best, completed: Object.keys(best).length };
    setSave(nextSave);
    try { localStorage.setItem("discovery-missions-v1", JSON.stringify(nextSave)); }
    catch { setSavedLocally(false); }
    setSession((previous) => previous.includes(key) ? previous : [...previous, key]);
    setFinished(true);
  }

  function readAloud() {
    if (!("speechSynthesis" in window)) return;
    const activity = document.getElementById("discovery-activity");
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(activity?.innerText ?? active.title);
    speech.rate = 0.85;
    window.speechSynthesis.speak(speech);
  }
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
  useEffect(() => {
    if (finished) resultRef.current?.focus({ preventScroll: true });
  }, [finished, lab]);

  return <section className="discovery-shell compact-discovery" aria-label="Discovery missions">
    <div className="compact-toolbar">
      <label>Mission<select aria-label="Choose your mission" value={mission} onChange={(event) => { selectMission(event.target.value as MissionId); setLab(false); }}>{MISSIONS.filter((item) => item.subject === subject).map((item) => <option key={item.id} value={item.id}>{item.icon} {item.title}</option>)}</select></label>
      <label>Challenge<select aria-label="Choose challenge" value={challenge} onChange={(event) => { setChallenge(Number(event.target.value) as Challenge); setFinished(false); setRound(0); setLab(false); }}>{CHALLENGES.map((label, index) => <option key={label} value={index}>{label}{save.best[`${mission}-${index}`] ? " ✓" : ""}</option>)}</select></label>
      <button className="read-button" onClick={readAloud}>{soundOn ? "🔊" : "📖"} Read aloud</button>
      <button className="notebook-button" onClick={() => notebookRef.current?.showModal()} aria-label="Open progress and grown-up notes">⭐ {badgeCount}</button>
    </div>
    <div className="mission-workspace">
      <div id="discovery-activity" ref={resultRef} tabIndex={-1}>
        {!finished && (subject === "math" ? <MathActivity key={`${mission}-${challenge}-${round}`} mission={mission} challenge={challenge} round={round} onComplete={finish} /> : <ScienceActivity key={`${mission}-${challenge}-${round}`} mission={mission as "magnets" | "water" | "shadows"} challenge={challenge} onComplete={finish} />)}
        {finished && !lab && <section className="compact-success" aria-live="polite"><p className="step-label">Mission complete · ⭐ ⭐ ⭐</p><h2>You built an explanation!</h2><p>{subject === "math" ? mathMission(mission, challenge, round).explanation : experimentFor(mission as "magnets" | "water" | "shadows", challenge).observation}</p><p>Trying again and using clues are part of learning.</p>{subject === "science" && <button className="mission-primary" onClick={() => setLab(true)}>🔎 Explore the interactive lab</button>}{session.length >= 3 && <p>🌿 Great exploring! This is a good place to pause and share your favourite discovery.</p>}</section>}
        {finished && lab && <ScienceSandbox mission={mission as "magnets" | "water" | "shadows"} />}
      </div>
      {finished && <div className="mission-next-actions compact-next"><button onClick={() => { if (challenge < 2) setChallenge((challenge + 1) as Challenge); else { const peers = MISSIONS.filter((item) => item.subject === subject); selectMission(peers[(peers.findIndex((item) => item.id === mission) + 1) % peers.length].id); setChallenge(0); } setFinished(false); setLab(false); }}>Next challenge →</button><button className="secondary" onClick={() => { setRound((value) => value + 1); setFinished(false); setLab(false); }}>{subject === "math" ? "New practice puzzle" : "Try again"}</button>{lab && <button className="secondary" onClick={() => setLab(false)}>Back to discovery</button>}</div>}
    </div>
    <dialog ref={notebookRef} className="discovery-notebook"><form method="dialog"><button className="read-button">Close ×</button></form><h2>📒 My field notebook</h2><p>{save.completed} of 18 challenges explored · {badgeCount} stars</p><progress value={save.completed} max={18} aria-label="Challenges explored" /><p>{savedLocally ? "Progress stays in this browser on this device." : "Progress could not be saved in this browser."}</p><h3>For grown-ups</h3><p>Let your child choose when to stretch. Ask “How did you work that out?” Clues and retries always earn full credit. Science models show simplified expected outcomes, not real measurements.</p><p>Supervise real-world activities. Keep small magnets away from young children. Use a torch, never a laser or the Sun, for light experiments.</p><button className="read-button" onClick={() => { notebookRef.current?.close(); onQuiz(); }}>Original 70-level quiz →</button></dialog>
  </section>;
}

function Blocks({ value }: { value: number }) {
  return <div className="builder-blocks" aria-label={`${value}: ${Math.floor(value / 10)} tens and ${value % 10} ones`}>
    <div className="builder-tens">{Array.from({ length: Math.floor(value / 10) }, (_, i) => <span key={i} aria-hidden="true">10</span>)}</div>
    <div className="builder-ones">{Array.from({ length: value % 10 }, (_, i) => <span key={i} aria-hidden="true">1</span>)}</div>
    {value === 0 && <span className="empty-builder">Your number starts here</span>}
  </div>;
}

function MathActivity({ mission, challenge, round, onComplete }: { mission: MissionId; challenge: Challenge; round: number; onComplete: () => void }) {
  const puzzle = mathMission(mission, challenge, round);
  const [value, setValue] = useState(mission === "subtract" ? puzzle.a : 0);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [built, setBuilt] = useState(false);
  const [explained, setExplained] = useState(false);
  const [reasonFeedback, setReasonFeedback] = useState("");
  const nextStepRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!built) return;
    nextStepRef.current?.focus({ preventScroll: true });
  }, [built, explained]);
  const isGroups = mission === "groups";
  const checkChoices = mission === "subtract"
    ? [`${puzzle.target} + ${puzzle.b} = ${puzzle.a}`, `${puzzle.target} − ${puzzle.b} = ${puzzle.a}`, `${puzzle.a} + ${puzzle.b} = ${puzzle.target}`]
    : isGroups ? [`${puzzle.a} + ${puzzle.b}`, Array(puzzle.a).fill(puzzle.b).join(" + "), `${puzzle.b} − ${puzzle.a}`]
    : [`${puzzle.target} tens and 0 ones`, `${Math.floor(puzzle.target / 10)} ones and ${puzzle.target % 10} tens`, `${Math.floor(puzzle.target / 10)} tens and ${puzzle.target % 10} ones`];
  const rightReason = mission === "subtract" ? 0 : isGroups ? 1 : 2;
  function change(delta: number) { setValue((previous) => Math.max(0, Math.min(99, previous + delta))); setFeedback(""); }
  function check() {
    if (value === puzzle.target) { setBuilt(true); setFeedback("You built it! Now explain your thinking below."); }
    else { setFeedback(`${value} is ${value < puzzle.target ? "too small" : "too large"}. ${mission === "subtract" ? `Start at ${puzzle.a} and take away ${puzzle.b}.` : isGroups ? `Count ${puzzle.a} groups with ${puzzle.b} in each.` : `Start with ${puzzle.a}, then add ${puzzle.b}.`} Try adjusting your blocks.`); setHint(true); }
  }
  return <article className="hands-on-activity">
    {!built && <>
    <p className="step-label">1 · Build it</p><h2>{mission === "subtract" ? "Take away and see what stays" : isGroups ? "Make equal groups" : "Build the answer with blocks"}</h2>
    <div className="mission-equation">{puzzle.a} {puzzle.symbol} {puzzle.b} = <span>?</span></div>
    <p>{mission === "subtract" ? `You have ${puzzle.a}. Take away ${puzzle.b}. How many are left?` : isGroups ? `Make ${puzzle.a} groups with ${puzzle.b} in each. How many altogether?` : `Combine ${puzzle.a} and ${puzzle.b}. One purple rod is 10; one gold block is 1.`}</p>
    <div className="number-workbench"><div className="builder-readout"><span>Your {isGroups ? "total" : "number"}</span><output aria-live="polite">{value}</output><small>{Math.floor(value / 10)} tens · {value % 10} ones</small></div><Blocks value={value} /></div>
    {isGroups && <div className="group-counter" aria-label="Equal groups">{Array.from({ length: Math.floor(value / puzzle.b) }, (_, i) => <span key={i}>{Array(puzzle.b).fill("●").join(" ")}</span>)}</div>}
    <div className="builder-controls">
      {isGroups ? <><button disabled={built || value + puzzle.b > 99} onClick={() => change(puzzle.b)}>+ Add a group of {puzzle.b}</button><button disabled={built || value < puzzle.b} onClick={() => change(-puzzle.b)}>− Remove a group</button></> : <>{[10, 1, -1, -10].map((delta) => <button key={delta} disabled={built || value + delta < 0 || value + delta > 99} onClick={() => change(delta)}>{delta > 0 ? "+" : "−"} {Math.abs(delta) === 10 ? "1 ten" : "1 one"}</button>)}</>}
      <button disabled={built} className="secondary" onClick={() => { setValue(mission === "subtract" ? puzzle.a : 0); setFeedback(""); }}>Start over</button>
    </div>
    <div className="activity-actions"><button className="mission-primary" disabled={built} onClick={check}>Check my model</button><button className="hint-toggle" onClick={() => setHint(!hint)} aria-expanded={hint}>💡 {hint ? "Hide clue" : "Give me a clue"}</button></div>
    {hint && <div className="discovery-clue">{mission === "subtract" ? `Remove ${Math.floor(puzzle.b / 10)} ten(s) and ${puzzle.b % 10} one(s). When there are not enough ones, exchange 1 ten for 10 ones. The model does that exchange as you remove one.` : isGroups ? `Each tap adds ${puzzle.b}. Count the groups, then count all the dots.` : `First build ${puzzle.a}. Then add ${Math.floor(puzzle.b / 10)} ten(s) and ${puzzle.b % 10} one(s). Watch 10 ones turn into a ten.`}</div>}
    <p className="activity-feedback" role="status">{feedback}</p>
    </>}
    {built && <details className="completed-model"><summary>✓ {puzzle.a} {puzzle.symbol} {puzzle.b} = {value}<span>View my blocks</span></summary><Blocks value={value} />{isGroups && <p>{puzzle.a} groups of {puzzle.b}: {Array(puzzle.a).fill(puzzle.b).join(" + ")}</p>}</details>}
{built && <section className="reason-step"><p className="step-label">2 · Explain it</p><h3 ref={nextStepRef} tabIndex={-1}>{explained ? "You explained it!" : mission === "subtract" ? "Which addition checks your subtraction?" : isGroups ? "Which addition matches your groups?" : "Which tens and ones match your number?"}</h3>{!explained && <div className="reason-options">{checkChoices.map((choice, index) => <button key={choice} disabled={explained} onClick={() => { if (index === rightReason) { setExplained(true); setReasonFeedback(puzzle.explanation); onComplete(); } else setReasonFeedback(mission === "subtract" ? "To check subtraction, add what you took away to what is left." : isGroups ? "Each group must have the same number. Count how many groups you made." : "A ten is worth ten ones. Compare the purple rods and gold blocks in your model."); }}>{choice}</button>)}</div>}<p role="status">{reasonFeedback}</p></section>}
  </article>;
}

function ScienceActivity({ mission, challenge, onComplete }: { mission: "magnets" | "water" | "shadows"; challenge: Challenge; onComplete: () => void }) {
  const experiment = experimentFor(mission, challenge);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [step, setStep] = useState<"predict" | "observe" | "explain">("predict");
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [step]);
  return <article className="hands-on-activity science-step">
    <p className="step-label">{step === "predict" ? "1 · Predict" : step === "observe" ? "2 · Observe" : "3 · Explain"}</p>
    <h2 ref={headingRef} tabIndex={-1}>{step === "predict" ? experiment.prompt : step === "observe" ? "What happened?" : experiment.why}</h2>
    {step === "predict" && <><div className="prediction-options">{experiment.options.map((option, index) => <button key={option} className={prediction === index ? "chosen" : ""} aria-pressed={prediction === index} onClick={() => setPrediction(index)}>{option}</button>)}</div><div className="activity-actions"><button className="mission-primary" disabled={prediction === null} onClick={() => { setStep("observe"); setHint(false); }}>▶ Run the experiment</button><button className="hint-toggle" onClick={() => setHint(!hint)} aria-expanded={hint}>💡 {hint ? "Hide clue" : "Give me a clue"}</button></div>{hint && <p className="discovery-clue">{experiment.clue}</p>}</>}
    {step === "observe" && <><section className="experiment-bench tested"><span className="bench-label">On-screen model · Result</span><h3>{experiment.observation}</h3><p>{prediction === experiment.answer ? "Your prediction matched the result!" : "The result was different from your prediction. That is new evidence to learn from!"}</p></section><button className="mission-primary" onClick={() => setStep("explain")}>I’m ready to explain →</button></>}
    {step === "explain" && <><div className="reason-options">{experiment.reasons.map((reason, index) => <button key={reason} onClick={() => { if (index === experiment.reason) onComplete(); else setFeedback(experiment.clue); }}>{reason}</button>)}</div><p className="activity-feedback" role="status">{feedback}</p><button className="read-button" onClick={() => setStep("observe")}>← Look at the result again</button></>}
  </article>;
}

function ScienceSandbox({ mission }: { mission: "magnets" | "water" | "shadows" }) {
  const [material, setMaterial] = useState("Iron");
  const [temperature, setTemperature] = useState(20);
  const [position, setPosition] = useState(50);
  return <section className="science-sandbox"><p className="step-label">4 · Explore for yourself</p>
    {mission === "magnets" ? <><h3>Change the material. Keep the same magnet.</h3><div className="builder-controls">{["Iron", "Wood", "Aluminium", "Plastic"].map((item) => <button key={item} aria-pressed={material === item} onClick={() => setMaterial(item)}>{item}</button>)}</div><p role="status"><strong>{material}</strong>: {material === "Iron" ? "attracted to the magnet." : "not attracted to the magnet in this test."}</p><p>What evidence shows that not all metals are magnetic?</p></> : mission === "water" ? <><h3>Change the temperature around the water</h3><label htmlFor="water-temperature">Surroundings: {temperature} °C</label><input id="water-temperature" type="range" min={-10} max={30} value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} /><p role="status">{temperature < 0 ? "Below 0 °C: liquid water can lose heat and freeze if you wait long enough." : temperature === 0 ? "At 0 °C: ice and liquid water can coexist. Adding or removing heat changes how much is frozen." : "Above 0 °C: an ice cube can absorb heat and melt if you wait long enough."}</p><p>This model uses pure water at ordinary air pressure. Changes take time in real life. Can you reverse the change?</p></> : <><h3>Move the card between a small torch and the screen</h3><label htmlFor="card-position">Card position: {position} out of 100</label><input id="card-position" type="range" min={20} max={90} value={position} onChange={(event) => setPosition(Number(event.target.value))} /><div className="shadow-position"><span>Torch · 0</span><span>Screen · 100</span></div><div className="shadow-model" aria-label={`Model shadow width ${Math.round(100 / position * 20)} units`}><span style={{ width: `${100 / position * 20}%` }}>Shadow</span></div><p role="status">Closer to the torch → larger shadow. Closer to the screen → smaller shadow.</p><p>The torch and screen stay still. Only the card moves. What makes this a fair test?</p></>}
  </section>;
}
