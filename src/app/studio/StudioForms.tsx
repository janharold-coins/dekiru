"use client";
import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { decideAction, dismissAction, requestAction, type Result } from "./actions";
import { useTuning } from "./Tuner";

/**
 * "Ask for something new": a layout or a theme, in your own words. The send button (an arrow, inside the box)
 * shows once something is typed. Rule changes are asked for on the rules page; remixes start in the remix editor.
 */
export function RequestForm({ kind = "layout" }: { kind?: "layout" | "theme" }) {
  const [text, setText] = useState("");
  const [state, action, pending] = useActionState(async (prev: Result, form: FormData) => {
    const r = await requestAction(prev, form);
    if (r.ok) { ref.current?.reset(); setText(""); }
    return r;
  }, {});
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={action} className="studio-ask card">
      <div className="studio-ask-head">
        <span className="studio-ask-title">
          <b>Ask for something new</b>
          <Link href="/studio/rules" className="studio-rules-link">See defined design rules →</Link>
        </span>
        <span className="studio-kind">
          <label><input type="radio" name="kind" value="layout" defaultChecked={kind === "layout"} /> Slide layout</label>
          <label><input type="radio" name="kind" value="theme" defaultChecked={kind === "theme"} /> Theme</label>
        </span>
      </div>
      <div className="studio-ask-box">
        <textarea name="prompt" rows={3} required maxLength={4000} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="e.g. A comparison slide: Coins.ph vs. two alternatives, five rows, our column highlighted."
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) { e.preventDefault(); ref.current?.requestSubmit(); } }} />
        {text.trim() && (
          <button className="studio-send" disabled={pending} aria-label={pending ? "Sending" : "Send request"} title="Send request">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/editor/arrow-up.svg" alt="" width={16} height={16} />
          </button>
        )}
      </div>
      {(state.error || state.ok) && <p className={`hint${state.error ? " warn" : ""}`}>{state.error ?? state.ok}</p>}
    </form>
  );
}

export function DismissRequest({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return <button className="btn" disabled={pending} onClick={() => start(() => dismissAction(id))}>{pending ? "…" : "Dismiss"}</button>;
}

const MAX_IMAGES = 6; // matches src/lib/studio.ts
const MAX_SIDE = 1600;

/** Shrinks an image to at most 1600px on its longest side, as WebP: small enough to send six at once. */
async function shrink(file: File): Promise<{ blob: Blob; url: string }> {
  const bitmap = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * k);
  canvas.height = Math.round(bitmap.height * k);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("Couldn't read that image."))), "image/webp", 0.85));
  return { blob, url: URL.createObjectURL(blob) };
}

/**
 * Images for a note to Claude: pasted, dropped or picked, shrunk here, at most MAX_IMAGES. `drop` goes on the
 * element that takes drops; `append` adds them to the form data being sent.
 */
export function useImages() {
  const [images, setImages] = useState<{ blob: Blob; url: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState<string>();

  async function add(files: Iterable<File>) {
    const picked = [...files].filter((f) => f.type.startsWith("image/"));
    if (!picked.length) return;
    const room = MAX_IMAGES - images.length;
    setProblem(picked.length > room ? `Up to ${MAX_IMAGES} images.` : undefined);
    try {
      const next = await Promise.all(picked.slice(0, Math.max(0, room)).map(shrink));
      setImages((cur) => [...cur, ...next].slice(0, MAX_IMAGES));
    } catch (e) {
      setProblem((e as Error).message);
    }
  }
  const remove = (n: number) => setImages((cur) => {
    URL.revokeObjectURL(cur[n].url);
    return cur.filter((_, i) => i !== n);
  });
  const clear = () => { images.forEach((img) => URL.revokeObjectURL(img.url)); setImages([]); };
  const append = (form: FormData) => { for (const img of images) form.append("images", img.blob, "image.webp"); };
  const drop = {
    onDragOver: (e: React.DragEvent) => { if ([...e.dataTransfer.types].includes("Files")) { e.preventDefault(); setDragging(true); } },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); },
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setDragging(false); add(e.dataTransfer.files); },
  };
  const paste = (e: React.ClipboardEvent) => { const files = [...e.clipboardData.files]; if (files.length) { e.preventDefault(); add(files); } };
  return { images, dragging, problem, add, remove, clear, append, drop, paste };
}

/** The picked images, each with a remove button, and the "Add image" picker. */
export function ImagePicker({ imgs }: { imgs: ReturnType<typeof useImages> }) {
  return (
    <>
      {imgs.images.length > 0 && (
        <ul className="studio-thumbs">
          {imgs.images.map((img, n) => (
            <li key={img.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`Attached image ${n + 1}`} />
              <button type="button" aria-label={`Remove image ${n + 1}`} onClick={() => imgs.remove(n)}>×</button>
            </li>
          ))}
        </ul>
      )}
      <label className="studio-add-image">
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden
          onChange={(e) => { imgs.add(e.currentTarget.files ?? []); e.currentTarget.value = ""; }} />
        + Add image <span className="hint">or paste / drop · up to {MAX_IMAGES}</span>
      </label>
    </>
  );
}

/**
 * Approve, request changes or reject the proposal's current revision. Images can be pasted into the note,
 * dropped on the box or picked with "Add image"; they're shrunk here and sent with the decision.
 */
export function DecisionForm({ id, revision }: { id: string; revision: number }) {
  const imgs = useImages();
  const formRef = useRef<HTMLFormElement>(null);
  const tuning = useTuning()?.summary ?? null;
  const [state, action, pending] = useActionState(async (prev: Result, form: FormData) => {
    imgs.append(form);
    if (tuning) form.set("tuning", tuning);
    const r = await decideAction(id, prev, form);
    if (r.ok) {
      imgs.clear();
      formRef.current?.reset();
    }
    return r;
  }, {});

  return (
    <form
      ref={formRef}
      action={action}
      className={`studio-decide card${imgs.dragging ? " dragging" : ""}`}
      {...imgs.drop}
    >
      <b>Your decision on revision {revision}</b>
      <textarea
        name="note" rows={3} maxLength={2000}
        placeholder="Note for Claude: what to move, resize, recolour… Paste or drop screenshots here."
        onPaste={imgs.paste}
      />
      <ImagePicker imgs={imgs} />
      {tuning && <p className="hint studio-tuning-note">Sent with it — Tune: {tuning}</p>}
      <div className="studio-decide-buttons">
        <button className="btn primary" name="decision" value="approved" disabled={pending}>Approve</button>
        <button className="btn" name="decision" value="changes_requested" disabled={pending}>Request changes</button>
        <button className="btn danger" name="decision" value="rejected" disabled={pending}>Reject</button>
      </div>
      {(imgs.problem || state.error || state.ok) && <p className={`hint${imgs.problem || state.error ? " warn" : ""}`}>{imgs.problem ?? state.error ?? state.ok}</p>}
    </form>
  );
}
