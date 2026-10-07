/**
 * Google sign-in (Better Auth). coins.ph accounts only; the first person to sign in becomes admin.
 *
 * Needs DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and BETTER_AUTH_SECRET.
 * Without them, sign-in is off: local development runs open, production refuses every page.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, hasDb } from "@/db/client";
import { accounts, sessions, users, verifications } from "@/db/schema";

export const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "coins.ph";

export type Role = "admin" | "manager" | "member";
export interface SignedInUser { id: string; email: string; name: string; image?: string | null; role: Role }

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
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
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
      additionalFields: { role: { type: "string", defaultValue: "member", input: false } },
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
    telemetry: { enabled: false },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof create>;
const g = globalThis as unknown as { dekiruAuth?: Auth };

export function auth(): Auth {
  if (!authConfigured()) throw new Error("Sign-in is not configured (see README → Sign-in)");
  g.dekiruAuth ??= create();
  return g.dekiruAuth;
}

/** The signed-in user, or null. */
export async function currentUser(): Promise<SignedInUser | null> {
  if (!authConfigured()) return null;
  const s = await auth().api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = s.user as typeof s.user & { role?: Role };
  return { id: u.id, email: u.email, name: u.name, image: u.image, role: u.role ?? "member" };
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
