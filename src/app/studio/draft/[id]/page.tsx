import { notFound, redirect } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { canUseStudio, openRequest, proposalFor, remixSource } from "@/lib/studio";
import { discardDraftAction } from "../../actions";
import { remixThread, sourceSlides } from "../../remix";
import { RemixEditor } from "../../RemixEditor";

/** A remix draft Claude hasn't built yet: the original on the canvas, the prompts so far. Once built, it's the proposal. */
export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/studio/draft/${id}`);
  if (!canUseStudio(user) || !hasDb()) notFound();
  const built = proposalFor(id);
  if (built) redirect(`/studio/${built.id}`);
  const r = await openRequest(id);
  if (!r?.remix) notFound();
  const [from, canvas, thread] = await Promise.all([remixSource(r.remix), sourceSlides(r.remix, user?.id ?? null), remixThread(r)]);
  const name = from?.name ?? r.remix;
  return (
    <RemixEditor target={`request:${id}`} name={`${name} variant`} source={{ name, href: from?.href }}
      status="Draft · Claude is building the first version" building slides={canvas.slides} labels={canvas.labels}
      thread={thread} canSubmit={false} discard={discardDraftAction.bind(null, `request:${id}`)} />
  );
}
