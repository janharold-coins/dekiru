import { oAuthProtectedResourceMetadata } from "better-auth/plugins";
import { auth, authConfigured } from "@/lib/auth";

/** Tells Claude which OAuth server protects /api/mcp (RFC 9728). */
export async function GET(req: Request) {
  if (!authConfigured()) return new Response(null, { status: 404 });
  return oAuthProtectedResourceMetadata(auth())(req);
}
