import { redirect } from "next/navigation";

/** The editor lives at /decks/<id> now; keep old links (and ?slide=) working. */
export default async function EditDeckPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ slide?: string }> }) {
  const [{ id }, { slide }] = await Promise.all([params, searchParams]);
  redirect(`/decks/${id}${slide ? `?slide=${encodeURIComponent(slide)}` : ""}`);
}
