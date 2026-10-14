import Link from "next/link";

/** Library sub-pages. Themes come next (admins and chosen people). */
export function LibraryTabs({ on, counts, deck }: { on: "approved" | "templates"; counts: { approved: number; templates: number }; deck?: string }) {
  const q = deck ? `?deck=${encodeURIComponent(deck)}` : "";
  return (
    <nav className="tabs" aria-label="Library">
      <Link href={`/library${q}`} className={on === "approved" ? "on" : ""}>Approved slides<span>{counts.approved}</span></Link>
      <Link href={`/library/templates${q}`} className={on === "templates" ? "on" : ""}>Templates and layouts<span>{counts.templates}</span></Link>
    </nav>
  );
}
