import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Fast first gate: no session cookie → straight to sign-in. Pages still verify the session
 * itself (requireUser), so a forged or expired cookie gets no further than this.
 */
export function proxy(request: NextRequest) {
  const configured = Boolean(
    (process.env.DATABASE_URL || process.env.POSTGRES_URL) &&
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.BETTER_AUTH_SECRET,
  );
  if (!configured) return NextResponse.next(); // pages decide (open locally, refused on Vercel)
  if (getSessionCookie(request, { cookiePrefix: "dekiru" })) return NextResponse.next();
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except sign-in, public share links (/s/…), the auth API, Next internals and static files.
  matcher: ["/((?!sign-in|s/|api/auth|_next/|figma/|favicon|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)"],
};
