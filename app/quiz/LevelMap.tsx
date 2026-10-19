type Props = { title: string; levelCount: number; unlocked: number; current: number; onChoose: (index: number) => void; onClose: () => void };

export default function LevelMap({ title, levelCount, unlocked, current, onChoose, onClose }: Props) {
  return <div className="overlay map-overlay" role="dialog" aria-modal="true" aria-label="Level map">
    <div className="map-card">
      <button className="close" onClick={onClose} aria-label="Close level map">×</button>
      <p className="eyebrow">Your {title.toLowerCase()} adventure</p>
      <h2>{title} map</h2>
      <p>{unlocked === levelCount ? "Every level is unlocked — superstar!" : `${unlocked} of ${levelCount} levels unlocked`}</p>
      <div className="level-grid">
        {Array.from({ length: levelCount }, (_, index) => {
          const isUnlocked = index + 1 <= unlocked;
          return <button key={index} disabled={!isUnlocked} onClick={() => onChoose(index)} className={`${isUnlocked ? "unlocked" : "locked"} ${index === current ? "current" : ""}`} aria-label={`Level ${index + 1}${isUnlocked ? "" : ", locked"}`}>{isUnlocked ? index + 1 : "🔒"}</button>;
        })}
      </div>
    </div>
  </div>;
}
