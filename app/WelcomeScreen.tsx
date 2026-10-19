"use client";

import { useState } from "react";
import { cleanName } from "./puzzles/model";

type Props = {
  playerName: string;
  onName: (name: string) => void;
  onPrep: () => void;
  onPuzzles: () => void;
  onMath: () => void;
  onScience: () => void;
};

export default function WelcomeScreen({ playerName, onName, onPrep, onPuzzles, onMath, onScience }: Props) {
  const [editing, setEditing] = useState(false);
  const [typed, setTyped] = useState(playerName);
  const greeting = `${playerName || "friend"}!`;

  return <div className="overlay">
    <div className="welcome-card">
      <div className="welcome-confetti" aria-hidden="true"><span>★</span><span>●</span><span>✦</span><span>▲</span><span>★</span></div>
      <div className="welcome-mascot">🦊</div>
      <p className="eyebrow">A special adventure for</p>
      <h2 className="child-greeting" aria-label={`Hi ${greeting}`}><small>Hi</small>{[...greeting].map((letter, index) => <span key={index}>{letter}</span>)}</h2>
      {editing
        ? <form className="name-form" onSubmit={(event) => { event.preventDefault(); onName(cleanName(typed)); setEditing(false); }}>
          <label>Child&apos;s name <input value={typed} maxLength={12} onChange={(event) => setTyped(event.target.value)} placeholder="e.g. Aarav" autoFocus /></label>
          <button>Save</button>
        </form>
        : <button className="name-edit" onClick={() => setEditing(true)}>✏️ Grown-ups: {playerName ? "change name" : "add a name"}</button>}
      <h3>What would you like to play?</h3>
      <p>Solve puzzles, earn stars and collect stickers!</p>
      <button className="puzzle-start prep-start" onClick={onPrep}>🏆 Olympiad exam prep <span>→</span></button>
      <button className="puzzle-start" onClick={onPuzzles}>🧩 Puzzle Adventure <span>→</span></button>
      <div className="welcome-choices">
        <button onClick={onMath}>➕ Maths <span>→</span></button>
        <button className="science-start" onClick={onScience}>🔬 Science <span>→</span></button>
      </div>
    </div>
  </div>;
}
