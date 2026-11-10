"use client";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { SLIDE_H, SLIDE_W } from "@/deck/tokens";
import { promptAction, startRemixAction, submitDraftAction, type Result } from "./actions";
import { ICON, PromptPanel, type ThreadItem } from "./PromptPanel";

/**
 * The remix editor (Figma "Dekiru" 254:216, the deck editor's frame): what's being remixed on the canvas, the
 * remix prompts on the right. Each prompt is saved for Claude, which builds it when it next checks the Studio;
 * when the draft looks right, Send for review puts it up for approval. Nothing reaches the library before that.
 *
 * `target`: "new:<ref>" (nothing saved yet: the first prompt starts the draft), "request:<id>" (saved, Claude
 * hasn't built it yet) or a proposal id (built; prompts ask for the next revision).
 */
export function RemixEditor({ target, name, source, status, building, slides, labels, thread, canSubmit, discard, revise = false }: {
  target: string;
  /** A revision of the original (replaces it once approved) rather than a remix (a variant beside it). */
  revise?: boolean;
  name: string;
  source: { name: string; href?: string };
  status: string;
  building: boolean;
  slides: ReactNode[];
  labels: string[];
  thread: ThreadItem[];
  canSubmit: boolean;
  /** Menu action that drops the draft (the request is dismissed), when there's one to drop. */
  discard?: () => Promise<void>;
}) {
  const fresh = target.startsWith("new:");
  const proposal = !fresh && !target.startsWith("request:");
  const [saving, setSaving] = useState<{ pending: boolean; error?: string }>({ pending: false });
  const onStatus = useCallback((pending: boolean, error?: string) => setSaving({ pending, error }), []);
  const send = (prev: Result, form: FormData) => {
    if (!fresh) return promptAction(target, prev, form);
    if (revise) form.set("revise", "1");
    return startRemixAction(target.slice(4), prev, form);
  };
  const [sent, setSent] = useState<Result>({});
  const [submitting, startSubmit] = useTransition();
  const submit = () => startSubmit(async () => setSent(await submitDraftAction(target)));
  const fullScreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())?.catch(() => {});
  const error = saving.error ?? sent.error;

  return (
    <div className="ed studio-remix">
      <header className="ed-top">
        <div className="ed-identity">
          <Link href="/studio?show=draft" className="ed-icon-btn" aria-label="Back to the Studio">{ICON("arrow-left")}</Link>
          <span className="ed-divider" aria-hidden />
          <div className="ed-title-block">
            <span className="ed-crumb"><span>{revise ? "Revising" : "Remixing"} {source.href ? <Link href={source.href}>{source.name}</Link> : source.name}</span></span>
            <h1 className="ed-title ed-title-static"><span>{name}</span></h1>
          </div>
        </div>
        <div className="ed-pickers">
          <span className={`studio-remix-status${building ? " building" : ""}`} role="status"><i aria-hidden />{status}</span>
        </div>
        <div className="ed-actions">
          <span className={`ed-save${error ? " error" : ""}`} role="status" aria-live="polite">
            {error ? <span className="ed-save-error" title={error}>{error}</span>
              : <>{ICON("cloud-check", 15)}<span>{saving.pending ? "Saving…" : fresh ? "Nothing saved yet" : "All changes saved"}</span></>}
          </span>
          <button type="button" className="ed-btn ed-btn-primary" disabled={!proposal || !canSubmit || submitting} onClick={submit}
            title={!proposal ? "Available once Claude has built the first version" : building ? "Claude hasn't built your last prompt yet" : revise ? `Put this draft up for approval; it replaces ${source.name} once approved` : "Put this draft up for approval; it joins the library once approved"}>
            {submitting ? "Sending…" : "Send for review"}
          </button>
          <button type="button" className="ed-icon-btn" aria-label="Full screen" title="Full screen" onClick={fullScreen}>{ICON("maximize")}</button>
        </div>
      </header>
      <div className="ed-work">
        <RemixCanvas slides={slides} labels={labels} />
        <PromptPanel title={revise ? "Revision prompts" : "Remix prompts"} thread={thread} building={building} autoFocus={fresh} send={send} onStatus={onStatus} extra={sent.ok}
          empty={revise
            ? <>Say what should change in {source.name}: layout, colours, wording, what goes where. Paste or drop screenshots if they help. {source.name} stays as it is until the revision is approved, then the revision replaces it.</>
            : <>Say what the variant should change: layout, colours, wording, what goes where. Paste or drop screenshots if they help. {source.name} itself stays as it is.</>}
          pendingNote="Builds this when it next checks the Studio. Ask Claude to “check the Studio” to get it sooner."
          placeholder={fresh ? "e.g. Dark background, with the client's photo on the right." : "What should change next?"}
          sendLabel={fresh ? (revise ? "Request changes" : "Start remix") : "Send prompt"} footer="Claude builds each prompt when it next checks the Studio"
          menu={[
            { label: `Open ${source.name}`, href: source.href, hidden: !source.href },
            { label: "Studio rules", href: "/studio/rules" },
            { label: "Discard draft", danger: true, hidden: !discard, onSelect: () => void discard?.(),
              confirm: { title: "Discard this draft?", body: "Its prompts are kept, but Claude won't build it.", action: "Discard draft" } },
          ]} />
      </div>
    </div>
  );
}

const ZOOMS = [0.25, 0.33, 0.42, 0.5, 0.67, 0.75, 1];

/** The deck editor's canvas and status bar (fit, zoom), for slides rendered on the server; ‹ › steps through them. */
function RemixCanvas({ slides, labels }: { slides: ReactNode[]; labels: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.42);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [at, setAt] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setFit(Math.max(0.1, Math.min((el.clientWidth - 96) / SLIDE_W, (el.clientHeight - 48 - 28) / SLIDE_H)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = zoom === "fit" ? fit : zoom;
  // Browse the slides as a carousel: Down and Right go to the next one, Up and Left to the previous one, wrapping
  // at both ends. Ignored while typing (the prompt box) or with a modifier held.
  const count = slides.length;
  const go = useCallback((d: number) => setAt((i) => (i + d + count) % count), [count]);
  useEffect(() => {
    if (count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], dialog")) return;
      const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      go(d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, go]);
  const step = (d: 1 | -1) => {
    const next = d > 0 ? ZOOMS.find((z) => z > scale + 0.03) : [...ZOOMS].reverse().find((z) => z < scale - 0.03);
    if (next) setZoom(next);
  };
  return (
    <main className="ed-canvas-wrap">
      <div className={`ed-canvas${zoom !== "fit" && scale > fit ? " zoomed" : ""}`} ref={box}>
        <div className="ed-stage" style={{ width: SLIDE_W * scale }}>
          <div className="ed-context">
            <span>{labels[at]}</span>
            {slides.length > 1 && (
              <span className="ed-layout studio-pager">
                <button type="button" aria-label="Previous slide (↑ or ←)" title="Previous (↑ ←)" onClick={() => go(-1)}>‹</button>
                {at + 1} / {slides.length}
                <button type="button" aria-label="Next slide (↓ or →)" title="Next (↓ →)" onClick={() => go(1)}>›</button>
              </span>
            )}
          </div>
          <div className="ed-slide" style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: SLIDE_W, height: SLIDE_H }}>{slides[at]}</div>
          </div>
        </div>
      </div>
      <div className="ed-status">
        <span className="ed-status-item">{ICON("monitor", 13)}Widescreen · 16:9</span>
        <span className="ed-zoom">
          <button type="button" aria-label="Zoom out" onClick={() => step(-1)}>{ICON("minus", 12)}</button>
          <span aria-live="polite">{Math.round(scale * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => step(1)}>{ICON("plus-small", 12)}</button>
          <span className="ed-divider" aria-hidden />
          <button type="button" className={zoom === "fit" ? "on" : ""} onClick={() => setZoom("fit")}>Fit</button>
        </span>
      </div>
    </main>
  );
}
