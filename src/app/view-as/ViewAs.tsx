"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Role } from "@/lib/auth";
import { setViewAsAction } from "./actions";

const LABEL: Record<Role, string> = { admin: "Admin (you)", manager: "Manager", member: "Member" };

/** Header control for admins: switch the role the app treats you as. */
export function ViewAsSelect({ role }: { role: Role }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const change = (next: Role) =>
    start(async () => {
      await setViewAsAction(next === "admin" ? null : next);
      router.refresh();
    });
  return (
    <label className="app-viewas">
      <span>View as</span>
      <select value={role} disabled={busy} onChange={(e) => change(e.target.value as Role)} aria-label="View the app as">
        {(["admin", "manager", "member"] as Role[]).map((r) => <option key={r} value={r}>{LABEL[r]}</option>)}
      </select>
    </label>
  );
}

/** Shown across the top while previewing, so it's never forgotten. */
export function ViewAsBanner({ role }: { role: Role }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <div className="app-viewas-banner" role="status">
      <span>Viewing as <b>{role}</b>. Pages and actions behave as they would for a {role}.</span>
      <button
        className="linkish"
        disabled={busy}
        onClick={() => start(async () => { await setViewAsAction(null); router.refresh(); })}
      >
        {busy ? "Switching…" : "Back to admin"}
      </button>
    </div>
  );
}
