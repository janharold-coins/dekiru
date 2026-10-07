import { redirect } from "next/navigation";
import { ALLOWED_DOMAIN, authConfigured, currentUser } from "@/lib/auth";
import { SignInButton } from "./SignInButton";

export const metadata = { title: "Sign in · Dekiru" };

/** Only same-site paths are allowed as the post-sign-in destination. */
const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

const MESSAGES: Record<string, string> = {
  "not-configured": "Sign-in isn't set up on this deployment yet. Add the Google and Better Auth settings in Vercel.",
  access_denied: "Google sign-in was cancelled.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const dest = safeNext(next);
  if (authConfigured() && (await currentUser())) redirect(dest);
  const message = error
    ? MESSAGES[error] ?? `Couldn't sign you in. Use your @${ALLOWED_DOMAIN} Google account and try again.`
    : null;
  return (
    <main className="signin-wrap">
      <div className="signin-card">
        <div className="brand"><i />Dekiru</div>
        <h1>Coins.ph decks</h1>
        <p className="lede" style={{ margin: 0 }}>Sign in with your @{ALLOWED_DOMAIN} Google account.</p>
        {message && <p className="signin-error" role="alert">{message}</p>}
        {authConfigured() ? <SignInButton next={dest} /> : !error && <p className="mono">Sign-in is off on this machine (no Google settings in .env.local). The app runs open locally.</p>}
      </div>
    </main>
  );
}
