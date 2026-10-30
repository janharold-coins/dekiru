"use client";
import { useActionState } from "react";
import { addMemberAction, changeOwnerAction, removeMemberAction, setMemberRoleAction, type PeopleState } from "./actions";
import type { Member } from "@/lib/members";

/** Who the deck is shared with (spec §7b): add by email (read-only by default), change a role, remove, hand over ownership. */
export function People({ deckId, owner, members, canManage, canChangeOwner, people, me }: {
  deckId: string; owner: { id: string; name: string } | null; members: Member[]; canManage: boolean; canChangeOwner: boolean;
  /** Everyone who has signed in, for the owner picker (admins and managers only). */
  people: { id: string; name: string }[]; me: string | null;
}) {
  const [added, add, adding] = useActionState(addMemberAction.bind(null, deckId), {} as PeopleState);
  const [roleState, setRole] = useActionState(setMemberRoleAction, {} as PeopleState);
  const [ownerState, setOwner, changingOwner] = useActionState(changeOwnerAction, {} as PeopleState);
  return (
    <section className="share-people">
      <table className="links">
        <thead><tr><th>Person</th><th>Access</th><th /></tr></thead>
        <tbody>
          <tr>
            <td>{owner?.name ?? <span className="mono">nobody</span>}</td>
            <td>Owner</td>
            <td>
              {canChangeOwner && people.length > 0 && (
                <form action={setOwner} className="role-form">
                  <input type="hidden" name="deckId" value={deckId} />
                  <select name="userId" defaultValue="" disabled={changingOwner} onChange={(e) => { if (e.currentTarget.value) e.currentTarget.form?.requestSubmit(); }} aria-label="Change owner">
                    <option value="" disabled>Change owner…</option>
                    {people.filter((p) => p.id !== owner?.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </form>
              )}
            </td>
          </tr>
          {members.map((m) => (
            <tr key={m.userId}>
              <td>{m.name || m.email}{m.userId === me && <span className="mono"> · you</span>}</td>
              <td>
                {canManage ? (
                  <form action={setRole} className="role-form">
                    <input type="hidden" name="deckId" value={deckId} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <select name="role" defaultValue={m.role} onChange={(e) => e.currentTarget.form?.requestSubmit()} aria-label={`Access for ${m.name || m.email}`}>
                      <option value="viewer">View only</option>
                      <option value="editor">Can edit</option>
                    </select>
                  </form>
                ) : m.role === "editor" ? "Can edit" : "View only"}
              </td>
              <td>
                {(canManage || m.userId === me) && (
                  <form action={removeMemberAction}>
                    <input type="hidden" name="deckId" value={deckId} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <button className="linkish">{m.userId === me ? "Leave" : "Remove"}</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {canManage && (
        <form action={add} className="share-form share-add">
          <label>
            <span>Share with a person</span>
            <input name="email" type="email" placeholder="name@coins.ph" required />
          </label>
          <label>
            <span>Access</span>
            <select name="role" defaultValue="viewer">
              <option value="viewer">View only</option>
              <option value="editor">Can edit</option>
            </select>
          </label>
          <button className="btn" disabled={adding}>{adding ? "Sharing…" : "Share"}</button>
          {added.ok && <p className="hint" role="status">{added.ok}</p>}
          {added.error && <p className="hint warn" role="alert">{added.error}</p>}
        </form>
      )}
      {roleState.error && <p className="hint warn" role="alert">{roleState.error}</p>}
      {ownerState.ok && <p className="hint" role="status">{ownerState.ok}</p>}
      {ownerState.error && <p className="hint warn" role="alert">{ownerState.error}</p>}
    </section>
  );
}
