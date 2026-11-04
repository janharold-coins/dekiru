import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { canUseStudio, decisionsOf, ruleRequests } from "@/lib/studio";
import { Nav } from "../../Nav";
import { ruleAction } from "../actions";
import { Markdown } from "../Markdown";
import { PromptPanel, type ThreadItem } from "../PromptPanel";

/**
 * The rules every Studio proposal follows (src/studio/STUDIO.md), with the remix editor's prompts panel beside
 * them: each prompt is a rule change for Claude, which edits the rules and logs it under Changes.
 */
export default async function StudioRulesPage() {
  const user = await requireUser("/studio/rules");
  if (!canUseStudio(user) || !hasDb()) notFound();
  const [source, rules] = await Promise.all([readFile(path.join(process.cwd(), "src/studio/STUDIO.md"), "utf8"), ruleRequests()]);
  const images = await Promise.all(rules.map((r) => decisionsOf(`request:${r.id}`)));
  const thread: ThreadItem[] = rules.flatMap((r, i) => [
    { id: r.id, who: "person" as const, by: r.author, text: r.prompt, images: images[i].flatMap((d) => d.images), at: r.createdAt.toISOString() },
    ...(r.closedAt ? [{ id: `${r.id}-done`, who: "claude" as const, text: "Done. The change is logged under Changes at the end of the rules.", images: [], at: r.closedAt.toISOString() }] : []),
  ]);
  return (
    <main className="shell">
      <Nav on="studio" user={user} />
      <p className="crumb"><Link href="/studio">← Studio</Link></p>
      <div className="studio-rules">
        <article className="card"><Markdown source={source} /></article>
        <div className="studio-rules-panel">
          <PromptPanel title="Rule prompts" thread={thread} building={rules.some((r) => !r.closedAt)} send={ruleAction}
            empty="These rules are instructions for Claude: it follows them whenever it builds or revises a proposal. Describe a change below and Claude updates the rules and notes it under Changes. New proposals follow it from then on."
            pendingNote="Updates the rules when it next checks the Studio. Ask Claude to “check the Studio” to get it sooner."
            placeholder="e.g. Body text never goes below 28px." sendLabel="Send prompt" footer="Claude updates the rules when it next checks the Studio" />
        </div>
      </div>
    </main>
  );
}
