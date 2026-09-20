import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createChallengeRepository } from "@/adapters/db/challenge-repository";
import { createPollingRepository } from "@/adapters/db/polling-repository";
import { createRiotAccountRepository } from "@/adapters/db/riot-account-repository";
import { ChallengeViewBody } from "@/app/challenges/[id]/challenge-view-body";
import { getChallengeView } from "@/application/get-challenge-view";
import { getAppDb } from "@/lib/db";

/**
 * A single `findById` for the document title only — the URL exists to be
 * shared, so a link preview should not read "Become a Legend" for every
 * challenge (design.md's `/challenges/[id]` — view and join section).
 */
export async function generateMetadata(
  props: PageProps<"/challenges/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const db = await getAppDb();
  const challenge = await createChallengeRepository(db).findById(id);

  return { title: challenge ? challenge.title : "Challenge" };
}

/**
 * `/challenges/[id]` — view and join. Thin, untested server root, same
 * precedent as `/challenges`'s and `/challenges/new`'s `page.tsx` (imports
 * `@/lib/db`'s Cloudflare-bound context) — every branch with behaviour
 * lives in `ChallengeViewBody`, fully covered under `renderToStaticMarkup`.
 *
 * No `auth()` gate: challenge-view: Unauthenticated Read Access Including
 * Unlisted — public and unlisted challenges are both readable signed out.
 * `notFound()` is called in the render path (Next docs) — challenge-view:
 * Unknown Challenge Id Renders Not Found.
 *
 * This is the S5b-i cut (tasks 5b.1–5b.3): a complete, readable, shareable
 * view with no Join control — `joinSlot` is left unset here on purpose.
 * Task 5b.4's `JoinForm` is wired in as an additive edit to this file, not
 * a rewrite, matching the "view and join share one page composition"
 * exception note in tasks.md — see apply-progress.md's S5b section.
 */
export default async function ChallengePage(props: PageProps<"/challenges/[id]">) {
  const { id } = await props.params;
  const db = await getAppDb();
  const now = new Date();

  const result = await getChallengeView({
    challenges: createChallengeRepository(db),
    riotAccounts: createRiotAccountRepository(db),
    polling: createPollingRepository(db),
    now: () => now,
  })(id);

  if (result.kind === "not_found") notFound();

  return (
    <main className="mx-auto w-full max-w-container-max px-5 py-10 lg:px-10 lg:py-16">
      <ChallengeViewBody view={result.view} shareUrl={`/challenges/${id}`} now={now} />
    </main>
  );
}
