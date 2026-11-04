"use client";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { MenuItem } from "../decks/[id]/edit/Menu";
import { Menu } from "../decks/[id]/edit/Menu";
import type { Result } from "./actions";
import { ImagePicker, useImages } from "./StudioForms";

// eslint-disable-next-line @next/next/no-img-element
export const ICON = (name: string, size = 16) => <img src={`/editor/${name}.svg`} alt="" width={size} height={size} />;

/** One entry in a prompts thread: someone's prompt, or what Claude did with it. */
export interface ThreadItem {
  id: string;
  who: "person" | "claude";
  by?: string | null;
  text: string;
  images: string[];
  at?: string; // ISO date
}

/**
 * The prompts panel (remix editor, Figma "Dekiru" 254:216; also the Studio rules page): the thread of prompts and
 * what Claude did, and a Prompt box that takes pasted or dropped images. `send` saves a prompt for Claude.
 */
export function PromptPanel({ title, thread, building, empty, pendingNote, placeholder, sendLabel, footer, menu, autoFocus, send, onStatus, extra }: {
  title: string;
  thread: ThreadItem[];
  /** The last prompt is waiting for Claude: shows a note under the thread. */
  building: boolean;
  empty: ReactNode;
  pendingNote: string;
  placeholder: string;
  sendLabel: string;
  footer: string;
  menu?: MenuItem[];
  autoFocus?: boolean;
  send: (prev: Result, form: FormData) => Promise<Result>;
  /** Saving state and errors, for a status line elsewhere (the remix editor's top bar). */
  onStatus?: (pending: boolean, error?: string) => void;
  /** Shown next to the send button, e.g. another action's result. */
  extra?: string;
}) {
  const imgs = useImages();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prev: Result, form: FormData) => {
    imgs.append(form);
    const r = await send(prev, form);
    if (r.ok) { imgs.clear(); formRef.current?.reset(); }
    return r;
  }, {});
  useEffect(() => { onStatus?.(pending, state.error); }, [onStatus, pending, state.error]);
  const note = imgs.problem ?? (onStatus ? undefined : state.error) ?? extra ?? state.ok;

  return (
    <aside className="ed-panel" aria-label={title}>
      <div className="ed-panel-h">
        <h2>{title}</h2>
        {menu && <Menu label={`More ${title.toLowerCase()} actions`} trigger={ICON("ellipsis")} items={menu} />}
      </div>
      <ol className="ed-form studio-thread">
        {thread.length === 0 && <li className="studio-thread-empty">{empty}</li>}
        {thread.map((t) => (
          <li key={t.id} className={`studio-msg ${t.who}`}>
            <span className="studio-msg-meta">{t.who === "claude" ? "Claude" : t.by ?? "You"}{t.at && <> · {new Date(t.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</>}</span>
            {t.text && <p>{t.text}</p>}
            {t.images.length > 0 && (
              <span className="studio-thumbs">
                {t.images.map((img) => (
                  <a key={img} href={`/studio/attachments/${img}`} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/studio/attachments/${img}`} alt="Attached image" />
                  </a>
                ))}
              </span>
            )}
          </li>
        ))}
        {building && <li className="studio-msg claude pending"><span className="studio-msg-meta">Claude</span><p>{pendingNote}</p></li>}
      </ol>
      <form ref={formRef} action={action} className={`studio-prompt${imgs.dragging ? " dragging" : ""}`} {...imgs.drop}>
        <label htmlFor="studio-prompt">Prompt</label>
        <textarea id="studio-prompt" name="prompt" rows={4} maxLength={2000} autoFocus={autoFocus} onPaste={imgs.paste} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); formRef.current?.requestSubmit(); } }} />
        <ImagePicker imgs={imgs} />
        <div className="studio-prompt-foot">
          {note && <span className={`hint${imgs.problem || (!onStatus && state.error) ? " warn" : ""}`}>{note}</span>}
          <button className="ed-btn ed-btn-primary" disabled={pending}>{pending ? "Saving…" : sendLabel}</button>
        </div>
      </form>
      <div className="ed-panel-f">{ICON("info", 12)}<span>{footer}</span></div>
    </aside>
  );
}
