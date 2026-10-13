import { oAuthDiscoveryMetadata } from "better-auth/plugins";
import { auth, authConfigured } from "@/lib/auth";

/** OAuth server metadata for the Claude connector (RFC 8414), served at the site root as clients expect. */
export async function GET(req: Request) {
  if (!authConfigured()) return new Response(null, { status: 404 });
  return oAuthDiscoveryMetadata(auth())(req);
}
