import { notFound, redirect } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { canUseStudio, openRequest, proposalFor, remixSource, TICKET_LABEL } from "@/lib/studio";
import { discardDraftAction } from "../../actions";
import { remixThread, sourceSlides } from "../../remix";
import { RemixEditor } from "../../RemixEditor";

/** A remix draft Claude hasn't built yet: the original on the canvas, the prompts so far. Once built, it's the proposal. */
export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/studio/draft/${id}`);
  if (!hasDb()) notFound();
  // Only reviewers refine remix drafts; everyone else follows the request as a ticket.
  if (!canUseStudio(user)) redirect(`/studio/requests/${id}`);
  const built = proposalFor(id);
  if (built) redirect(`/studio/${built.id}`);
  const r = await openRequest(id);
  if (!r?.remix) notFound();
  const [from, canvas, thread] = await Promise.all([remixSource(r.remix), sourceSlides(r.remix, user?.id ?? null), remixThread(r)]);
  const name = from?.name ?? r.remix;
  return (
    <RemixEditor target={`request:${id}`} name={r.revise ? `${name} revision` : `${name} variant`} source={{ name, href: from?.href }} revise={r.revise}
      status={r.status === "approved" ? "Draft · Claude is building the first version" : r.status === "new" ? "Draft · Claude is checking it against the library first" : `Draft · ${TICKET_LABEL[r.status].toLowerCase()}`} building slides={canvas.slides} labels={canvas.labels}
      thread={thread} canSubmit={false} discard={discardDraftAction.bind(null, `request:${id}`)} />
  );
}
