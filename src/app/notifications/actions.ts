"use server";
import { sessionUser } from "@/lib/auth";
import { markRead } from "@/lib/notifications";

/** Opening the bell marks everything read. */
export async function markNotificationsReadAction() {
  const user = await sessionUser();
  if (user) await markRead(user.id);
}
