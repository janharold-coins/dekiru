import Link from "next/link";

/** Library sub-pages. Themes shows only for admins and people with theme access. */
export function LibraryTabs({ on, counts, deck, themes }: {
  on: "approved" | "templates" | "themes";
  counts: { approved: number; templates: number; themes?: number };
  deck?: string;
  themes: boolean;
}) {
  const q = deck ? `?deck=${encodeURIComponent(deck)}` : "";
  return (
    <nav className="tabs" aria-label="Library">
      <Link href={`/library${q}`} className={on === "approved" ? "on" : ""}>Approved slides<span>{counts.approved}</span></Link>
      <Link href={`/library/templates${q}`} className={on === "templates" ? "on" : ""}>Templates and layouts<span>{counts.templates}</span></Link>
      {themes && <Link href="/library/themes" className={on === "themes" ? "on" : ""}>Themes{counts.themes != null && <span>{counts.themes}</span>}</Link>}
    </nav>
  );
}
