import { leaseUntil } from "@/domain/polling";
import type { PollMessage, PollQueue } from "@/domain/ports/poll-queue";
import type { PollState, PollTarget, PollingRepository } from "@/domain/ports/polling-repository";

export type EnqueueDuePlayersDeps = {
  polling: PollingRepository;
  queue: PollQueue;
  now: () => Date;
  batchSize?: number;
};

/**
 * Bounds one cron tick's worst-case drain time under the Queue consumer's
 * `max_concurrency: 1`. Sized against the expensive case, not the common
 * one: a player whose poll runs both the forward and backward pass at their
 * full `MAX_PAGES` bound can cost up to ≈ 210 Riot calls (see
 * `LEASE_DURATION_MS` in polling.ts for the full arithmetic), so 10 such
 * players in one batch ≈ 2,100 calls ≈ 42 minutes at Riot's 100 requests / 2
 * minutes limit — comfortably inside `LEASE_DURATION_MS` (60 minutes), so a
 * batch still in flight is never re-enqueued by the next tick.
 */
const DEFAULT_BATCH_SIZE = 10;

/**
 * Claims a player by pushing `nextPollAfter` out to the lease boundary,
 * keeping whatever else was already recorded for them — or the defaults for a
 * player being polled for the first time, who has no state row yet.
 */
async function leaseTarget(
  polling: PollingRepository,
  target: PollTarget,
  now: Date,
): Promise<void> {
  const existing = await polling.getState(target.puuid);
  const state: PollState = existing ?? {
    puuid: target.puuid,
    lastMatchId: null,
    lastPolledAt: null,
    nextPollAfter: null,
    failureCount: 0,
    coveredFrom: null,
  };

  // Spreads the existing state rather than rebuilding it: leasing only ever
  // moves nextPollAfter, and coveredFrom (like lastMatchId and failureCount)
  // is pollPlayer's to update, not the lease's.
  await polling.saveState({ ...state, nextPollAfter: leaseUntil(now) });
}

/**
 * Enqueues one Queue message per player due for polling.
 *
 * Each player is leased before the message is sent: the cron trigger and the
 * queue consumer run as separate Worker invocations, so without a lease the
 * very next cron tick could enqueue the same player again while their first
 * message is still in flight. Never loops the poll work itself inline — that
 * stays in `pollPlayer`, run once per queued message.
 */
export async function enqueueDuePlayers(
  deps: EnqueueDuePlayersDeps,
): Promise<{ enqueued: number }> {
  const now = deps.now();
  const due = await deps.polling.listDue(now, deps.batchSize ?? DEFAULT_BATCH_SIZE);

  const messages: PollMessage[] = [];
  for (const target of due) {
    await leaseTarget(deps.polling, target, now);
    messages.push({
      kind: "poll-player",
      puuid: target.puuid,
      riotAccountId: target.riotAccountId,
      platform: target.platform,
    });
  }

  if (messages.length > 0) await deps.queue.send(messages);

  return { enqueued: due.length };
}
