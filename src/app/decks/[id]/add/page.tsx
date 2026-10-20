import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deckFor } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { Nav } from "../../../Nav";
import { BlockPicker } from "../../BlockPicker";
import { blockGroups } from "../../blocks";
import { addBlocksAction } from "../actions";

/** Add approved slides from the company masters to a deck you can edit. */
export default async function AddSlidesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/decks/${id}/add`);
  const found = await deckFor(id, user);
  if (!found) notFound();
  if (!found.canEdit) redirect(`/decks/${id}`);
  const groups = await blockGroups(user);
  async function add(blocks: string[]) {
    "use server";
    return addBlocksAction(id, blocks);
  }
  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="mono" style={{ margin: "0 0 4px" }}><Link href={`/decks/${id}/edit`}>← Back to editing {found.deck.title}</Link></p>
      <h1 className="page">Add approved slides</h1>
      <p className="lede">They&apos;re added at the end of the deck; drag them into place after. Approved slides keep following the company master, so updates to numbers and pricing reach your deck.</p>
      <BlockPicker groups={groups} submitLabel="Add to deck" onSubmit={add} />
    </main>
  );
}
