"use client";

import { useActionState } from "react";

import { linkRiotAccountAction, type LinkRiotAccountActionState } from "@/app/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  DEFAULT_PLATFORM,
  PLATFORM_LABELS,
  PLATFORMS,
  type RiotIdParseReason,
} from "@/domain/riot-id";

/**
 * A human message per result kind, so the page never shows a raw `kind`
 * string or a leaked error message to the user.
 */
function messageFor(state: LinkRiotAccountActionState | null): string | null {
  if (!state) return null;

  switch (state.kind) {
    case "linked":
      return `Linked ${state.account.gameName}#${state.account.tagLine}.`;
    case "already_linked":
      return "That account is already linked.";
    case "invalid_riot_id":
      return INVALID_RIOT_ID_MESSAGES[state.reason];
    case "invalid_platform":
      return "Choose a valid platform.";
    case "not_found":
      return "That Riot ID was not found on the selected platform.";
    case "claimed_by_other_user":
      return "Already linked to another account.";
    case "riot_unavailable":
      return "Riot is unavailable right now, try again later.";
    case "unauthenticated":
      return "Sign in to link a Riot account.";
  }
}

const INVALID_RIOT_ID_MESSAGES: Record<RiotIdParseReason, string> = {
  missing_tag: "Enter a Riot ID as GameName#TAG.",
  game_name_length: "Game name must be 3–16 characters.",
  tag_line_format: "Tag line must be 3–5 letters or numbers.",
};

const PLATFORM_OPTIONS = PLATFORMS.map((platform) => ({
  value: platform,
  label: PLATFORM_LABELS[platform],
}));

const INITIAL_STATE: LinkRiotAccountActionState | null = null;

/**
 * Ported onto the S1 form primitives (design.md §6.2 deviation note): same
 * `name`s (`riotId`, `platform`), `id`s, labels, `required`, `defaultValue`,
 * and `useActionState` wiring as before — only the rendering shifted from
 * raw `<input>`/`<select>`/`<button>` to `Input`/`Select`/`Button`, which
 * drops every light-OS-variant utility pair here by construction (D9's
 * uncontrolled contract is unaffected: no `value`/`onChange` was added).
 */
export function LinkRiotAccountForm() {
  const [state, formAction, isPending] = useActionState(linkRiotAccountAction, INITIAL_STATE);
  const message = messageFor(state);
  const succeeded = state?.kind === "linked" || state?.kind === "already_linked";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input id="riotId" name="riotId" label="Riot ID" type="text" placeholder="GameName#TAG" required />

      <Select
        id="platform"
        name="platform"
        label="Platform"
        defaultValue={DEFAULT_PLATFORM}
        options={PLATFORM_OPTIONS}
      />

      <Button type="submit" variant="outline" disabled={isPending} loading={isPending}>
        {isPending ? "Linking…" : "Link account"}
      </Button>

      {message ? (
        <p className={succeeded ? "text-body-sm text-green-500" : "text-body-sm text-red-500"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
