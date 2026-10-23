import Link from "next/link";
import type { SignedInUser } from "@/lib/auth";
import { SignOutButton } from "./sign-in/SignInButton";

/** "Jan Harold Diaz" → "JD": first and last initials. */
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** The workspace header (Figma "Dekiru" 23:497): brand, main navigation, account and sign out. */
export function Nav({ on, user }: { on?: "decks" | "library" | "people"; user: SignedInUser | null }) {
  const item = (href: string, label: string, key: typeof on) => (
    <Link href={href} className={`app-nav-item${on === key ? " on" : ""}`} aria-current={on === key ? "page" : undefined}>{label}</Link>
  );
  return (
    <header className="app-header">
      <div className="app-header-l">
        <Link href="/" className="app-brand" aria-label="Dekiru home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app/presentation-mark.svg" alt="" width={36.7589} height={35.1587} />
          <span>DEKIRU</span>
        </Link>
        <nav className="app-nav" aria-label="Main">
          {item("/", "Decks", "decks")}
          {item("/library", "Library", "library")}
          {user?.role === "admin" && item("/people", "People", "people")}
        </nav>
      </div>
      {user ? (
        <div className="app-account">
          <div className="app-who">
            <span className="app-avatar" aria-hidden>{initials(user.name || user.email)}</span>
            <span className="app-who-text">
              <b>{user.name || user.email}</b>
              <span>{user.role.toUpperCase()}</span>
            </span>
          </div>
          <span className="app-divider" aria-hidden />
          <SignOutButton className="app-signout">
            Sign out
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/app/log-out.svg" alt="" width={16} height={16} />
          </SignOutButton>
        </div>
      ) : (
        <span className="app-local">local · sign-in off</span>
      )}
    </header>
  );
}
