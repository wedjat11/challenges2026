"use client";

import { useActionState } from "react";

import { linkRiotAccountAction, type LinkRiotAccountActionState } from "@/app/account/actions";
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

const INITIAL_STATE: LinkRiotAccountActionState | null = null;

export function LinkRiotAccountForm() {
  const [state, formAction, isPending] = useActionState(linkRiotAccountAction, INITIAL_STATE);
  const message = messageFor(state);
  const succeeded = state?.kind === "linked" || state?.kind === "already_linked";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="riotId" className="block text-sm font-medium">
          Riot ID
        </label>
        <input
          id="riotId"
          name="riotId"
          type="text"
          placeholder="GameName#TAG"
          required
          className="mt-1 w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </div>

      <div>
        <label htmlFor="platform" className="block text-sm font-medium">
          Platform
        </label>
        <select
          id="platform"
          name="platform"
          defaultValue={DEFAULT_PLATFORM}
          className="mt-1 w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {PLATFORM_LABELS[platform]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-black/10 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-white/15"
      >
        {isPending ? "Linking…" : "Link account"}
      </button>

      {message ? (
        <p
          className={
            succeeded
              ? "text-sm text-green-600 dark:text-green-400"
              : "text-sm text-red-600 dark:text-red-400"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
