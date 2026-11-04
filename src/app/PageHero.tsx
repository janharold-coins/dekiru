import type { ReactNode } from "react";

/** Top-level page heading: title and a one-line description, centred above the page's tabs and filters. */
export function PageHero({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-hero">
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}
