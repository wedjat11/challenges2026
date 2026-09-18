import { toMatchSummary } from "@/adapters/riot/match-mapper";
import { retryAfterMs } from "@/adapters/riot/rate-limit";
import type { MatchSummary } from "@/domain/match";
import { MatchProviderError, type MatchProvider } from "@/domain/ports/match-provider";

/**
 * Riot's HTTP client: the one place that knows Riot's hosts, paths and auth.
 *
 * `fetch` and `sleep` are injected so the whole thing is testable offline. No
 * test in this repo makes a live call — fixtures were recorded once, by hand.
 */
/**
 * The slice of a response this client uses.
 *
 * Declared rather than borrowed from the platform's `Response`: demanding the
 * full WHATWG surface would mean no honest test double could satisfy it, and
 * this client reads four things.
 */
export type HttpResponse = {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
};

export type HttpFetch = (
  url: string,
  init: { headers: Record<string, string> },
) => Promise<HttpResponse>;

export type RiotApiConfig = {
  apiKey: string;
  /** Regional cluster for account-v1 and match-v5: americas, europe, asia. */
  region: string;
  /**
   * Platform shard for summoner-v4 and league-v4: la1, la2, na1, euw1, …
   * Optional because nothing in this client reads it yet — every request this
   * adapter makes today goes to the regional host derived from `region`.
   */
  platform?: string;
  fetch?: HttpFetch;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
};

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_MATCH_COUNT = 20;

export function createRiotApi(config: RiotApiConfig): MatchProvider {
  const doFetch: HttpFetch = config.fetch ?? globalThis.fetch;
  const sleep = config.sleep ?? ((ms: number) => new Promise((done) => setTimeout(done, ms)));
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;

  const regionalHost = `https://${config.region}.api.riotgames.com`;

  /**
   * Performs a request, waiting out 429s up to `maxRetries`.
   *
   * Only 429 is retried. A 404 means the Riot ID does not exist and a 403 means
   * the key is bad or expired; retrying either just burns budget.
   */
  async function get<T>(url: string): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      const response = await doFetch(url, {
        // The key travels as a header, never in the URL: query strings end up in
        // access logs, proxies and browser history.
        headers: { "X-Riot-Token": config.apiKey, Accept: "application/json" },
      });

      if (response.ok) return (await response.json()) as T;

      if (response.status === 429) {
        if (attempt >= maxRetries) {
          throw new Error(`Riot rate limit not cleared after ${maxRetries} retries`);
        }
        await sleep(retryAfterMs(response.headers.get("retry-after") ?? undefined));
        continue;
      }

      // Deliberately reports the status only. The key must never reach a log
      // line, and Riot's error bodies can echo request details.
      throw new MatchProviderError(response.status);
    }
  }

  return {
    async resolvePuuid(gameName: string, tagLine: string): Promise<string> {
      const path = `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        gameName,
      )}/${encodeURIComponent(tagLine)}`;
      const account = await get<{ puuid: string }>(`${regionalHost}${path}`);
      return account.puuid;
    },

    async listMatchIds(
      puuid: string,
      options: { count?: number; startTime?: Date } = {},
    ): Promise<string[]> {
      const query = new URLSearchParams({
        start: "0",
        count: String(options.count ?? DEFAULT_MATCH_COUNT),
      });
      if (options.startTime) {
        // Riot expects whole seconds here, not milliseconds.
        query.set("startTime", String(Math.floor(options.startTime.getTime() / 1000)));
      }

      return get<string[]>(
        `${regionalHost}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?${query}`,
      );
    },

    async fetchMatch(matchId: string, puuid: string): Promise<MatchSummary> {
      const match = await get<Parameters<typeof toMatchSummary>[0]>(
        `${regionalHost}/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
      );
      return toMatchSummary(match, puuid);
    },
  };
}
