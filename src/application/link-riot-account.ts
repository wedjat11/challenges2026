import { MatchProviderError, type MatchProvider } from "@/domain/ports/match-provider";
import type { RiotAccount, RiotAccountRepository } from "@/domain/ports/riot-account-repository";
import {
  accountRegionForPlatform,
  isPlatform,
  parseRiotId,
  type AccountRegion,
  type RiotIdParseReason,
} from "@/domain/riot-id";

export type LinkRiotAccountInput = { userId: string; riotId: string; platform: string };

/**
 * What linking an account can come back as, told in terms the UI can turn
 * straight into a message. Expected outcomes — a malformed Riot ID, a Riot ID
 * Riot has never heard of, Riot being unreachable — are returned as values
 * here, not thrown. An infrastructure failure such as a database error still
 * rejects: it is not an outcome of this use case, just a place it can fail.
 */
export type LinkRiotAccountResult =
  | { kind: "linked" | "already_linked"; account: RiotAccount }
  | { kind: "invalid_riot_id"; reason: RiotIdParseReason }
  | { kind: "invalid_platform" }
  | { kind: "not_found" }
  | { kind: "claimed_by_other_user" }
  | { kind: "riot_unavailable"; status?: number };

/**
 * Resolves a typed Riot ID to a PUUID and links it to a user.
 *
 * `matchProviderFor` is a factory rather than one injected `MatchProvider`
 * because the right regional host depends on the platform the user picked —
 * known only once the input arrives, not at wiring time.
 */
export function linkRiotAccount(deps: {
  riotAccounts: RiotAccountRepository;
  matchProviderFor: (region: AccountRegion) => MatchProvider;
}): (input: LinkRiotAccountInput) => Promise<LinkRiotAccountResult> {
  return async (input: LinkRiotAccountInput): Promise<LinkRiotAccountResult> => {
    const parsed = parseRiotId(input.riotId);
    if (!parsed.ok) return { kind: "invalid_riot_id", reason: parsed.reason };

    if (!isPlatform(input.platform)) return { kind: "invalid_platform" };
    const platform = input.platform;

    let puuid: string;
    try {
      // `matchProviderFor` is called inside the try too: it throws when
      // `RIOT_API_KEY` is unset (see src/lib/riot.ts), and that failure is
      // just as much an "unavailable" outcome as a failed HTTP call — it must
      // not escape the typed result the rest of this function promises.
      //
      // `accountRegionForPlatform`, not `regionForPlatform`: this call hits
      // account-v1, which has no `sea` cluster (see its doc comment). The
      // repository below still derives and stores the match-v5 region from
      // `platform` directly.
      const matchProvider = deps.matchProviderFor(accountRegionForPlatform(platform));
      puuid = await matchProvider.resolvePuuid(parsed.gameName, parsed.tagLine);
    } catch (error) {
      if (error instanceof MatchProviderError) {
        if (error.status === 404) return { kind: "not_found" };
        console.error("link-riot-account: match provider failed", { status: error.status });
        return { kind: "riot_unavailable", status: error.status };
      }
      // Never leak an unknown error's message or stack — only the fact that
      // it happened, with no status since it is not a MatchProviderError.
      console.error("link-riot-account: match provider failed", { status: undefined });
      return { kind: "riot_unavailable" };
    }

    return deps.riotAccounts.link({
      userId: input.userId,
      puuid,
      gameName: parsed.gameName,
      tagLine: parsed.tagLine,
      platform,
    });
  };
}
