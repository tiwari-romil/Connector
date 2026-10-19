import RodBlockPicture from "./RodBlockPicture";

/** The "Learn" screen: rods-and-blocks place value for adding and taking away. */
export default function LearnModal({ onClose, onPractise }: { onClose: () => void; onPractise: () => void }) {
  return <div className="overlay learn-overlay" role="dialog" aria-modal="true" aria-label="Visual maths learning tricks">
    <div className="learn-card">
      <button className="close" onClick={onClose} aria-label="Close learning module">×</button>
      <p className="eyebrow">Maths superpower</p>
      <h2>Rods and blocks</h2>
      <p className="learn-intro"><strong>One rod = ten.</strong> <strong>One block = one.</strong> See each number before you work it out.</p>

      <article className="visual-trick addition-trick">
        <header><span>➕</span><div><h3>34 + 25</h3><p>Put the rods together. Then put the blocks together.</p></div></header>
        <div className="math-visual">
          <RodBlockPicture number={34} /><span className="operator">+</span><RodBlockPicture number={25} /><span className="operator">=</span>
          <div className="answer-picture"><RodBlockPicture number={59} /></div>
        </div>
        <div className="visual-steps"><span>3 rods + 2 rods = <strong>5 rods</strong></span><span>4 blocks + 5 blocks = <strong>9 blocks</strong></span></div>
        <p className="memory-tip">“Rods together, blocks together!”</p>
      </article>

      <article className="visual-trick subtraction-trick">
        <header><span>➖</span><div><h3>47 − 5</h3><p>Keep the rods. Cross out five blocks.</p></div></header>
        <div className="math-visual subtraction-visual">
          <RodBlockPicture number={47} crossedBlocks={5} safeRods /><span className="operator">− 5</span><span className="operator">=</span>
          <div className="answer-picture"><RodBlockPicture number={42} safeRods /></div>
        </div>
        <div className="visual-steps"><span><strong>4 rods</strong> stay safe</span><span>7 blocks − 5 blocks = <strong>2 blocks</strong></span></div>
        <p className="memory-tip">“The rods stay safe!”</p>
      </article>

      <section className="extra-examples" aria-label="More rod and block examples">
        <h3>More examples</h3>
        <div>
          <p><strong>26 + 13 = 39</strong><span>2 rods + 1 rod → 3 rods</span><span>6 blocks + 3 blocks → 9 blocks</span></p>
          <p><strong>63 − 2 = 61</strong><span>6 rods stay safe</span><span>3 blocks − 2 blocks → 1 block</span></p>
        </div>
      </section>

      <div className="learn-footer"><span>🧮</span><p>Now try the Maths game.</p><button onClick={onPractise}>Practise Maths →</button></div>
    </div>
  </div>;
}
