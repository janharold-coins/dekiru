import Link from "next/link";

export function Nav({ on }: { on?: "decks" | "library" }) {
  return (
    <div className="topbar">
      <Link href="/" className="brand"><i />Dekiru</Link>
      <nav className="nav">
        <Link href="/decks/sales" className={on === "decks" ? "on" : ""}>Decks</Link>
        <Link href="/library" className={on === "library" ? "on" : ""}>Library</Link>
      </nav>
      <span className="spacer" />
      <span className="mono">milestone 1 · Sales master deck</span>
    </div>
  );
}
