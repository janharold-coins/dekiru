import { defineConfig } from "drizzle-kit";

// Reads DATABASE_URL from .env.local (pull it from Vercel with `vercel env pull .env.local`).
try { process.loadEnvFile(".env.local"); } catch { /* fine: env may come from the shell */ }

// sslmode=require → verify-full: same checks pg does today, without its deprecation warning.
const url = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").replace(/sslmode=(require|prefer|verify-ca)\b/, "sslmode=verify-full");
if (!url) {
  console.error(
    "\nNo DATABASE_URL found in .env.local. In Vercel: Storage → your Neon database → Connected Projects → make sure " +
    "the dekiru project is connected with the Development environment ticked. Then run `npx vercel env pull .env.local` again.\n",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
