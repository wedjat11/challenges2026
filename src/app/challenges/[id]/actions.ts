"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createChallengeRepository } from "@/adapters/db/challenge-repository";
import { createRiotAccountRepository } from "@/adapters/db/riot-account-repository";
import { auth } from "@/auth";
import { joinChallenge, type JoinChallengeResult } from "@/application/join-challenge";
import { getAppDb } from "@/lib/db";

/**
 * Symmetric with `CreateChallengeActionState` (matching design.md's own
 * skeleton), though `unauthenticated` is unreachable through this action's
 * own return path — the signed-out and no-linked-account cases both
 * `redirect()` instead of returning, per D18 and challenge-participation:
 * Sign-In and Linked Account Required to Join.
 */
export type JoinChallengeActionState = JoinChallengeResult | { kind: "unauthenticated" };

/**
 * `useActionState` form action for `JoinForm`.
 *
 * Untested directly — this file transitively imports `@/auth`, which fails
 * to resolve under plain Vitest (same constraint `create-form.tsx`'s split
 * from `create-form-body.tsx` and `/login`'s `actions.ts` already document
 * in this codebase; no existing test in this repo imports `@/auth`). Every
 * branch with behaviour this action drives (`messageFor`, the account
 * picker) lives in the tested `join-form-body.tsx`.
 *
 * The chosen `riotAccountId` is always re-verified against the session
 * inside `joinChallenge` — a Server Function is reachable by direct POST
 * (Next docs, `07-mutating-data.md`), so the form never trusts the client
 * for `userId`, and `riotAccountId` is only ever a hint the use case
 * confirms ownership of.
 */
export async function joinChallengeAction(
  // `null` is `useActionState`'s initial value, before any submission exists.
  _prevState: JoinChallengeActionState | null,
  formData: FormData,
): Promise<JoinChallengeActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/account?reason=sign-in-to-join"); // throws; outside any try (Next docs)

  const db = await getAppDb();
  const riotAccounts = createRiotAccountRepository(db);
  const accounts = await riotAccounts.listByUser(session.user.id);
  if (accounts.length === 0) redirect("/account?reason=link-account-to-join");

  const challengeId = String(formData.get("challengeId") ?? "");
  const riotAccountId = String(formData.get("riotAccountId") ?? accounts[0]!.id);

  const result = await joinChallenge({
    challenges: createChallengeRepository(db),
    riotAccounts,
    now: () => new Date(),
  })({ userId: session.user.id, challengeId, riotAccountId });

  if (result.kind === "joined") revalidatePath(`/challenges/${challengeId}`); // literal path, no type

  return result;
}
