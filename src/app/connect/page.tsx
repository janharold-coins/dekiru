import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, hasDb } from "@/db/client";
import { oauthApplications } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ConsentButtons } from "./ConsentButtons";

export const metadata = { title: "Connect · Dekiru" };

/** "Allow Claude to use Dekiru as you?" — shown once per connection before a connector gets a token. */
export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ consent_code?: string; client_id?: string }> }) {
  const { consent_code, client_id } = await searchParams;
  const user = await requireUser(`/connect?${new URLSearchParams({ consent_code: consent_code ?? "", client_id: client_id ?? "" })}`);
  if (!hasDb() || !consent_code || !client_id) notFound();
  const [app] = await db().select().from(oauthApplications).where(eq(oauthApplications.clientId, client_id)).limit(1);
  if (!app) notFound();
  const host = (() => { try { return new URL(app.redirectUrls.split(",")[0]).host; } catch { return "unknown"; } })();
  return (
    <main className="signin-wrap">
      <div className="signin-card">
        <div className="brand"><i />Dekiru</div>
        <h1>Connect {app.name}?</h1>
        <p className="lede" style={{ margin: 0 }}>
          <b>{app.name}</b> wants to use Dekiru as <b>{user?.email ?? "you"}</b>: read the company decks, and create, edit and
          publish your own decks. Company masters stay protected by your role.
        </p>
        <p className="hint">You&apos;ll be sent back to <code className="inline">{host}</code>. Only continue if you started this from Claude just now.</p>
        <ConsentButtons consentCode={consent_code} />
      </div>
    </main>
  );
}
