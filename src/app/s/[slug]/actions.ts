"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, getShareLink, linkStatus, unlockCookieName, unlockToken } from "@/lib/share";

export async function unlockAction(slug: string, _prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const link = await getShareLink(slug);
  if (!link || linkStatus(link) !== "live") redirect(`/s/${slug}`);
  const ok = link.passwordHash ? await checkPassword(String(form.get("password") ?? ""), link.passwordHash) : true;
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { error: "That password isn't right. Check the message you were sent." };
  }
  (await cookies()).set(unlockCookieName(slug), unlockToken(link), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: `/s/${slug}`, maxAge: 60 * 60 * 24 * 7,
  });
  redirect(`/s/${slug}`);
}
