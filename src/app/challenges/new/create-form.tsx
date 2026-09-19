"use client";

import { useActionState } from "react";

import { createChallengeAction } from "@/app/challenges/new/actions";
import { CreateFormBody } from "@/app/challenges/new/create-form-body";
import type { RiotAccount } from "@/domain/ports/riot-account-repository";

export { messageFor } from "@/app/challenges/new/create-form-body";

/**
 * The composition root for the create-challenge wizard: `useActionState`
 * bound to `createChallengeAction`, per design.md §8's `/challenges/new`
 * skeleton. Deliberately thin — every structural, self-join, and
 * `messageFor` detail lives in `create-form-body.tsx`; see that file's doc
 * comment for exactly why the split exists (it is not stylistic).
 */
export type CreateFormProps = {
  accounts: RiotAccount[];
};

export function CreateForm({ accounts }: CreateFormProps) {
  const [state, formAction, pending] = useActionState(createChallengeAction, null);

  return (
    <CreateFormBody accounts={accounts} state={state} formAction={formAction} pending={pending} />
  );
}
