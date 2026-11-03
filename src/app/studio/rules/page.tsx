import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";
import { Nav } from "../../Nav";
import { Markdown } from "../Markdown";

/** The rules every Studio proposal follows (src/studio/STUDIO.md). Changes are asked for on the Studio page and made by Claude. */
export default async function StudioRulesPage() {
  const user = await requireUser("/studio/rules");
  if (!canUseStudio(user) || !hasDb()) notFound();
  const source = await readFile(path.join(process.cwd(), "src/studio/STUDIO.md"), "utf8");
  return (
    <main className="shell">
      <Nav on="studio" user={user} />
      <p className="crumb"><Link href="/studio">← Studio</Link></p>
      <div className="studio-rules">
        <aside className="card studio-box">
          <b>Change a rule</b>
          <p>On the Studio page, choose <b>Rule change</b> and describe it. Claude updates the rules and notes the change at the bottom of this page. New proposals follow the change from then on.</p>
          <Link href="/studio?ask=rule" className="btn">Ask for a rule change</Link>
        </aside>
        <article className="card"><Markdown source={source} /></article>
      </div>
    </main>
  );
}
