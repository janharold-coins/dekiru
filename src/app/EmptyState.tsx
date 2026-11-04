import type { ReactNode } from "react";

export type Art = "deck" | "search" | "archive" | "people" | "review" | "approved" | "changes" | "rejected";

/** Empty collection: a small illustration, what's going on, and the next step (decks home, Studio tabs). */
export function EmptyState({ art, title, body, children }: { art: Art; title: string; body: ReactNode; children?: ReactNode }) {
  return (
    <div className="home-empty-state" role="status">
      <EmptyArt art={art} />
      <h2>{title}</h2>
      <p>{body}</p>
      {children && <div className="home-empty-actions">{children}</div>}
    </div>
  );
}

/** Two stacked slide cards with a badge for what the state is about. */
function EmptyArt({ art }: { art: Art }) {
  const check = <path d="m86 76.5 4 4 8-8.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />;
  const badge: Record<Art, ReactNode> = {
    deck: <path d="M92 70v12M86 76h12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />,
    search: <><circle cx="90.5" cy="74.5" r="5" stroke="#fff" strokeWidth="2.2" /><path d="m94.2 78.2 3.3 3.3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></>,
    archive: <><rect x="84.5" y="70" width="15" height="4.5" rx="1.2" stroke="#fff" strokeWidth="2" /><path d="M86 74.5v6.5a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-6.5M89.5 77.5h5" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></>,
    people: <><circle cx="92" cy="72.5" r="3.2" stroke="#fff" strokeWidth="2" /><path d="M85.5 83c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></>,
    review: check,
    approved: check,
    changes: <path d="m87 81 1-4.2 7.4-7.4a2 2 0 0 1 2.8 2.8l-7.4 7.4L87 81Z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />,
    rejected: <path d="m87.5 71.5 9 9M96.5 71.5l-9 9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />,
  };
  const tone = art === "review" ? "#16a34a" : art === "rejected" ? "#8a93a3" : "var(--app-blue)";
  return (
    <svg className="home-empty-art" width="132" height="100" viewBox="0 0 132 100" fill="none" aria-hidden>
      <rect x="30" y="8" width="84" height="52" rx="8" fill="#eef1f6" stroke="#dbe0e8" />
      <rect x="16" y="22" width="88" height="56" rx="8" fill="#fff" stroke="#d5dbe4" />
      <rect x="27" y="34" width="34" height="5" rx="2.5" fill="#d9dfe8" />
      <rect x="27" y="44" width="52" height="4" rx="2" fill="#e8ecf2" />
      <rect x="27" y="52" width="44" height="4" rx="2" fill="#e8ecf2" />
      <rect x="27" y="66" width="20" height="3" rx="1.5" fill={tone} opacity="0.35" />
      <circle cx="92" cy="76" r="15" fill={tone} stroke="#f7f8fa" strokeWidth="4" />
      {badge[art]}
    </svg>
  );
}
