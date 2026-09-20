"use client";

import { useState } from "react";

import type { JoinChallengeActionState } from "@/app/challenges/[id]/actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { RiotAccount } from "@/domain/ports/riot-account-repository";

/**
 * `/challenges/[id]`'s join form — everything structural and testable,
 * split out of `join-form.tsx` for the same reason `create-form-body.tsx`
 * is split from `create-form.tsx`: `join-form.tsx` imports the runtime
 * value `joinChallengeAction` from `./actions`, and `./actions`
 * transitively imports `@/auth`, which fails to resolve under plain
 * Vitest. This file imports neither, so it is importable by a test at all.
 *
 * challenge-participation: Account Selection When Multiple Linked Accounts
 * Exist (single account joins with no picker, several render a `Select`),
 * Idempotent Duplicate-Free Join, Inline Result Reporting.
 */

/**
 * A message per action-state `kind`, in English, verbatim from design.md's
 * join-form message table. `accountName` fills `joined`'s placeholder —
 * `JoinChallengeResult`'s `joined` variant carries no account identity of
 * its own, so the caller supplies the name of whichever account the form
 * actually submitted. `null` state (nothing submitted yet) and
 * `unauthenticated` (unreachable — `joinChallengeAction` redirects instead
 * of returning it, see actions.ts) both yield `null`.
 */
export function messageFor(
  state: JoinChallengeActionState | null,
  accountName: string,
): string | null {
  if (!state) return null;

  switch (state.kind) {
    case "joined":
      return `You joined with ${accountName}.`;
    case "already_joined":
      return "You have already joined this challenge.";
    case "challenge_ended":
      return "This challenge has ended, so it can no longer be joined.";
    case "challenge_not_found":
      return "This challenge no longer exists.";
    case "riot_account_not_owned":
      return "That Riot account is not linked to your sign-in.";
    case "unauthenticated":
      return null;
  }
}

export type JoinFormBodyProps = {
  challengeId: string;
  /** Always non-empty — `join-form.tsx` renders a different branch at zero accounts. */
  accounts: RiotAccount[];
  state: JoinChallengeActionState | null;
  formAction: (formData: FormData) => void;
  pending: boolean;
};

export function JoinFormBody({ challengeId, accounts, state, formAction, pending }: JoinFormBodyProps) {
  const firstAccount = accounts[0];
  const [selectedAccountId, setSelectedAccountId] = useState(firstAccount?.id ?? "");
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? firstAccount;
  const accountName = selectedAccount ? `${selectedAccount.gameName}#${selectedAccount.tagLine}` : "";
  const message = messageFor(state, accountName);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="challengeId" value={challengeId} />

      {accounts.length === 1 && firstAccount ? (
        <input type="hidden" name="riotAccountId" value={firstAccount.id} />
      ) : (
        <Select
          label="Join as"
          name="riotAccountId"
          defaultValue={selectedAccountId}
          onChange={(event) => setSelectedAccountId(event.target.value)}
          options={accounts.map((account) => ({
            value: account.id,
            label: `${account.gameName}#${account.tagLine}`,
          }))}
        />
      )}

      <Button type="submit" loading={pending}>
        Join
      </Button>

      {message ? (
        <p role="status" className="text-body-sm text-text-secondary">
          {message}
        </p>
      ) : null}
    </form>
  );
}
