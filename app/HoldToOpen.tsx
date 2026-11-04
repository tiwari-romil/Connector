"use client";

import { useEffect, useRef, useState } from "react";

/** Press and hold for 2 seconds — easy for grown-ups, not something a 5-year-old taps by accident. */
export default function HoldToOpen({ onOpen }: { onOpen: () => void }) {
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
