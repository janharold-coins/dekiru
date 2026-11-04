import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { canUseStudio, remixSource } from "@/lib/studio";
import { sourceSlides } from "../remix";
import { RemixEditor } from "../RemixEditor";

/** Remix: opens the remix editor on a template, theme or approved proposal. The first prompt saves the draft. */
export default async function RemixPage({ searchParams }: { searchParams: Promise<{ of?: string }> }) {
  const { of } = await searchParams;
  const user = await requireUser(`/studio/remix?of=${encodeURIComponent(of ?? "")}`);
  if (!of || !canUseStudio(user) || !hasDb()) notFound();
  const from = await remixSource(of);
  if (!from) notFound();
  const { slides, labels } = await sourceSlides(of, user?.id ?? null);
  return (
    <RemixEditor target={`new:${of}`} name={`${from.name} variant`} source={{ name: from.name, href: from.href }}
      status="New draft · not saved yet" building={false} slides={slides} labels={labels} thread={[]} canSubmit={false} />
  );
}
