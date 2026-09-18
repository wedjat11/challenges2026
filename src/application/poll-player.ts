import {
  MAX_PAGES,
  PAGE_SIZE,
  POLL_INTERVAL_CAP_MS,
  collectNewIds,
  needsBackfill,
  nextCoveredFrom,
  nextPollAfter,
} from "@/domain/polling";
import { evaluate } from "@/domain/progress";
import type { ChallengeRepository } from "@/domain/ports/challenge-repository";
import { MatchProviderError, type MatchProvider } from "@/domain/ports/match-provider";
import type { PollState, PollTarget, PollingRepository } from "@/domain/ports/polling-repository";
import { regionForPlatform, type Region } from "@/domain/riot-id";

/**
 * What polling one player came back as. `no_active_challenges` and `failed`
 * are expected outcomes, told as values rather than thrown — the queue
 * consumer (work unit B) acks the message either way, since neither is a
 * reason to retry the message itself; only the next scheduled poll retries.
 *
 * `cause` distinguishes a failure Riot itself reported (`"provider"`, with
 * `status`) from anything else going wrong on the way — a corrupt cache row,
 * a database call failing, and so on (`"unexpected"`, no `status`: there was
 * no HTTP response to report one from).
 */
export type PollResult =
  | { kind: "polled"; newMatches: number; challengesUpdated: number }
  | { kind: "no_active_challenges" }
  | { kind: "failed"; cause: "provider"; status: number }
  | { kind: "failed"; cause: "unexpected" };

const DEFAULT_STATE = (puuid: string): PollState => ({
  puuid,
  lastMatchId: null,
  lastPolledAt: null,
  nextPollAfter: null,
  failureCount: 0,
  coveredFrom: null,
});

/**
 * Time since the player's last completed poll, in milliseconds — the value
 * `nextPollAfter`'s idle branch doubles.
 *
 * Not `state.nextPollAfter - state.lastPolledAt`: `enqueueDuePlayers`
 * overwrites `nextPollAfter` with the lease boundary before `pollPlayer` ever
 * runs (see `leaseTarget` in enqueue-due-players.ts), so by the time this
 * reads `state.nextPollAfter` it already holds the lease, not the interval
 * that was actually scheduled last time. The elapsed time since
 * `lastPolledAt` needs no extra column, and doubling it is self-correcting —
 * it does not matter which interval was scheduled before, only how long it
 * has actually been.
 *
 * `null` when there is nothing to double: no prior state, or a prior state
 * that was never actually polled.
 */
function elapsedSinceLastPollMs(state: PollState | null, now: Date): number | null {
  if (!state?.lastPolledAt) return null;
  return now.getTime() - state.lastPolledAt.getTime();
}

/**
 * Polls one player: fetches whatever is new since the last time, re-evaluates
 * every challenge they currently have active, and reschedules the next poll.
 *
 * A factory, like `linkRiotAccount`: `matchProviderFor` needs the player's
 * region, known only once `target` arrives, not at wiring time.
 */
export function pollPlayer(deps: {
  polling: PollingRepository;
  challenges: ChallengeRepository;
  matchProviderFor: (region: Region) => MatchProvider;
  now: () => Date;
}): (target: PollTarget) => Promise<PollResult> {
  return async (target: PollTarget): Promise<PollResult> => {
    const now = deps.now();
    // The one call this function does not try to recover from: with no
    // `state` at all there is nothing to base a backed-off failure record
    // on either, so a failure here is left to propagate (see the same
    // reasoning for `saveState` inside the catch below).
    const state = await deps.polling.getState(target.puuid);

    try {
      const active = await deps.challenges.listActiveForAccount(target.riotAccountId, now);

      if (active.length === 0) {
        // Nothing to track for this player right now. Still worth checking
        // again eventually — they might join a challenge later — but there
        // is no reason to spend a Riot call finding that out every 15
        // minutes.
        await deps.polling.saveState({
          ...(state ?? DEFAULT_STATE(target.puuid)),
          lastPolledAt: now,
          nextPollAfter: new Date(now.getTime() + POLL_INTERVAL_CAP_MS),
        });
        return { kind: "no_active_challenges" };
      }

      const startTime = new Date(Math.min(...active.map((c) => c.startsAt.getTime())));
      const provider = deps.matchProviderFor(regionForPlatform(target.platform));
      const lastMatchId = state?.lastMatchId ?? null;
      const coveredFrom = state?.coveredFrom ?? null;

      // Cache-aware on every poll, not only a backfilling one: ids already
      // cached for this player anywhere in [startTime, now] are loaded once,
      // up front, so neither pass below re-fetches one. Grown as matches are
      // cached during this run (see fetchAndCache), so the forward and
      // backward passes never double-fetch an id the other one just cached.
      const cachedInRange = await deps.polling.listCached(target.puuid, startTime, now);
      const cachedAt = new Map(cachedInRange.map((match) => [match.matchId, match.playedAt]));

      let fetchedCount = 0;

      /**
       * Fetches and caches each new id in `ids`, one at a time, immediately
       * — never batched at the end of the pass. A failure partway through
       * (a rate limit, a transient 5xx) leaves everything fetched so far
       * already cached instead of the old all-or-nothing loop discarding it
       * (finding A).
       *
       * Returns the oldest `playedAt` seen among `ids`, whether freshly
       * fetched or already cached: a cached id still proves coverage that
       * far back, which is exactly what `nextCoveredFrom` needs from a pass
       * that fetched nothing new (finding B).
       */
      async function fetchAndCache(ids: readonly string[]): Promise<Date | null> {
        let oldest: Date | null = null;
        for (const id of ids) {
          let playedAt = cachedAt.get(id);
          if (playedAt === undefined) {
            const summary = await provider.fetchMatch(id, target.puuid);
            await deps.polling.cacheMatches([summary]);
            playedAt = summary.playedAt;
            cachedAt.set(id, playedAt);
            fetchedCount += 1;
          }
          if (oldest === null || playedAt < oldest) oldest = playedAt;
        }
        return oldest;
      }

      /**
       * Pages `listMatchIds` newest-first from `startTime`, up to
       * `MAX_PAGES`, until `boundary` turns up in a page or a page comes
       * back shorter than `PAGE_SIZE` — whichever `collectNewIds` finds
       * first.
       *
       * Shared by the forward pass (`boundary` = `lastMatchId`, no
       * `endTime`: "what's new since last time") and the backward pass
       * (`boundary` = `null`, `endTime` = `coveredFrom`: "walk back from
       * `startTime` until reaching what was already covered"). Both are the
       * same "page until nothing new turns up" loop, differing only in
       * where they start and how they recognize the end.
       */
      async function pageMatchIds(
        boundary: string | null,
        endTime: Date | undefined,
      ): Promise<{ ids: string[]; firstPage: string[]; completed: boolean }> {
        let firstPage: string[] = [];
        const ids: string[] = [];
        let completed = false;
        for (let page = 0; page < MAX_PAGES; page += 1) {
          const onePage = await provider.listMatchIds(target.puuid, {
            count: PAGE_SIZE,
            start: page * PAGE_SIZE,
            startTime,
            ...(endTime ? { endTime } : {}),
          });
          if (page === 0) firstPage = onePage;

          const { newIds, done } = collectNewIds(onePage, boundary);
          ids.push(...newIds);
          if (done) {
            completed = true;
            break;
          }
        }
        return { ids, firstPage, completed };
      }

      // Forward pass — every poll, always bounded by lastMatchId. Unlike
      // before, a backfill no longer makes this ignore that boundary: the
      // backward pass below is what reaches further back now (findings B
      // and C). If MAX_PAGES truncates this pass before the boundary turns
      // up, lastMatchId still advances to the newest id below regardless —
      // that trade is documented on MAX_PAGES itself.
      const forward = await pageMatchIds(lastMatchId, undefined);
      const forwardOldest = await fetchAndCache(forward.ids);

      // Backward pass — only when coverage does not already reach
      // startTime (needsBackfill). A poll that skips this leaves
      // coveredFrom exactly as it was.
      let coveredFromNext = coveredFrom;
      if (needsBackfill(coveredFrom, startTime)) {
        let completed: boolean;
        let oldestFetchedAt: Date | null;

        if (coveredFrom === null) {
          // Nothing has ever been fetched for this player, so the forward
          // pass above already started from position 0 with no boundary
          // (lastMatchId is null too, on a genuinely first poll) — it
          // already walked back exactly as far as a backward pass would.
          // Running a second, separate pass here would only repeat the same
          // Riot calls for nothing.
          completed = forward.completed;
          oldestFetchedAt = forwardOldest;
        } else {
          const backward = await pageMatchIds(null, coveredFrom);
          oldestFetchedAt = await fetchAndCache(backward.ids);
          completed = backward.completed;
        }

        coveredFromNext = nextCoveredFrom({ completed, oldestFetchedAt, startTime, previous: coveredFrom });
      }

      let challengesUpdated = 0;
      for (const challenge of active) {
        const cached = await deps.polling.listCached(target.puuid, challenge.startsAt, challenge.endsAt);
        const progress = evaluate(challenge.rules, cached, {
          startsAt: challenge.startsAt,
          endsAt: challenge.endsAt,
        });
        await deps.challenges.saveProgress(challenge.id, target.riotAccountId, progress);
        challengesUpdated += 1;
      }

      await deps.polling.saveState({
        puuid: target.puuid,
        // forward.firstPage[0] is the newest id Riot reported this cycle;
        // falling back to the previous value keeps lastMatchId unchanged
        // when Riot returned nothing.
        lastMatchId: forward.firstPage[0] ?? state?.lastMatchId ?? null,
        lastPolledAt: now,
        nextPollAfter: nextPollAfter(now, {
          kind: "polled",
          newMatches: fetchedCount,
          previousIntervalMs: elapsedSinceLastPollMs(state, now),
        }),
        failureCount: 0,
        coveredFrom: coveredFromNext,
      });

      return { kind: "polled", newMatches: fetchedCount, challengesUpdated };
    } catch (error) {
      // Everything from `listActiveForAccount` on is caught here, not just
      // the provider calls: a throw from `listCached`, `saveProgress`, or
      // `listActiveForAccount` used to leave `nextPollAfter` stuck at the
      // lease `enqueueDuePlayers` set, so the next cron tick re-enqueued the
      // same player every time instead of backing off.
      const failureCount = (state?.failureCount ?? 0) + 1;

      const result: PollResult =
        error instanceof MatchProviderError
          ? { kind: "failed", cause: "provider", status: error.status }
          : { kind: "failed", cause: "unexpected" };

      if (result.cause === "provider") {
        // Deliberately reports the status only — never the message. See the
        // same discipline in link-riot-account.ts.
        console.error("poll-player: match provider failed", { status: result.status });
      } else {
        // No status to report: this did not come from an HTTP response.
        // Deliberately omits the message for the same reason as above — an
        // unanticipated error can carry anything.
        console.error("poll-player: unexpected failure", { puuid: target.puuid });
      }

      // If this itself throws, let it propagate — nothing else can be done.
      await deps.polling.saveState({
        ...(state ?? DEFAULT_STATE(target.puuid)),
        lastPolledAt: now,
        nextPollAfter: nextPollAfter(now, { kind: "failed", failureCount }),
        failureCount,
      });

      return result;
    }
  };
}
