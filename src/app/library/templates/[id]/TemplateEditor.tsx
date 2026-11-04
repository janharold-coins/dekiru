"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { countImages, fieldLabel } from "@/deck/fields";
import { checkOverflow } from "@/deck/overflow";
import { themeStyle, type ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { ContentFields } from "../../../decks/[id]/edit/ContentFields";
import { Canvas, ICON } from "../../../decks/[id]/edit/DeckEditor";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = Record<string, any>;

export interface TemplateTarget { id: string; title: string; theme?: ThemeTokens }

/**
 * Fill in a template in the deck editor's frame: the slide on the canvas, its words in the panel on the right,
 * and where it goes (one of your decks, or a new one) in the top bar. Layout, images and styling stay as
 * approved; text over the layout's budget is flagged, never shrunk.
 */
export function TemplateEditor({ name, layout, slide, budgets, back, targets, defaultTarget, onSave }: {
  name: string;
  layout: string;
  slide: SlideData;
  /** The layout limits that apply to this template's content. */
  budgets: { slot: string; text: string }[];
  back: string;
  targets: TemplateTarget[];
  defaultTarget: string;
  onSave: (props: Props, target: string, title: string) => Promise<{ error?: string } | void>;
}) {
  const [props, setProps] = useState<Props>(() => structuredClone(slide.props) as Props);
  const [target, setTarget] = useState(defaultTarget);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const preview = useMemo(() => ({ ...slide, props }), [slide, props]);
  const warnings = checkOverflow(preview);
  const images = countImages(slide.props);
  const newDeck = target === "";
  // The slide takes the theme of the deck it goes into.
  const themeVars = useMemo(() => themeStyle(targets.find((t) => t.id === target)?.theme), [targets, target]);
  const save = () => start(async () => {
    setError(null);
    const r = await onSave(props, target, title.trim());
    if (r && r.error) setError(r.error);
  });

  return (
    <div className="ed tpl-ed">
      <header className="ed-top">
        <div className="ed-identity">
          <Link href={back} className="ed-icon-btn" aria-label="Back to templates">{ICON("arrow-left")}</Link>
          <span className="ed-divider" aria-hidden />
          <div className="ed-title-block">
            <span className="ed-crumb"><span><Link href="/library">Library</Link> / <Link href={back}>Templates</Link></span></span>
            <h1 className="ed-title ed-title-static"><span>{name}</span></h1>
          </div>
        </div>
        <div className="ed-pickers">
          <label className="ed-theme-btn tpl-pick">
            <span>Add to</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">A new deck</option>
              {targets.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </label>
          {newDeck && (
            <input className="ed-input tpl-deck-name" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Deck name, e.g. Ramp for Acme Exchange" maxLength={80} aria-label="Deck name" />
          )}
        </div>
        <div className="ed-actions">
          <span className="ed-save" role="status" aria-live="polite">
            {error ? <span className="ed-save-error" title={error}>{error}</span>
              : warnings.length ? <span className="tpl-over">{warnings.length} over the layout&apos;s limits</span>
              : <span>Everything fits</span>}
          </span>
          <button type="button" className="ed-btn ed-btn-primary" disabled={pending || (newDeck && !title.trim())} onClick={save}
            title={newDeck && !title.trim() ? "Name the new deck first" : undefined}>
            {ICON("plus")}<span>{pending ? "Adding…" : "Add slide"}</span>
          </button>
        </div>
      </header>
      <div className="ed-work" style={themeVars}>
        <Canvas selected={{ slide: preview, name, section: "Template", layout, from: null }} number="" lang="en" overlay={null} />
        <aside className="ed-panel" aria-label="Slide content">
          <div className="ed-panel-h"><h2>Slide content</h2></div>
          <div className="ed-form">
            {budgets.length > 0 && (
              <section className="ed-group">
                <h3 className="ed-group-h"><span>{layout} layout limits</span></h3>
                <ul className="tpl-limits">{budgets.map((b) => <li key={b.slot}>{b.text}</li>)}</ul>
              </section>
            )}
            {warnings.length > 0 && (
              <ul className="ed-warn">
                {warnings.map((w, i) => <li key={i}><b>{fieldLabel(w.slot.split(".").pop()!.split(" ")[0])}</b>: {w.message}</li>)}
              </ul>
            )}
            {images > 0 && <p className="ed-note">{images === 1 ? "The image stays" : `The ${images} images stay`} as in the approved slide. Uploads are coming.</p>}
            <ContentFields pattern={slide.pattern} value={props} onChange={setProps} />
          </div>
          <div className="ed-panel-f">{ICON("info", 12)}<span>Changes appear on the slide as you type</span></div>
        </aside>
      </div>
    </div>
  );
}
