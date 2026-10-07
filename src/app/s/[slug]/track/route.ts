import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { startVisit, recordTime } from "@/lib/analytics";
import { getShareLink, isUnlocked, linkStatus, unlockCookieName } from "@/lib/share";

/**
 * Beacon from the public presenter. Lives under /s/<slug> so the link's unlock cookie comes along.
 *   {}                         → starts a visit, returns { sid }
 *   { sid, slide, ms }         → adds visible time to a slide
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getShareLink(slug);
  if (!link || linkStatus(link) !== "live" || !isUnlocked(link, req.cookies.get(unlockCookieName(slug))?.value)) {
    return new NextResponse(null, { status: 404 });
  }
  let body: { sid?: string; slide?: string; ms?: number } = {};
  try { body = JSON.parse((await req.text()) || "{}"); } catch { return new NextResponse(null, { status: 400 }); }

  if (!body.sid) {
    const internal = Boolean(getSessionCookie(req, { cookiePrefix: "dekiru" }));
    return NextResponse.json({ sid: await startVisit(link.id, internal) });
  }
  const validSid = /^[0-9a-f-]{36}$/.test(body.sid);
  const validSlide = typeof body.slide === "string" && link.slides.some((s) => s.id === body.slide);
  if (!validSid || !validSlide || typeof body.ms !== "number") return new NextResponse(null, { status: 400 });
  const ok = await recordTime(link.id, body.sid, body.slide!, body.ms);
  return new NextResponse(null, { status: ok ? 204 : 404 });
}
