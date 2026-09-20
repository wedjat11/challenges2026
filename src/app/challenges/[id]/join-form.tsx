"use client";

import Link from "next/link";
import { useActionState } from "react";

import { joinChallengeAction, type JoinChallengeActionState } from "@/app/challenges/[id]/actions";
import { JoinFormBody } from "@/app/challenges/[id]/join-form-body";
import { withReturnPath } from "@/app/login/return-path";
import type { RiotAccount } from "@/domain/ports/riot-account-repository";

/**
 * `/challenges/[id]`'s join control, mounted into `ChallengeViewBody`'s
 * `joinSlot`. Untested directly — imports the runtime value
 * `joinChallengeAction` from `./actions`, which transitively imports
 * `@/auth` and fails to resolve under plain Vitest (same constraint
 * `create-form.tsx` documents); every branch with behaviour lives in the
 * tested `JoinFormBody` this composes.
 *
 * **Signed-out decision, stated plainly.** `joinChallengeAction` already
 * redirects to `/account?reason=sign-in-to-join` if it is ever reached
 * signed out (D18) — but the challenge page itself is readable signed out
 * (challenge-view: Unauthenticated Read Access Including Unlisted), and
 * making a signed-out visitor submit a form only to be redirected is a
 * worse experience than telling them up front. `page.tsx` passes
 * `accounts: null` when there is no session; this component renders a
 * plain "Sign in to join" link to `/login`, carrying `from` via
 * `withReturnPath` so the visitor returns to this exact challenge after
 * signing in — no form submission, no redirect round-trip needed for the
 * common case. Zero-linked-accounts (signed in) gets the equivalent
 * treatment: a link to `/account` instead of an empty picker, matching
 * `create-form-body.tsx`'s `SelfJoinControl` precedent for the same
 * situation.
 */

export type JoinFormProps = {
  challengeId: string;
  /** `null` means no authenticated session. */
  accounts: RiotAccount[] | null;
};

const INITIAL_STATE: JoinChallengeActionState | null = null;

export function JoinForm({ challengeId, accounts }: JoinFormProps) {
  const [state, formAction, pending] = useActionState(joinChallengeAction, INITIAL_STATE);

  if (accounts === null) {
    return (
      <Link
        href={withReturnPath("/login", `/challenges/${challengeId}`)}
        className="text-body-sm text-text-accent underline underline-offset-4"
      >
        Sign in to join
      </Link>
    );
  }

  if (accounts.length === 0) {
    return (
      <p className="text-body-sm text-text-muted">
        <Link href="/account" className="underline underline-offset-4">
          Link a Riot account
        </Link>{" "}
        to join this challenge.
      </p>
    );
  }

  return (
    <JoinFormBody
      challengeId={challengeId}
      accounts={accounts}
      state={state}
      formAction={formAction}
      pending={pending}
    />
  );
}
