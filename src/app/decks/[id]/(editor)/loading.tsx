/**
 * Shown the moment someone opens a deck, while the editor loads (deck, review state, themes).
 * Same frame as the editor — top bar, slide rail, canvas, content panel — so nothing jumps when it arrives.
 * Lives in the (editor) route group so the deck's other pages (Share, History…) don't borrow it.
 */
export default function Loading() {
  return (
    <div className="ed ed-skel" role="status" aria-live="polite" aria-label="Opening the deck">
      <header className="ed-top">
        <div className="ed-skel-row"><i className="sk" style={{ width: 28, height: 28 }} /><span className="ed-skel-col"><i className="sk" style={{ width: 140, height: 10 }} /><i className="sk" style={{ width: 220, height: 16 }} /></span></div>
        <div className="ed-skel-row"><i className="sk" style={{ width: 150, height: 36 }} /><i className="sk" style={{ width: 200, height: 36 }} /></div>
        <div className="ed-skel-row end"><i className="sk" style={{ width: 120, height: 14 }} /><i className="sk" style={{ width: 130, height: 36 }} /><i className="sk" style={{ width: 96, height: 36 }} /></div>
      </header>
      <div className="ed-work">
        <nav className="ed-nav ed-skel-nav" aria-hidden>
          <i className="sk" style={{ width: 70, height: 12 }} />
          {[0, 1, 2, 3, 4].map((n) => <i key={n} className="sk ed-skel-thumb" />)}
        </nav>
        <div className="ed-canvas-wrap">
          <div className="ed-canvas">
            <div className="ed-skel-slide sk">
              <span className="ed-skel-msg"><span className="ed-skel-spin" aria-hidden />Opening deck…</span>
            </div>
          </div>
        </div>
        <aside className="ed-panel ed-skel-panel" aria-hidden>
          <i className="sk" style={{ width: 120, height: 14 }} />
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className="ed-skel-col"><i className="sk" style={{ width: 80, height: 10 }} /><i className="sk" style={{ width: "100%", height: n === 1 ? 72 : 36 }} /></span>
          ))}
        </aside>
      </div>
    </div>
  );
}
