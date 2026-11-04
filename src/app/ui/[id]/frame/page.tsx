import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";
import { screens } from "@/content/screens";
import { RenderScreen } from "@/ui/RenderScreen";

/** One screen alone, for the compare view's iframe: the document is the device, so widths and fonts are the screen's own. */
export default async function UiFramePage({ params }: PageProps<"/ui/[id]/frame">) {
  const user = await requireUser("/ui");
  if (!canUseStudio(user)) notFound();
  const { id } = await params;
  const screen = screens[id];
  if (!screen) notFound();
  return (
    <div style={{ background: "#fff", color: "#131b26", fontFamily: "'Cns Manrope', var(--font-manrope), Manrope, system-ui, sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <RenderScreen screen={screen} />
    </div>
  );
}
