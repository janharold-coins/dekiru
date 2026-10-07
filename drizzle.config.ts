import { defineConfig } from "drizzle-kit";

// Reads DATABASE_URL from .env.local (pull it from Vercel with `vercel env pull .env.local`).
try { process.loadEnvFile(".env.local"); } catch { /* fine: env may come from the shell */ }

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
