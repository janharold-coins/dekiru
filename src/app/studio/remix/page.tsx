import { notFound, redirect } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { canUseStudio, remixSource } from "@/lib/studio";
import { sourceSlides } from "../remix";
import { RemixEditor } from "../RemixEditor";

/**
 * Remix: opens the remix editor on a template, theme or approved proposal. The first prompt saves the draft.
 * With ?revise=1 it's a revision instead: the same editor, but the result replaces the original once approved.
 */
export default async function RemixPage({ searchParams }: { searchParams: Promise<{ of?: string; revise?: string }> }) {
  const { of, revise: r } = await searchParams;
  const revise = r === "1";
  const user = await requireUser(`/studio/remix?of=${encodeURIComponent(of ?? "")}${revise ? "&revise=1" : ""}`);
  // Anyone can remix or revise: it's a request, checked by Claude and approved by a reviewer like any other.
  if (!of || !hasDb()) notFound();
  // Editing the original (a revision) is for Studio reviewers; everyone else can make a variant.
  if (revise && !canUseStudio(user)) redirect(`/studio/remix?of=${encodeURIComponent(of)}`);
  const from = await remixSource(of);
  if (!from) notFound();
  const { slides, labels } = await sourceSlides(of, user?.id ?? null);
  return (
    <RemixEditor target={`new:${of}`} name={revise ? `${from.name} revision` : `${from.name} variant`} source={{ name: from.name, href: from.href }} revise={revise}
      status="New draft · not saved yet" building={false} slides={slides} labels={labels} thread={[]} canSubmit={false} />
  );
}
