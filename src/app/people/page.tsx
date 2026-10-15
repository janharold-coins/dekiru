import { redirect } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { listPeople, ROLES } from "@/lib/people";
import { Nav } from "../Nav";
import { RoleSelect } from "./RoleSelect";
import { ThemeAccess } from "./ThemeAccess";

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
        Everyone who has signed in with a coins.ph account. New people start as members. Role and theme-access changes apply on their next page load. Admins can always edit themes; tick “Can edit themes” for anyone else who should.
      </p>
      <dl className="roles-key">
        {ROLES.map((r) => <div key={r}><dt>{r[0].toUpperCase() + r.slice(1)}</dt><dd>{ROLE_HELP[r]}</dd></div>)}
      </dl>
      <table className="links" style={{ maxWidth: 980 }}>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Themes</th></tr></thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id}>
              <td>{p.name || "—"}{user?.id === p.id && <span className="mono"> (you)</span>}</td>
              <td>{p.email}</td>
              <td><RoleSelect userId={p.id} role={p.role} roles={ROLES} /></td>
              <td><ThemeAccess userId={p.id} allowed={p.canEditThemes} admin={p.role === "admin"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
