import { redirect } from "next/navigation";
import { ALLOWED_DOMAIN, authConfigured, currentUser } from "@/lib/auth";
import { GoogleSignIn } from "./GoogleSignIn";
import { safeNext } from "./next";

export const metadata = { title: "Sign in · Dekiru" };

const MESSAGES: Record<string, string> = {
  "not-configured": "Sign-in isn't set up on this deployment yet. Add the Google and Better Auth settings in Vercel.",
  access_denied: "Google sign-in was cancelled.",
};

/** Sign in (Figma "Dekiru" 246:211): logo, Google's own sign-in button, and who can sign in. */
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const dest = safeNext(next);
  if (authConfigured() && (await currentUser())) redirect(dest);
  const message = error
    ? MESSAGES[error] ?? `Couldn't sign you in. Use your @${ALLOWED_DOMAIN} Google account and try again.`
    : null;
  return (
    <main className="login">
      <div className="login-card">
        <h1 className="login-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app/dekiru-logo.svg" alt="coins.ph Dekiru" width={210} height={54} />
        </h1>
        {authConfigured()
          ? <GoogleSignIn clientId={process.env.GOOGLE_CLIENT_ID!} hd={ALLOWED_DOMAIN} next={dest} />
          : !error && <p className="mono login-off">Sign-in is off on this machine (no Google settings in .env.local). The app runs open locally.</p>}
        {message && <p className="signin-error" role="alert">{message}</p>}
        <p className="login-note">Sign in with your @{ALLOWED_DOMAIN} Google account</p>
      </div>
    </main>
  );
}
