import { createMcpHandler } from "mcp-handler";
import { withMcpAuth } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth, authConfigured, type Role, type SignedInUser } from "@/lib/auth";
import { INSTRUCTIONS, registerTools } from "@/lib/mcp-tools";

/**
 * The Dekiru connector for Claude (remote MCP, Streamable HTTP).
 * Add https://<domain>/api/mcp as a custom connector; Claude signs the person in with Google (coins.ph)
 * through Better Auth's OAuth, and every tool call then acts as that person.
 */
async function handle(req: Request) {
  if (!authConfigured()) return new Response("Dekiru sign-in isn't configured on this deployment.", { status: 503 });
  return withMcpAuth(auth(), async (request, session) => {
    const [u] = session.userId ? await db().select().from(users).where(eq(users.id, session.userId)).limit(1) : [];
    if (!u) return Response.json({ jsonrpc: "2.0", error: { code: -32001, message: "Unknown user" }, id: null }, { status: 403 });
    const user: SignedInUser = { id: u.id, email: u.email, name: u.name, image: u.image, role: u.role as Role, reviewScopes: u.reviewScopes };
    const handler = createMcpHandler((server) => registerTools(server, user), {
      serverInfo: { name: "dekiru", version: "0.1.0" },
      instructions: INSTRUCTIONS,
    });
    return handler(request);
  })(req);
}

export { handle as GET, handle as POST, handle as DELETE };
