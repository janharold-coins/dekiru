import Link from "next/link";
import type { SignedInUser } from "@/lib/auth";
import { SignOutButton } from "./sign-in/SignInButton";

export function Nav({ on, user }: { on?: "decks" | "library"; user: SignedInUser | null }) {
  return (
    <div className="topbar">
      <Link href="/" className="brand"><i />Dekiru</Link>
      <nav className="nav">
        <Link href="/" className={on === "decks" ? "on" : ""}>Decks</Link>
        <Link href="/library" className={on === "library" ? "on" : ""}>Library</Link>
      </nav>
      <span className="spacer" />
      {user ? (
        <span className="who">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {user.image && <img src={user.image} alt="" referrerPolicy="no-referrer" />}
          <span>{user.name || user.email}</span>
          {user.role !== "member" && <span className="tag">{user.role}</span>}
          <SignOutButton />
        </span>
      ) : (
        <span className="mono">local · sign-in off</span>
      )}
    </div>
  );
}
