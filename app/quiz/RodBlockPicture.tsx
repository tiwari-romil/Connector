/** A number drawn as place value: one rod per ten, one block per one. */
export default function RodBlockPicture({ number, crossedBlocks = 0, safeRods = false }: { number: number; crossedBlocks?: number; safeRods?: boolean }) {
  const rods = Math.floor(number / 10);
  const blocks = number % 10;
  return <div className="number-picture" aria-label={`${number}: ${rods} rods and ${blocks} blocks`}>
    <b>{number}</b>
    <div className="place-value">
      <div className="tens-group" aria-label={`${rods} rods`}>{Array.from({ length: rods }, (_, index) => <i key={index} className={`ten-rod ${safeRods ? "safe-ten" : ""}`} />)}</div>
      <div className="ones-group" aria-label={`${blocks} blocks`}>{Array.from({ length: blocks }, (_, index) => <i key={index} className={`one-block ${index < crossedBlocks ? "taken-block" : ""}`} />)}</div>
    </div>
    <small><span>▮ Rods</span><span>■ Blocks</span></small>
  </div>;
}
