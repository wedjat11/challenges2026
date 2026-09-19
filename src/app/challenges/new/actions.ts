"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createChallengeRepository } from "@/adapters/db/challenge-repository";
import { createRiotAccountRepository } from "@/adapters/db/riot-account-repository";
import { auth } from "@/auth";
import { createChallenge, type CreateChallengeResult } from "@/application/create-challenge";
import { getAppDb } from "@/lib/db";

/** Action state also covers the one failure the use case itself never sees. */
export type CreateChallengeActionState = CreateChallengeResult | { kind: "unauthenticated" };

/**
 * `useActionState` form action for the create-challenge wizard.
 *
 * Builds its dependencies per call rather than at module load, matching
 * `linkRiotAccountAction` — `getAppDb` needs the request-scoped Cloudflare
 * context, which does not exist until a request is in flight. A Server
 * Function is reachable by direct POST (Next docs, `07-mutating-data.md`),
 * so `auth()` is checked here even though the page above already gates
 * rendering the form.
 *
 * `self-join` fields: `formData.get("selfJoin")` is `"on"` only when the
 * checkbox was rendered *and* checked (an unchecked or absent checkbox
 * submits nothing at all); `joinAsRiotAccountId` is only trusted alongside
 * it. At 0 linked accounts the create form renders neither field, so both
 * reads fall through to `null`/`""` here regardless — no special-casing
 * needed on this side.
 */
export async function createChallengeAction(
  // `null` is `useActionState`'s initial value, before any submission exists.
  _prevState: CreateChallengeActionState | null,
  formData: FormData,
): Promise<CreateChallengeActionState> {
  const session = await auth();
  if (!session?.user?.id) return { kind: "unauthenticated" };

  const db = await getAppDb();
  const create = createChallenge({
    challenges: createChallengeRepository(db),
    riotAccounts: createRiotAccountRepository(db),
    newId: () => crypto.randomUUID(),
  });

  const selfJoin = String(formData.get("selfJoin") ?? "") === "on";
  const riotAccountId = String(formData.get("joinAsRiotAccountId") ?? "");
  const joinAsRiotAccountId = selfJoin && riotAccountId.length > 0 ? riotAccountId : null;

  const result = await create({
    ownerId: session.user.id,
    title: String(formData.get("title") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    visibility: String(formData.get("visibility") ?? ""),
    rulesJson: String(formData.get("rulesJson") ?? ""),
    joinAsRiotAccountId,
  });

  if (result.kind !== "created") return result;

  revalidatePath("/challenges");
  redirect(`/challenges/${result.id}`); // throws; outside any try (Next docs)
}
