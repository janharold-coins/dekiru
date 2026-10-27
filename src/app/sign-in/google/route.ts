import { NextResponse } from "next/server";
import { auth, authConfigured } from "@/lib/auth";
import { safeNext } from "../next";

/**
 * Sign in with Google (Google Identity Services button): the browser posts the ID token Google gave it,
 * Better Auth checks it (signature, our client id, the coins.ph hosted domain) and starts a session.
 *
 * Done here rather than from the browser so a pending Claude connector sign-in resumes correctly: Better Auth
 * answers that case with a redirect (to /connect), which we hand back as a URL for the page to open.
 */
export async function POST(req: Request) {
  if (!authConfigured()) return NextResponse.json({ error: "Sign-in isn't set up on this deployment." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { credential?: unknown; next?: unknown } | null;
  if (typeof body?.credential !== "string" || !body.credential) {
    return NextResponse.json({ error: "Google didn't return a sign-in token. Try again." }, { status: 400 });
  }

  const res = await auth().api.signInSocial({
    body: { provider: "google", idToken: { token: body.credential } },
    headers: req.headers,
    asResponse: true,
  });

  const location = res.headers.get("location");
  let out: NextResponse;
  if (res.status >= 300 && res.status < 400 && location) {
    out = NextResponse.json({ url: location });
  } else if (res.ok) {
    out = NextResponse.json({ url: safeNext(body.next) });
  } else {
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    out = NextResponse.json({ error: err?.message || "Couldn't sign you in. Use your coins.ph Google account and try again." }, { status: res.status });
  }
  for (const cookie of res.headers.getSetCookie()) out.headers.append("set-cookie", cookie);
  return out;
}
