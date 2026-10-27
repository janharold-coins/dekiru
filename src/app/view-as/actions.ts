"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { sessionUser, VIEW_AS_COOKIE, VIEW_AS_ROLES, type Role } from "@/lib/auth";

/** Admins only: preview the app as a manager or member, or pass null to go back to admin. */
export async function setViewAsAction(role: Role | null) {
  const user = await sessionUser();
  if (!user || user.role !== "admin") throw new Error("Only admins can use View as");
  const jar = await cookies();
  if (role && (VIEW_AS_ROLES as readonly Role[]).includes(role)) {
    jar.set(VIEW_AS_COOKIE, role, { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8 });
  } else {
    jar.delete(VIEW_AS_COOKIE);
  }
  revalidatePath("/", "layout");
}
