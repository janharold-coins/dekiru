import type { Metadata } from "next";
import { ThemeScope } from "@/deck/ThemeScope";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { getShareLink, isUnlocked, linkStatus, unlockCookieName } from "@/lib/share";
import { sessionUser } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";
import { SharedDeckViewer } from "./Viewer";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const link = hasDb() ? await getShareLink((await params).slug) : null;
  return { title: link ? link.deckTitle : "Coins.ph", robots: { index: false, follow: false } };
}

/** Public deck link. No sign-in; password unless the creator turned it off. */
export default async function SharedDeck({ params, searchParams }: Props) {
  const { slug } = await params;
  const { lang = "en" } = await searchParams;
  if (!hasDb()) notFound();
  const link = await getShareLink(slug);
  if (!link) notFound();

  const status = linkStatus(link);
  if (status !== "live") {
    return (
      <Gate title="This link has ended">
        <p className="lede" style={{ margin: 0 }}>
          {status === "revoked" ? "The person who shared it has turned it off." : "It has expired."} Ask them for a new link.
        </p>
      </Gate>
    );
  }

  if (!isUnlocked(link, (await cookies()).get(unlockCookieName(slug))?.value)) {
    return (
      <Gate title={link.deckTitle}>
        <p className="lede" style={{ margin: 0 }}>This deck is private. Enter the password from the message you were sent.</p>
        <PasswordForm slug={slug} />
      </Gate>
    );
  }

  return (
    <ThemeScope tokens={link.theme}>
    <SharedDeckViewer slides={link.slides} trackUrl={`/s/${slug}/track`} initialLang={lang} approved={link.approved} team={Boolean(await sessionUser())} />
    </ThemeScope>
  );
}

function Gate({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="signin-wrap">
      <div className="signin-card">
        <div className="brand"><i />coins.ph</div>
        <h1>{title}</h1>
        {children}
      </div>
    </main>
  );
}
