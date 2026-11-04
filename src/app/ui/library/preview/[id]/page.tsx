import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";
import { ui } from "@/ui/registry";
import { token, tokenVars } from "@/ui/tokens";

/** One entry rendered by Dekiru with its example props, alone in a document (for the library page's iframe). */
export default async function UiPreviewPage({ params }: PageProps<"/ui/library/preview/[id]">) {
  const user = await requireUser("/ui/library");
  if (!canUseStudio(user)) notFound();
  const { id } = await params;
  const e = ui[id];
  if (!e) notFound();
  const { Component } = e;
  return (
    <div style={{ width: 360, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: 16, boxSizing: "border-box", background: token("Fixed/White"), color: "#131b26", fontFamily: "'Cns Manrope', var(--font-manrope), Manrope, system-ui, sans-serif", ...tokenVars() }}>
      <Component {...e.example} />
    </div>
  );
}
