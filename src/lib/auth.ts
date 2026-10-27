/**
 * Google sign-in (Better Auth). coins.ph accounts only; the first person to sign in becomes admin.
 *
 * Needs DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and BETTER_AUTH_SECRET.
 * Without them, sign-in is off: local development runs open, production refuses every page.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { mcp } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, hasDb } from "@/db/client";
import { accounts, oauthAccessTokens, oauthApplications, oauthConsents, sessions, users, verifications } from "@/db/schema";

export const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "coins.ph";

export type Role = "admin" | "manager" | "member";
export interface SignedInUser {
  id: string; email: string; name: string; image?: string | null; role: Role; canEditThemes?: boolean;
  /** Set only while an admin is using "View as": their real role. `role` then holds the role being previewed. */
  realRole?: Role;
}

/** "View as" (admins only): a cookie that makes the app treat the admin as a manager or member. */
export const VIEW_AS_COOKIE = "dekiru-view-as";
export const VIEW_AS_ROLES = ["manager", "member"] as const satisfies readonly Role[];
const isViewAsRole = (v: unknown): v is (typeof VIEW_AS_ROLES)[number] => VIEW_AS_ROLES.includes(v as never);

export const appBaseURL = () => baseURL();

/** Connector clients may only send people back to Claude, or to a local tool on this machine. */
const REDIRECT_ALLOW = [
  /^https:\/\/claude\.ai\/api\/mcp\/auth_callback$/,
  /^https:\/\/claude\.com\/api\/mcp\/auth_callback$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//,
];
export function allowedRedirect(uri: string) {
  const extra = (process.env.MCP_ALLOWED_REDIRECTS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return REDIRECT_ALLOW.some((r) => r.test(uri)) || extra.includes(uri);
}

export const authConfigured = () =>
  hasDb() && Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.BETTER_AUTH_SECRET);

/** Production must never run open. Vercel sets VERCEL_ENV on its deployments. */
export const authRequired = () => process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";

function baseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function create() {
  return betterAuth({
    appName: "Dekiru",
    baseURL: baseURL(),
    database: drizzleAdapter(db(), {
      provider: "pg",
      schema: {
        user: users, session: sessions, account: accounts, verification: verifications,
        oauthApplication: oauthApplications, oauthAccessToken: oauthAccessTokens, oauthConsent: oauthConsents,
      },
    }),
    advanced: { database: { generateId: "uuid" }, cookiePrefix: "dekiru" },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        hd: ALLOWED_DOMAIN, // Google only offers coins.ph accounts, and the returned token is checked for it
        prompt: "select_account",
      },
    },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "member", input: false },
        canEditThemes: { type: "boolean", defaultValue: false, input: false },
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!user.email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
              throw new APIError("FORBIDDEN", { message: `Only @${ALLOWED_DOMAIN} accounts can sign in.` });
            }
            const [anyAdmin] = await db().select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1);
            return { data: { ...user, role: anyAdmin ? "member" : "admin" } };
          },
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // Only Claude (and local tools like Claude Code / MCP Inspector) may register as connector clients.
        if (ctx.path === "/mcp/register") {
          const uris: unknown = (ctx.body as { redirect_uris?: unknown })?.redirect_uris;
          const bad = Array.isArray(uris) ? uris.filter((u) => typeof u !== "string" || !allowedRedirect(u)) : ["(none)"];
          if (bad.length) throw new APIError("BAD_REQUEST", { message: `Redirect URI not allowed: ${bad.join(", ")}` });
        }
        // Always ask the person before a connector gets access ("Allow Claude to use Dekiru as you?").
        if (ctx.path === "/mcp/authorize" && ctx.query && !String(ctx.query.prompt ?? "").includes("consent")) {
          return { context: { query: { ...ctx.query, prompt: "consent" } } };
        }
      }),
    },
    telemetry: { enabled: false },
    plugins: [
      // Claude connector: OAuth for the MCP endpoint (/api/mcp). Claude registers itself, the person
      // signs in with Google on our sign-in page, and Claude's token then acts as that person.
      mcp({ loginPage: "/sign-in", resource: `${baseURL()}/api/mcp`, oidcConfig: { loginPage: "/sign-in", consentPage: "/connect" } }),
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof create>;
const g = globalThis as unknown as { dekiruAuth?: Auth };

export function auth(): Auth {
  if (!authConfigured()) throw new Error("Sign-in is not configured (see README → Sign-in)");
  g.dekiruAuth ??= create();
  return g.dekiruAuth;
}

/** The signed-in user exactly as stored, ignoring "View as". Use for anything that must check real permissions. */
export async function sessionUser(): Promise<SignedInUser | null> {
  if (!authConfigured()) return null;
  const s = await auth().api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = s.user as typeof s.user & { role?: Role; canEditThemes?: boolean };
  return { id: u.id, email: u.email, name: u.name, image: u.image, role: u.role ?? "member", canEditThemes: Boolean(u.canEditThemes) };
}

/**
 * The signed-in user as the app should treat them. For an admin with "View as" on, the role is swapped
 * (and per-person theme access dropped), so every page and action behaves as it would for that role.
 */
export async function currentUser(): Promise<SignedInUser | null> {
  const user = await sessionUser();
  if (!user || user.role !== "admin") return user;
  const viewAs = (await cookies()).get(VIEW_AS_COOKIE)?.value;
  if (!isViewAsRole(viewAs)) return user;
  return { ...user, role: viewAs, canEditThemes: false, realRole: user.role };
}

/**
 * Call at the top of every private page. Redirects to sign-in when needed.
 * Returns null only in local development without sign-in configured.
 */
export async function requireUser(next = "/"): Promise<SignedInUser | null> {
  if (!authConfigured()) {
    if (authRequired()) redirect("/sign-in?error=not-configured");
    return null;
  }
  const user = await currentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

export const canEditMasters = (u: SignedInUser | null) => !u || u.role === "admin" || u.role === "manager";
