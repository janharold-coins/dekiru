import { defineConfig } from "drizzle-kit";

// Reads DATABASE_URL from .env.local (pull it from Vercel with `vercel env pull .env.local`).
try { process.loadEnvFile(".env.local"); } catch { /* fine: env may come from the shell */ }

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
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
