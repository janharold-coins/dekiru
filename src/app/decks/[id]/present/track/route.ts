import { NextResponse, type NextRequest } from "next/server";
import { hasDb } from "@/db/client";
import { recordTime, setAudience, startPresentation } from "@/lib/analytics";
import { auth, authConfigured, authRequired } from "@/lib/auth";
import { getDeck } from "@/lib/decks";

/**
 * Beacon from the in-app presenter (the deck's Present button). Signed-in people only.
 *   {}                      → starts a presentation, returns { sid }
 *   { sid, slide, ms }      → adds visible time to a slide
 *   { sid, audience }       → sets "Presenting to…"
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasDb()) return new NextResponse(null, { status: 204 }); // JSON-only local mode: nothing to record
  let viewerId: string | null = null;
  if (authConfigured()) {
    const s = await auth().api.getSession({ headers: req.headers });
    if (!s) return new NextResponse(null, { status: 401 });
    viewerId = s.user.id;
  } else if (authRequired()) {
    return new NextResponse(null, { status: 401 });
  }

  let body: { sid?: string; slide?: string; ms?: number; audience?: string } = {};
  try { body = JSON.parse((await req.text()) || "{}"); } catch { return new NextResponse(null, { status: 400 }); }

  if (!body.sid) {
    const deck = await getDeck(id);
    if (!deck) return new NextResponse(null, { status: 404 });
    return NextResponse.json({ sid: await startPresentation(deck.id, deck.versionId ?? null, viewerId) });
  }
  if (!/^[0-9a-f-]{36}$/.test(body.sid)) return new NextResponse(null, { status: 400 });

  if (typeof body.audience === "string") {
    const ok = await setAudience(id, body.sid, viewerId, body.audience);
    return new NextResponse(null, { status: ok ? 204 : 404 });
  }
  if (typeof body.slide !== "string" || !/^[a-z0-9_-]{1,40}$/i.test(body.slide) || typeof body.ms !== "number") {
    return new NextResponse(null, { status: 400 });
  }
  const ok = await recordTime({ deckId: id }, body.sid, body.slide, body.ms);
  return new NextResponse(null, { status: ok ? 204 : 404 });
}
