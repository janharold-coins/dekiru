import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { EditError, newDeck } from "@/lib/editing";
import { Nav } from "../Nav";
import { BlockPicker } from "../decks/BlockPicker";
import { blockGroups } from "../decks/blocks";

/** Start a deck from approved slides. Then arrange it here, or ask Claude to tailor the words. */
export default async function NewDeckPage() {
  const user = await requireUser("/new");
  const groups = await blockGroups(user);
  async function create(blocks: string[], title: string) {
    "use server";
    const u = await requireUser("/new");
    let id: string;
    try { id = await newDeck(u, title, blocks.map((block) => ({ block })), "app"); }
    catch (e) { return { error: e instanceof EditError ? e.message : (e as Error).message }; }
    redirect(`/decks/${id}`);
  }
  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="mono" style={{ margin: "0 0 4px" }}><Link href="/">← Decks</Link></p>
      <h1 className="page">New deck</h1>
      <p className="lede">Pick approved slides from the company decks, in the order you want them. A title slide (with your deck&apos;s name) and the closing slide are added for you. You can rearrange after, and ask Claude (Dekiru connector) to tailor the words for a client.</p>
      <BlockPicker groups={groups} submitLabel="Create deck" onSubmit={create} askTitle />
    </main>
  );
}
