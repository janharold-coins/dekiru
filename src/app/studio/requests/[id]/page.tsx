import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { canUseStudio, CLOSED, decisionsOf, eventsOf, KIND_LABEL, remixSource, ticket, TICKET_LABEL, type RequestKind, type TicketEvent } from "@/lib/studio";
import { publishedThemes } from "@/lib/themes";
import { proposal } from "@/studio/proposals";
import { Nav } from "../../../Nav";
import { layoutSamples } from "../../../library/themes/samples";
import { quadOf, SourceThumb } from "../../ProposalThumb";
import { AnswerForm, ReviewTicketForm, WithdrawButton } from "./TicketForms";

const EVENT: Record<string, string> = {
  reply: "suggested using what exists", merged: "merged it into a matching request", build_needed: "found nothing that fits: a build is needed",
  works: "answered: that works", still_need: "answered: still need it", approved: "approved the build", rejected: "rejected it",
  withdrawn: "withdrew it", built: "built it",
};

/** What happens next, in one line, for whoever is looking. */
function nextStep(status: string, mine: boolean, reviewer: boolean, built: boolean) {
  if (built) return "Built. The proposal decides from here: open it below.";
  switch (status) {
    case "new": return "Claude checks it against the templates, themes and open requests, then replies here.";
    case "answered": return mine ? "Claude suggested something that exists. Tell it whether that works." : "Waiting for the requester to answer Claude.";
    case "needs_approval": return reviewer ? "A build is needed. Approve it, or reject it with a reason." : "Waiting for a reviewer to approve the build.";
    case "approved": return "Approved. Claude builds it when it next checks the Studio.";
    case "resolved": return "Closed: something that exists covers it.";
    case "merged": return "Closed: merged into a matching request. Follow that one.";
    case "withdrawn": return "Withdrawn. Only you and admins see it.";
    case "rejected": return "Rejected. The reason is in the thread.";
    default: return null;
  }
}

const when = (d: Date) => d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

/** One Studio ticket: the request, its thread (Claude, the requester, reviewers) and whatever is asked of the viewer. */
export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/studio/requests/${id}`);
  if (!hasDb()) notFound();
  const t = await ticket(id);
  const reviewer = canUseStudio(user);
  const mine = !user || t?.authorId === user.id;
  const admin = !user || user.role === "admin";
  // Rule changes live on the rules page; withdrawn tickets only show to their author and admins.
  if (!t || t.kind === "rule" || (t.status === "withdrawn" && !mine && !admin)) notFound();
  const [events, images, from, themes, samples, into] = await Promise.all([
    eventsOf([id]), decisionsOf(`request:${id}`), t.remix ? remixSource(t.remix) : null, publishedThemes(),
    layoutSamples(user?.id ?? null), t.mergedInto ? ticket(t.mergedInto) : null,
  ]);
  const quad = quadOf(samples);
  const built = t.proposal ? proposal(t.proposal) : undefined;
  const closed = CLOSED.includes(t.status);
  // The requester withdraws until it's approved; reviewers reject instead (with a reason).
  const canWithdraw = !closed && !t.proposal && mine && ["new", "answered", "needs_approval"].includes(t.status);
  const step = nextStep(t.status, mine, reviewer, Boolean(built));
  const files = images.flatMap((d) => d.images);
  const what = t.remix ? `${from?.name ?? t.remix} ${t.revise ? "revision" : "variant"}` : `${KIND_LABEL[t.kind as RequestKind] ?? t.kind} request`;
  return (
    <main className="shell">
      <Nav on="studio" user={user} />
      <p className="crumb"><Link href={`/studio?show=requests&sub=${mine ? "mine" : closed ? "closed" : "others"}`}>← Studio</Link></p>
      <header className="studio-head">
        <h1>{what}</h1>
        <span className={`tag${t.status === "answered" && mine || t.status === "needs_approval" && reviewer ? " warn" : ""}`}>{built ? "Built" : TICKET_LABEL[t.status]}</span>
        <span className="mono">{t.author || t.email || "—"} · {when(t.createdAt)}</span>
      </header>
      <div className="studio-ticket-page">
        <div className="studio-ticket-main">
          <section className="card studio-box">
            <b>Request</b>
            {from && <span className="hint">{t.revise ? "Revision" : "Remix"} of {from.href ? <Link href={from.href}>{from.name}</Link> : from.name}</span>}
            <p className="studio-ticket-prompt">{t.prompt}</p>
            {files.length > 0 && (
              <span className="studio-thumbs">
                {files.map((img, n) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={img} href={`/studio/attachments/${img}`} target="_blank" rel="noreferrer"><img src={`/studio/attachments/${img}`} alt={`Image ${n + 1} with the request`} /></a>
                ))}
              </span>
            )}
          </section>
          <section className="card studio-box">
            <b>Thread</b>
            {events.length === 0 ? <p className="hint">Nothing yet. {step}</p> : (
              <ul className="studio-history studio-thread">
                {events.map((e) => <EventItem key={e.id} e={e} quad={quad} themes={themes} />)}
              </ul>
            )}
          </section>
        </div>
        <aside className="studio-side">
          {step && <section className="card studio-box"><b>Next</b><p>{step}</p></section>}
          {t.status === "answered" && mine && <AnswerForm id={id} reviewer={reviewer} />}
          {t.status === "needs_approval" && reviewer && !mine && <ReviewTicketForm id={id} />}
          {into && <section className="card studio-box"><b>Merged into</b><Link href={`/studio/requests/${into.id}`}>{into.prompt.split("\n")[0].slice(0, 120)} →</Link></section>}
          {built && <section className="card studio-box"><b>The build</b><Link href={`/studio/${built.id}`}>{built.name} · rev {built.revision} →</Link></section>}
          {canWithdraw && <section className="card studio-box"><WithdrawButton id={id} /><span className="hint">It&apos;s kept under Closed, visible to you and admins.</span></section>}
        </aside>
      </div>
    </main>
  );
}

/** One line of the thread; Claude's suggestions show the templates or themes it points to. */
async function EventItem({ e, quad, themes }: { e: TicketEvent; quad: Parameters<typeof SourceThumb>[0]["quad"]; themes: Parameters<typeof SourceThumb>[0]["themes"] }) {
  const refs = e.kind === "reply" ? await Promise.all(e.refs.map(async (r) => ({ r, s: await remixSource(r) }))) : [];
  const builtRef = e.kind === "built" ? proposal(e.refs[0]) : undefined;
  return (
    <li>
      <span><b>{e.by ?? "Claude"}</b> {EVENT[e.kind] ?? e.kind}</span>
      <span className="mono">{when(e.createdAt)}</span>
      {e.note && e.kind !== "built" && <p>{e.note}</p>}
      {builtRef && <Link href={`/studio/${builtRef.id}`}>{builtRef.name} · {e.note} →</Link>}
      {refs.length > 0 && (
        <span className="studio-ticket-refs">
          {refs.map(({ r, s }) => (
            <Link key={r} href={s?.href ?? (r.startsWith("theme:") ? "/studio?show=slides&lib=themes" : "/studio?show=slides")} className="card studio-ticket-ref">
              <SourceThumb of={r} quad={quad} themes={themes} />
              <span>{s?.name ?? r}</span>
            </Link>
          ))}
        </span>
      )}
    </li>
  );
}
