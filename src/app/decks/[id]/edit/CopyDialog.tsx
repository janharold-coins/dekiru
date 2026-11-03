"use client";
import { useEffect, useRef, useState } from "react";
import { LANGUAGES, type TargetLang } from "@/deck/i18n";
import { copyAction } from "../actions";

/**
 * "Make a copy" of a deck that has translations: copies start in English only, so ask whether to keep them.
 * Used by the editor and the Decks home. Decks without translations copy straight away (no dialog).
 */
export function CopyDialog({ deckId, title, langs, onClose }: { deckId: string; title: string; langs: TargetLang[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState<"keep" | "english" | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  const names = langs.map((l) => LANGUAGES[l].english);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  const copy = (keep: boolean) => { setBusy(keep ? "keep" : "english"); void copyAction(deckId, keep); };
  return (
    <dialog ref={ref} className="ed-dialog ed-copy-dialog" aria-labelledby="ed-copy-title"
      onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="ed-dialog-body">
        <h2 id="ed-copy-title">Make a copy</h2>
        <p>“{title}” has {list} {names.length > 1 ? "translations" : "translation"}. Carry {names.length > 1 ? "them" : "it"} over to your copy?</p>
        <p className="ed-copy-langs">{langs.map((l) => <span key={l}><span aria-hidden>{LANGUAGES[l].flag}</span> <span lang={l}>{LANGUAGES[l].name}</span></span>)}</p>
        <p className="ed-copy-help">You can add or remove languages later from the Language picker.</p>
      </div>
      <div className="ed-dialog-actions">
        <button type="button" className="ed-btn" onClick={onClose} disabled={Boolean(busy)}>Cancel</button>
        <button type="button" className="ed-btn" onClick={() => copy(false)} disabled={Boolean(busy)}>{busy === "english" ? "Copying…" : "English only"}</button>
        <button type="button" className="ed-btn ed-btn-primary" onClick={() => copy(true)} disabled={Boolean(busy)} autoFocus>{busy === "keep" ? "Copying…" : "Keep translations"}</button>
      </div>
    </dialog>
  );
}
