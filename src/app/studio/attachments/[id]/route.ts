import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { attachment, canUseStudio } from "@/lib/studio";

/** An image attached to a Studio decision. Studio access only, like the pages that show it. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/studio`);
  if (!canUseStudio(user) || !hasDb()) return new Response("Not found", { status: 404 });
  const file = await attachment(id);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.bytes), { headers: { "content-type": file.mime, "cache-control": "private, max-age=31536000, immutable" } });
}
