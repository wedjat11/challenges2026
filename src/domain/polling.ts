/**
 * Pure scheduling logic for the polling pipeline: which match ids are new,
 * and when a player should be polled again. No I/O, no clock reads — every
 * input that affects the answer is an argument, the same discipline
 * `evaluate` in progress.ts follows.
 */

/**
 * Match ids not yet seen, in the order Riot returned them.
 *
 * match-v5 returns ids newest first, and an id is a platform-prefixed string
 * like `LA1_1234567890` — lexical or numeric comparison across platforms is
 * not chronological, so "newer than `lastMatchId`" cannot be decided by
 * comparing id values. It can only be decided by position: everything before
 * the last seen id in Riot's own (newest-first) ordering is new. When
 * `lastMatchId` is `null` (no state yet) or is not present in `ids` (it fell
 * outside the fetched page, or polling never saw it), every id counts as new.
 */
export function idsNewerThan(ids: readonly string[], lastMatchId: string | null): string[] {
  if (lastMatchId === null) return [...ids];

  const index = ids.indexOf(lastMatchId);
  if (index === -1) return [...ids];

  return ids.slice(0, index);
}

/**
 * Decides what a single page of match ids contributes to the "new since last
 * poll" set, and whether paging can stop.
 *
 * `idsNewerThan` already knows how to find the boundary within one page; this
 * adds the two other reasons paging can stop, neither of which depends on
 * which page number this is (that bookkeeping, and the `MAX_PAGES` safety
 * valve, belong to the caller — the only place that knows how many pages it
 * has already fetched):
 *
 * - `lastMatchId` was found in this page: everything before it is new, and
 *   everything at or after it was already seen.
 * - `lastMatchId` was not found, but the page came back shorter than
 *   `PAGE_SIZE`: Riot has nothing older to page through since `startTime`, so
 *   the whole page is new and there is nothing left to fetch.
 *
 * Otherwise the page is full and the boundary has not been reached yet —
 * everything in it is new, but the caller should fetch another page.
 */
export function collectNewIds(
  page: readonly string[],
  lastMatchId: string | null,
): { newIds: string[]; done: boolean } {
  const boundaryFound = lastMatchId !== null && page.includes(lastMatchId);
  return {
    newIds: idsNewerThan(page, lastMatchId),
    done: boundaryFound || page.length < PAGE_SIZE,
  };
}

/** How many match ids `listMatchIds` is asked for per page while paging. */
export const PAGE_SIZE = 20;

/**
 * How many pages one pass (`pollPlayer`'s forward pass, or its backward
 * pass — see `nextCoveredFrom`) will fetch for one player in one poll,
 * however many new matches there turn out to be. Bounds Riot spend per pass
 * to `MAX_PAGES * PAGE_SIZE` (100) `listMatchIds` results. A pass truncated
 * by this bound behaves differently per pass, and honestly in both. The
 * backward pass reports how far it actually got via `nextCoveredFrom`, so a
 * later poll resumes from there. The forward pass still advances
 * `lastMatchId` to the newest id, which means matches older than the 100 it
 * fetched but newer than the previous `lastMatchId` are skipped, not
 * deferred: nothing records that they were missed. That is a deliberate
 * trade — the poll interval is capped at six hours and nobody plays a
 * hundred games in six hours — chosen over unbounded Riot calls for a
 * player whose gap is wrong.
 */
export const MAX_PAGES = 5;

/**
 * How long a poll message may sit claimed before the next cron tick would
 * enqueue it again.
 *
 * Steady-state polls are cheap — 1 to 6 Riot calls, since most polls find
 * the previous boundary in the first page and fetch only a handful of new
 * matches. What sizes this lease is the expensive case: a player's first
 * poll ever, or one resuming a backfill, can run both the forward pass and
 * the backward pass at their full `MAX_PAGES` bound — up to
 * 2 × (`MAX_PAGES` `listMatchIds` calls + `MAX_PAGES * PAGE_SIZE`
 * `fetchMatch` calls) ≈ 2 × (5 + 100) = 210 Riot calls for that one player.
 * `DEFAULT_BATCH_SIZE` (enqueue-due-players.ts) players all landing in that
 * worst case in the same batch — 10 × 210 = 2,100 calls — takes roughly
 * 2,100 / 100 × 2 ≈ 42 minutes at Riot's 100 requests / 2 minutes limit,
 * comfortably inside this 60 minute lease.
 *
 * If a lease does expire before a batch finishes, the only consequence is a
 * duplicate poll: `pollPlayer`'s cache upserts by `(matchId, puuid)` and its
 * progress is re-evaluated from the cache each time, so re-running it never
 * corrupts anything — it just spends a second round of Riot calls the first
 * run would otherwise have made unnecessary.
 */
export const LEASE_DURATION_MS = 60 * 60 * 1000;

/** New matches mean the player might be mid-session: poll again soon. */
export const NEW_MATCH_POLL_INTERVAL_MS = 15 * 60 * 1000;

/** The idle backoff never drops below this, and a first idle poll starts here. */
export const MIN_IDLE_POLL_INTERVAL_MS = NEW_MATCH_POLL_INTERVAL_MS;

/** Neither an idle backoff nor a failure backoff grows past this, however long the streak. */
export const POLL_INTERVAL_CAP_MS = 6 * 60 * 60 * 1000;

/** The first retry after a provider failure waits this long; each further failure doubles it. */
export const FAILURE_BASE_INTERVAL_MS = 5 * 60 * 1000;

/**
 * What a poll attempt came back with, in the terms `nextPollAfter` needs to
 * schedule the next one.
 *
 * `previousIntervalMs` carries the idle backoff forward without a dedicated
 * "idle streak" column: `poll_state` has no such column (see schema.ts), so
 * rather than add one, the time elapsed since the player's last completed
 * poll (`now - lastPolledAt`, computed by the caller — see
 * `elapsedSinceLastPollMs` in poll-player.ts) is reused and doubled. This
 * does not depend on `nextPollAfter`, which `enqueueDuePlayers` overwrites
 * with the lease boundary before every poll runs, and doubling the elapsed
 * time is self-correcting regardless of what was scheduled before. `null`
 * means there is nothing to double (first poll ever, or a prior state that
 * was never actually polled), and backoff starts from
 * `MIN_IDLE_POLL_INTERVAL_MS`.
 */
export type PollOutcome =
  | { kind: "polled"; newMatches: number; previousIntervalMs: number | null }
  | { kind: "failed"; failureCount: number };

/**
 * When a player should be polled again, given what the last attempt found.
 *
 * - New matches: back to 15 minutes — the player might still be playing.
 * - Idle (polled, nothing new): double the previous interval, floored at 15
 *   minutes and capped at 6 hours, so a player who stopped playing weeks ago
 *   is not polled at the same cadence as someone mid-session.
 * - Failed: 5 minutes times two to the power of (failures - 1), capped at 6
 *   hours — the same shape as the idle backoff, so a broken account or a
 *   sustained Riot outage stops costing Queue operations quickly.
 */
export function nextPollAfter(now: Date, outcome: PollOutcome): Date {
  return new Date(now.getTime() + pollDelayMs(outcome));
}

function pollDelayMs(outcome: PollOutcome): number {
  if (outcome.kind === "failed") {
    const delay = FAILURE_BASE_INTERVAL_MS * 2 ** (outcome.failureCount - 1);
    return Math.min(delay, POLL_INTERVAL_CAP_MS);
  }

  if (outcome.newMatches > 0) return NEW_MATCH_POLL_INTERVAL_MS;

  const previous = outcome.previousIntervalMs ?? 0;
  return Math.min(Math.max(previous * 2, MIN_IDLE_POLL_INTERVAL_MS), POLL_INTERVAL_CAP_MS);
}

/**
 * Whether this poll's `startTime` reaches earlier than everything already
 * fetched for the player (`coveredFrom`), meaning the gap between the new
 * start and the previous coverage boundary has never been paged and must be
 * backfilled from the beginning rather than picking up at `lastMatchId`.
 *
 * `coveredFrom === null` means nothing has ever been fetched, so every first
 * poll counts as needing a backfill of the challenge's own start. Equal
 * values are not a backfill: `startTime` has already been covered exactly up
 * to that point, and paging can safely resume at `lastMatchId`.
 */
export function needsBackfill(coveredFrom: Date | null, startTime: Date): boolean {
  return coveredFrom === null || startTime.getTime() < coveredFrom.getTime();
}

/**
 * Decides the new `coveredFrom` from what a backward pass found, once
 * `needsBackfill` decided one had to run — a poll that skipped the backward
 * pass entirely leaves `coveredFrom` untouched, and never calls this.
 *
 * - `completed`: the pass reached `startTime` itself (a short page ended it,
 *   or — on a genuinely first poll, `previous === null` — the forward pass
 *   already walked back from position 0 and stood in for the backward pass;
 *   see `pollPlayer`). Coverage is now exactly `startTime`.
 * - Truncated (`MAX_PAGES` bound the pass before it got there):
 *   `oldestFetchedAt` is the oldest `playedAt` the pass actually saw —
 *   whether freshly fetched or already cached, since a cached id still
 *   proves coverage that far back — and only ever cited if it is older than
 *   `startTime`, so it is a genuine (if partial) improvement. When the pass
 *   saw nothing at all (see poll-player.ts: every id it paged through was
 *   already cached, or the cache itself came back empty in range), there is
 *   nothing to improve coverage with, and `previous` is kept — or
 *   `startTime`, on a first poll where there was no `previous` yet.
 *
 * The final `Math.min` against `previous` is a safety net, not the normal
 * path — every branch above is already at least as deep as `previous` by
 * construction of `needsBackfill` and how paging works — but coverage is a
 * one-way ratchet (see `pollPlayer`'s old formula this replaces), and a pure
 * function should not have to trust every caller to preserve that on its
 * own.
 */
export function nextCoveredFrom(input: {
  completed: boolean;
  oldestFetchedAt: Date | null;
  startTime: Date;
  previous: Date | null;
}): Date {
  const candidate = input.completed
    ? input.startTime
    : (input.oldestFetchedAt ?? input.previous ?? input.startTime);
  if (input.previous === null) return candidate;
  return new Date(Math.min(candidate.getTime(), input.previous.getTime()));
}

/**
 * How far out to claim a player when enqueuing them.
 *
 * The cron trigger and the queue consumer are separate invocations: without a
 * lease, a message still in flight (or briefly stuck) would look "due" to the
 * very next cron tick and get enqueued a second time.
 */
export function leaseUntil(now: Date): Date {
  return new Date(now.getTime() + LEASE_DURATION_MS);
}
