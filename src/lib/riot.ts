import { createRiotApi } from "@/adapters/riot/riot-api";
import type { MatchProvider } from "@/domain/ports/match-provider";
import type { AccountRegion } from "@/domain/riot-id";

/**
 * Builds a `MatchProvider` for one Riot routing region, reading the key from
 * the Worker secret Cloudflare populates into `process.env`.
 *
 * A factory, not a singleton: the right region depends on the platform the
 * caller is acting on, which is only known once a request arrives — see
 * `linkRiotAccount`'s `matchProviderFor` dependency.
 */
export function matchProviderFor(region: AccountRegion): MatchProvider {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    throw new Error("RIOT_API_KEY is not set — cannot talk to Riot's API");
  }

  return createRiotApi({
    apiKey,
    region,
    // This factory backs the interactive link-account server action: a 429
    // here must surface as `riot_unavailable` immediately rather than stall
    // the request behind the adapter's default of 3 retries with
    // Retry-After sleeps. T11's polling pipeline will build its own provider
    // with retries, where waiting out a rate limit is fine.
    maxRetries: 0,
  });
}
