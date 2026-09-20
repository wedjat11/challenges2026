import type { ReactNode } from "react";

import { LAST_UPDATED } from "@/lib/legal";

/** Shared shell for the Terms and Privacy pages. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated {LAST_UPDATED}</p>
      <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed">{children}</div>
    </main>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium tracking-tight">{heading}</h2>
      {children}
    </section>
  );
}
