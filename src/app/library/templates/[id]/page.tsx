import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTemplate } from "@/content/templates";
import { fieldLabel } from "@/deck/fields";
import { patterns } from "@/deck/registry";
import { editableDecks } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { addSlide, EditError, newDeck } from "@/lib/editing";
import { Nav } from "../../../Nav";
import { SlideForm } from "../../../decks/SlideForm";

/** Fill in a template with your own words, then add it to one of your decks (or start a new one). */
export default async function TemplatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ deck?: string }> }) {
  const [{ id }, { deck }] = await Promise.all([params, searchParams]);
  const t = getTemplate(id);
  if (!t) notFound();
  const user = await requireUser(`/library/templates/${id}`);
  const targets = await editableDecks(user);
  async function save(props: Record<string, unknown>, target: string, title: string) {
    "use server";
    const u = await requireUser(`/library/templates/${id}`);
    const tpl = getTemplate(id)!;
    const input = { pattern: tpl.slide.pattern, props, chrome: tpl.slide.chrome };
    let deckId = target;
    try {
      if (target) await addSlide(u, target, input, undefined, "app");
      else deckId = await newDeck(u, title, [input], "app");
    } catch (e) { return { error: e instanceof EditError ? e.message : (e as Error).message }; }
    redirect(`/decks/${deckId}`);
  }
  // Only the limits that apply to this template's content (e.g. not tiered pricing on a rate-chips slide).
  const present = (slot: string) => {
    let v: unknown = t.slide.props;
    for (const k of slot.split(" ")[0].split(".")) {
      if (k === "item" || Array.isArray(v)) break;
      const o = v as Record<string, unknown> | null;
      v = o?.[k] ?? o?.[`${k}s`];
    }
    return v != null && !(Array.isArray(v) && v.length === 0);
  };
  const budgets = (patterns[t.slide.pattern]?.meta.budgets ?? []).filter((b) => present(b.slot)).map((b) => {
    const parts = b.slot.split(" ")[0].split(".");
    const name = parts.at(-1) === "item" ? parts[0] : parts.at(-1)!;
    const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
    const limits = [b.maxItems && `up to ${b.maxItems}`, b.maxChars && plural(b.maxChars, "character"), b.maxLines && plural(b.maxLines, "line")].filter(Boolean);
    return { slot: b.slot, text: `${fieldLabel(name)}${parts.length > 1 && !b.maxItems ? " (each)" : ""}: ${limits.join(", ")}` };
  });
  const back = deck ? `/library/templates?deck=${encodeURIComponent(deck)}` : "/library/templates";
  return (
    <main className="shell">
      <Nav on="library" user={user} />
      <p className="crumb"><Link href={back}>← Templates</Link></p>
      <h1 className="page">{t.name}</h1>
      {budgets.length > 0 && (
        <div className="chips limits" style={{ margin: "0 0 24px" }}>
          <span><b>{patterns[t.slide.pattern]?.meta.name} layout limits</b></span>
          {budgets.map((b) => <span key={b.slot}>{b.text}</span>)}
        </div>
      )}
      <SlideForm slide={t.slide} saveLabel="Add slide" onSave={save} targets={targets}
        defaultTarget={deck && targets.some((x) => x.id === deck) ? deck : ""} />
    </main>
  );
}
