import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createChallengeRepository } from "@/adapters/db/challenge-repository";
import { createPollingRepository } from "@/adapters/db/polling-repository";
import { createRiotAccountRepository } from "@/adapters/db/riot-account-repository";
import { ChallengeViewBody } from "@/app/challenges/[id]/challenge-view-body";
import { JoinForm } from "@/app/challenges/[id]/join-form";
import { getChallengeView } from "@/application/get-challenge-view";
import { auth } from "@/auth";
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
 * `JoinForm` is wired in additively (task 5b.5) on top of the S5b-i cut
 * (tasks 5b.1–5b.3, no Join control) — matching the "view and join share
 * one page composition" exception note in tasks.md; see apply-progress.md's
 * S5b section. `accounts` is `null` when there is no session (JoinForm
 * renders a sign-in link instead of a picker) rather than an auth gate on
 * the whole page — the page itself stays readable signed out.
 */
export default async function ChallengePage(props: PageProps<"/challenges/[id]">) {
  const { id } = await props.params;
  const db = await getAppDb();
  const now = new Date();

  const [result, session] = await Promise.all([
    getChallengeView({
      challenges: createChallengeRepository(db),
      riotAccounts: createRiotAccountRepository(db),
      polling: createPollingRepository(db),
      now: () => now,
    })(id),
    auth(),
  ]);

  if (result.kind === "not_found") notFound();

  const accounts = session?.user?.id
    ? await createRiotAccountRepository(db).listByUser(session.user.id)
    : null;

  return (
    <main className="mx-auto w-full max-w-container-max px-5 py-10 lg:px-10 lg:py-16">
      <ChallengeViewBody
        view={result.view}
        shareUrl={`/challenges/${id}`}
        now={now}
        joinSlot={<JoinForm challengeId={id} accounts={accounts} />}
      />
    </main>
  );
}
