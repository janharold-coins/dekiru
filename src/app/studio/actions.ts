"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { addPrompt, addRequest, answerTicket, canUseStudio, decide, dismissRequest, proposalFor, isStudioDecision, reviewTicket, startRemix, startRequest, submitDraft, withdrawRequest, type NewImage, type RequestKind } from "@/lib/studio";

export type Result = { error?: string; ok?: string };

export async function requestAction(_prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser("/studio");
  try {
    await addRequest(user, String(form.get("kind")) as RequestKind, String(form.get("prompt") ?? ""));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/studio");
  return {
    ok: form.get("kind") === "rule"
      ? "Sent. Ask Claude to check the Studio and it will update the rules."
      : "Sent. Claude checks it against what already exists and replies under My requests.",
  };
}

/** Withdraws a ticket (kept as Withdrawn under Closed). */
export async function withdrawAction(id: string): Promise<Result> {
  const user = await requireUser(`/studio/requests/${id}`);
  try { await withdrawRequest(user, id); } catch (e) { return { error: (e as Error).message }; }
  revalidatePath("/studio");
  revalidatePath(`/studio/requests/${id}`);
  return { ok: "Withdrawn." };
}

/** The requester's answer to Claude's suggestion. */
export async function answerAction(id: string, answer: "works" | "still_need"): Promise<Result> {
  const user = await requireUser(`/studio/requests/${id}`);
  try { await answerTicket(user, id, answer); } catch (e) { return { error: (e as Error).message }; }
  revalidatePath("/studio");
  revalidatePath(`/studio/requests/${id}`);
  return { ok: answer === "works" ? "Glad it works. The request is closed." : canUseStudio(user) ? "Claude builds it next." : "Sent to a reviewer to approve the build." };
}

/** A reviewer approves a ticket for building, or rejects it with a reason. */
export async function reviewTicketAction(id: string, _prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser(`/studio/requests/${id}`);
  const decision = String(form.get("decision"));
  if (decision !== "approved" && decision !== "rejected") return { error: "Unknown decision." };
  try { await reviewTicket(user, id, decision, String(form.get("reason") ?? "")); } catch (e) { return { error: (e as Error).message }; }
  revalidatePath("/studio");
  revalidatePath(`/studio/requests/${id}`);
  return { ok: decision === "approved" ? "Approved. Claude builds it next." : "Rejected. The requester sees your reason." };
}

export async function decideAction(id: string, _prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser(`/studio/${id}`);
  const decision = String(form.get("decision"));
  if (!isStudioDecision(decision)) return { error: "Unknown decision." };
  try {
    const images = await imagesOf(form);
    const note = String(form.get("note") ?? "").trim();
    const tuning = String(form.get("tuning") ?? "").trim();
    const { themeId } = await decide(user, id, decision, tuning ? `${note}${note ? "\n\n" : ""}Tune: ${tuning}` : note, images);
    revalidatePath("/studio");
    revalidatePath(`/studio/${id}`);
    if (themeId) revalidatePath("/library/themes");
    return {
      ok: decision === "approved"
        ? themeId ? "Approved and added to Slides → Themes." : "Approved. It joins the library on Claude's next Studio check."
        : decision === "changes_requested" ? "Sent back to Claude with your note. The new revision shows up in In progress." : "Rejected. The requester sees your reason.",
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

const imagesOf = (form: FormData): Promise<NewImage[]> => Promise.all(
  form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0)
    .map(async (f) => ({ mime: f.type, bytes: Buffer.from(await f.arrayBuffer()) })),
);

/** First prompt of a remix (or a revision, when the form says so): starts the draft and opens it. */
export async function startRemixAction(ref: string, _prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser("/studio");
  let id: string;
  try {
    id = await startRemix(user, ref, String(form.get("prompt") ?? ""), await imagesOf(form), form.get("revise") === "1");
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/studio");
  // Reviewers refine a remix as their draft; everyone else follows it as a ticket.
  redirect(canUseStudio(user) ? `/studio/draft/${id}` : `/studio/requests/${id}`);
}

/** A further remix prompt on a draft: a proposal id, or "request:<id>" before Claude has built it. */
export async function promptAction(target: string, _prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser("/studio");
  try {
    await addPrompt(user, target, String(form.get("prompt") ?? ""), await imagesOf(form));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/studio");
  revalidatePath(target.startsWith("request:") ? `/studio/draft/${target.slice(8)}` : `/studio/${target}`);
  return { ok: "Saved. Claude builds it when it next checks the Studio." };
}

export async function submitDraftAction(id: string): Promise<Result> {
  const user = await requireUser(`/studio/${id}`);
  try {
    await submitDraft(user, id);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/studio");
  revalidatePath(`/studio/${id}`);
  return { ok: "Sent for review." };
}

/** Drops a draft: before Claude builds it the request is dismissed; after, the draft is rejected. */
export async function discardDraftAction(target: string): Promise<void> {
  const user = await requireUser("/studio");
  if (target.startsWith("request:")) {
    const built = proposalFor(target.slice(8));
    if (built) await decide(user, built.id, "rejected", "Discarded the draft.");
    else await dismissRequest(user, target.slice(8));
  } else {
    await decide(user, target, "rejected", "Discarded the draft.");
  }
  revalidatePath("/studio");
  redirect("/studio?show=progress");
}

/** A rule change from the rules page's prompts panel. */
export async function ruleAction(_prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser("/studio/rules");
  try {
    await startRequest(user, "rule", String(form.get("prompt") ?? ""), await imagesOf(form));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/studio/rules");
  revalidatePath("/studio");
  return { ok: "Saved. Claude updates the rules when it next checks the Studio." };
}
