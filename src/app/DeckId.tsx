"use client";
import { useEffect, useState } from "react";

/**
 * A deck's id as a small chip; click to copy. The id is what Claude (Dekiru connector) takes as `deck_id`,
 * so people can paste it into a prompt: "Add a pricing slide to deck acme-remit-3f9a".
 */
export function DeckId({ id, className = "" }: { id: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      className={`deck-id${copied ? " copied" : ""}${className ? ` ${className}` : ""}`}
      title="Copy deck ID, for use in Claude prompts"
      aria-label={copied ? `Copied deck ID ${id}` : `Copy deck ID ${id}`}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { await navigator.clipboard.writeText(id); setCopied(true); } catch { /* clipboard blocked: the id is still visible to select */ }
      }}
    >
      <span className="deck-id-label">ID</span>
      <code>{id}</code>
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden><rect x="5" y="5" width="8.5" height="8.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M10.5 5V3.5A1.5 1.5 0 009 2H3.5A1.5 1.5 0 002 3.5V9a1.5 1.5 0 001.5 1.5H5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
      )}
    </button>
  );
}
