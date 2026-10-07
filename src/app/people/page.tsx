import { redirect } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { listPeople, ROLES } from "@/lib/people";
import { Nav } from "../Nav";
import { RoleSelect } from "./RoleSelect";

const ROLE_HELP: Record<string, string> = {
  admin: "Everything, including roles",
  manager: "Edit master decks, approve changes",
  member: "Use and copy decks, share links, suggest changes",
};

export default async function PeoplePage() {
  const user = await requireUser("/people");
  if (user && user.role !== "admin") redirect("/");
  const people = hasDb() ? await listPeople() : [];
  return (
    <main className="shell">
      <Nav on="people" user={user} />
      <h1 className="page">People</h1>
      <p className="lede">
        Everyone who has signed in with a coins.ph account. New people start as members. Role changes apply on their next page load.
      </p>
      <dl className="roles-key">
        {ROLES.map((r) => <div key={r}><dt>{r[0].toUpperCase() + r.slice(1)}</dt><dd>{ROLE_HELP[r]}</dd></div>)}
      </dl>
      <table className="links" style={{ maxWidth: 860 }}>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id}>
              <td>{p.name || "—"}{user?.id === p.id && <span className="mono"> (you)</span>}</td>
              <td>{p.email}</td>
              <td><RoleSelect userId={p.id} role={p.role} roles={ROLES} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
