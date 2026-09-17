/**
 * Riot publishes the budget it is enforcing on every response, and warns not to
 * hardcode the numbers because they change. So the adapter reads them instead of
 * assuming them.
 *
 * Header shape is `limit:windowSeconds` pairs, comma separated:
 *   X-App-Rate-Limit:       20:1,100:120
 *   X-App-Rate-Limit-Count:  3:1, 90:120
 *
 * Several buckets apply at once and the tightest one binds. A personal key's
 * "20 per second" is a burst allowance; its "100 per 2 minutes" is the real
 * sustained budget, 0.83 requests a second.
 */
export type RateLimitBucket = {
  limit: number;
  windowSeconds: number;
};

const DEFAULT_RETRY_MS = 1000;

export function parseRateLimit(header: string | undefined): RateLimitBucket[] {
  if (!header) return [];

  const buckets: RateLimitBucket[] = [];
  for (const part of header.split(",")) {
    const [limit, windowSeconds] = part.trim().split(":");
    const parsedLimit = Number(limit);
    const parsedWindow = Number(windowSeconds);

    // A header we cannot read is not a header granting unlimited budget.
    if (!limit || !windowSeconds) return [];
    if (!Number.isFinite(parsedLimit) || !Number.isFinite(parsedWindow)) return [];

    buckets.push({ limit: parsedLimit, windowSeconds: parsedWindow });
  }
  return buckets;
}

/**
 * How many more requests the tightest bucket allows right now.
 *
 * Returns 0 when the headers are missing. Guessing generously would mean
 * spending a budget we cannot see and earning a 429, so an unknown budget is
 * treated as an exhausted one.
 */
export function headroom(
  limitHeader: string | undefined,
  countHeader: string | undefined,
): number {
  const limits = parseRateLimit(limitHeader);
  const counts = parseRateLimit(countHeader);
  if (limits.length === 0) return 0;

  const remaining = limits.map((bucket) => {
    const used = counts.find((count) => count.windowSeconds === bucket.windowSeconds);
    return bucket.limit - (used?.limit ?? 0);
  });

  return Math.max(0, Math.min(...remaining));
}

/** How long a 429 asked us to wait. Riot sends whole seconds in `Retry-After`. */
export function retryAfterMs(header: string | undefined): number {
  const seconds = Number(header);
  if (!header || !Number.isFinite(seconds) || seconds <= 0) return DEFAULT_RETRY_MS;
  return seconds * 1000;
}
