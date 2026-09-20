import type { Metadata } from "next";

import { createChallengeRepository } from "@/adapters/db/challenge-repository";
import { BrowseList } from "@/app/challenges/browse-list";
import { listPublicChallenges } from "@/application/list-public-challenges";
import { getAppDb } from "@/lib/db";

export const metadata: Metadata = {
  title: "Challenges",
};

/**
 * `/challenges` — discovery. Readable signed out (no `auth()` gate):
 * challenge-discovery: Public Read Access. Thin server root, untested like
 * `/challenges/new`'s `page.tsx` — it imports `@/lib/db`'s Cloudflare
 * context, so every branch with behaviour lives in `BrowseList`
 * (`browse-list.tsx`), which is fully covered under `renderToStaticMarkup`.
 *
 * `listPublicChallenges` already applies the ordering and window scoping
 * (challenge-discovery: Listing Scope, Ordering) and the default limit; no
 * tabs, stat tiles, ranking module, or `actions.ts` — this route has no
 * mutation.
 */
export default async function ChallengesPage() {
  const db = await getAppDb();
  const challenges = await listPublicChallenges({
    challenges: createChallengeRepository(db),
    now: () => new Date(),
  })();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
      <h1 className="font-display text-title-2 tracking-title text-text-primary">
        Challenges
      </h1>
      <div className="mt-8">
        <BrowseList challenges={challenges} />
      </div>
    </main>
  );
}
