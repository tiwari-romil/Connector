import { MAX_LEVEL } from "./puzzles/model";
import { rankFor, type Rank } from "./tracks";

/** The child's current rank as a round badge. */
export function RankBadge({ ladder, stars, small = false }: { ladder: readonly Rank[]; stars: number; small?: boolean }) {
  const { rank } = rankFor(ladder, stars);
  return <span className={`rk-badge ${small ? "small" : ""}`} aria-label={`Rank: ${rank.title}`}><span>{rank.icon}</span>{small && <b>{rank.title}</b>}</span>;
}

/** "⭐ 6 more stars to Drummer", with a bar that fills as the stars come in. */
export function RankProgress({ ladder, stars }: { ladder: readonly Rank[]; stars: number }) {
  const { rank, next, starsToNext } = rankFor(ladder, stars);
  if (!next) return <p className="rk-progress top">👑 Top rank! ⭐ {stars} stars</p>;
  const filled = Math.round(((stars - rank.stars) / (next.stars - rank.stars)) * 100);
  return <div className="rk-progress" aria-label={`${starsToNext} more stars to ${next.title}`}>
    <span className="rk-bar"><i style={{ width: `${filled}%` }} /></span>
    <small>⭐ {starsToNext} more {starsToNext === 1 ? "star" : "stars"} to {next.icon} {next.title}</small>
  </div>;
}

export function LevelDots({ level }: { level: number }) {
  return <span className="pz-level" aria-label={`Level ${level} of ${MAX_LEVEL}`}>{Array.from({ length: MAX_LEVEL }, (_, i) => <i key={i} className={i < level ? "on" : ""} />)}</span>;
}

/** Every rank, with the star total that earns each one still to come. */
function RankLadder({ ladder, stars, fresh }: { ladder: readonly Rank[]; stars: number; fresh: boolean }) {
  const { index } = rankFor(ladder, stars);
  return <div className="rk-ladder" aria-label="Ranks">
    {ladder.map((rank, i) => <span key={rank.title} className={i < index ? "got" : i === index ? (fresh ? "now fresh" : "now") : "todo"}>
      <em>{rank.icon}</em> {rank.title}{i > index && <b> ⭐{rank.stars}</b>}
    </span>)}
  </div>;
}

type Props = {
  title: string;
  stars: number[];
  ladder: readonly Rank[];
  starsBefore: number;
  starsAfter: number;
  gamesThisVisit: number;
  onAgain: () => void;
  onBack: () => void;
  backLabel: string;
};

/** End of a 5-round game: the stars from each round, and a big badge when a new rank is earned. */
export default function SkillReward({ title, stars, ladder, starsBefore, starsAfter, gamesThisVisit, onAgain, onBack, backLabel }: Props) {
  const before = rankFor(ladder, starsBefore), after = rankFor(ladder, starsAfter);
  const rankedUp = after.index > before.index;
  return <section className="pz-shell pz-reward rk-reward" aria-live="polite">
    <p className="pz-eyebrow">{title} · game complete!</p>
    {rankedUp
      ? <><div className="rk-burst" aria-hidden="true">{["⭐", "🎉", "✨", "🌟", "🎊", "⭐"].map((e, i) => <span key={i}>{e}</span>)}</div>
        <p className="rk-new">New rank!</p>
        <div className="rk-badge big pop"><span>{after.rank.icon}</span></div>
        <h2>{after.rank.title}</h2></>
      : <><div className="rk-badge big"><span>{after.rank.icon}</span></div>
        <h2>Great playing, {after.rank.title}!</h2></>}
    <p className="pz-reward-stars" aria-label={`${starsAfter - starsBefore} stars this game`}>{stars.map((s, i) => <span key={i}>{"⭐".repeat(s)}{"☆".repeat(3 - s)}</span>)}</p>
    <RankProgress ladder={ladder} stars={starsAfter} />
    <RankLadder ladder={ladder} stars={starsAfter} fresh={rankedUp} />
    {gamesThisVisit >= 3 && <p className="pz-break">🦊 The fox is getting sleepy! Time for a break — show Mum or Dad your new rank.</p>}
    <div className="pz-actions">
      <button className="pz-big" onClick={onAgain} autoFocus>🔁 Play again</button>
      <button className="pz-big pz-secondary" onClick={onBack}>{backLabel}</button>
    </div>
  </section>;
}
