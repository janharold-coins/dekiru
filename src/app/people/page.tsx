import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { deckCounts, listPeople, ROLES } from "@/lib/people";
import { Nav } from "../Nav";
import { PageHero } from "../PageHero";
import { RoleSelect } from "./RoleSelect";
import { StudioAccess, ThemeAccess } from "./ThemeAccess";
import { ReviewAccess } from "./ReviewAccess";
import { ALL_SCOPES } from "@/lib/reviews";
import { departmentUsage, listDepartments } from "@/lib/departments";
import { DepartmentList, DepartmentSelect } from "./Departments";

const ROLE_HELP: Record<string, string> = {
  admin: "Everything, including roles",
  manager: "Edit master decks; review what they're set up for",
  member: "Use and copy decks, share links, send decks for review",
};

export default async function PeoplePage() {
  const user = await requireUser("/people");
  if (user && user.role !== "admin") redirect("/");
  const [people, counts] = hasDb() ? await Promise.all([listPeople(), deckCounts()]) : [[], new Map<string, number>()];
  const [departments, usage] = await Promise.all([listDepartments(), departmentUsage()]);
  return (
    <main className="shell">
      <Nav on="people" user={user} />
      <PageHero title="People">Everyone who has signed in, with their department, role, theme access, whether they review Studio requests, and what decks they may review.</PageHero>
      <dl className="roles-key">
        {ROLES.map((r) => <div key={r}><dt>{r[0].toUpperCase() + r.slice(1)}</dt><dd>{ROLE_HELP[r]}</dd></div>)}
      </dl>
      {hasDb() && <DepartmentList departments={departments} usage={usage} />}
      <table className="links people" style={{ maxWidth: 1400 }}>
        <thead><tr><th>Name</th><th>Email</th><th>Decks</th><th>Department</th><th>Role</th><th>Themes</th><th>Studio</th><th>Can review</th></tr></thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id}>
              <td>{p.name || "—"}{user?.id === p.id && <span className="mono"> (you)</span>}</td>
              <td>{p.email}</td>
              <td><Decks n={counts.get(p.id) ?? 0} href={user?.id === p.id ? "/?tab=mine" : `/?tab=employees&owner=${p.id}`} /></td>
              <td><DepartmentSelect userId={p.id} departmentId={p.departmentId} departments={departments} /></td>
              <td><RoleSelect userId={p.id} role={p.role} roles={ROLES} /></td>
              <td><ThemeAccess userId={p.id} allowed={p.canEditThemes} admin={p.role === "admin"} /></td>
              <td><StudioAccess userId={p.id} allowed={p.canUseStudio} admin={p.role === "admin"} /></td>
              <td><ReviewAccess userId={p.id} scopes={p.reviewScopes} admin={p.role === "admin"} options={ALL_SCOPES} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

/** Decks someone owns (not archived); opens them on the Decks home. */
function Decks({ n, href }: { n: number; href: string }) {
  return n ? <Link href={href} className="people-decks">{n} {n === 1 ? "deck" : "decks"}</Link> : <span className="people-none">None</span>;
}
