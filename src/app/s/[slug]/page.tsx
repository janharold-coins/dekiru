import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { RenderSlide } from "@/deck/RenderSlide";
import { getShareLink, isUnlocked, linkStatus, unlockCookieName } from "@/lib/share";
import { Presenter } from "../../decks/[id]/present/Presenter";
import { PasswordForm } from "./PasswordForm";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const link = hasDb() ? await getShareLink((await params).slug) : null;
  return { title: link ? link.deckTitle : "Coins.ph", robots: { index: false, follow: false } };
}

/** Public deck link. No sign-in; password unless the creator turned it off. */
export default async function SharedDeck({ params }: Props) {
  const { slug } = await params;
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

  return <Presenter slides={link.slides.map((s) => <RenderSlide key={s.id} slide={s} />)} />;
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
