// Custom Worker entry point (see "main" in wrangler.jsonc).
//
// OpenNext's own generated `.open-next/worker.js` exports only `fetch` — it
// has no notion of this app's cron trigger or Queue consumer. This file
// re-exports that `fetch` unchanged and adds `scheduled`/`queue`, per the
// pattern OpenNext documents for extending its Worker
// (node_modules/next/dist/docs isn't the right place to look for this; it's
// an OpenNext-for-Cloudflare concern, not a Next.js one).
//
// Both new handlers stay glue: all decision-making lives in
// `enqueueDuePlayers`, `pollPlayer` and `consumePollBatch`
// (src/application/), and message validation lives in `parsePollMessage`
// (src/domain/ports/poll-queue.ts) — none of it worth unit testing through
// this file when each already has its own tests.
import { drizzle } from "drizzle-orm/d1";

// Imported through the "@open-next/worker" alias, not the literal relative
// path, so a fallback type exists for when the target has not been built
// yet — see types/open-next-worker.d.ts.
import { default as handler } from "@open-next/worker";
import { createChallengeRepository } from "@/adapters/db/challenge-repository";
import { createPollingRepository } from "@/adapters/db/polling-repository";
import { createPollQueue } from "@/adapters/queue/poll-queue";
import { createRiotApi } from "@/adapters/riot/riot-api";
import { consumePollBatch } from "@/application/consume-poll-batch";
import { enqueueDuePlayers } from "@/application/enqueue-due-players";
import { pollPlayer } from "@/application/poll-player";
import * as schema from "@/db/schema";

/**
 * Cron entry point (`triggers.crons` in wrangler.jsonc).
 *
 * Runs as its own Worker invocation, not inside a Next.js request, so
 * `getCloudflareContext` — populated per-request by OpenNext, see
 * src/lib/db.ts — is not available. `env.DB` is used directly instead.
 */
async function scheduled(_controller: ScheduledController, env: CloudflareEnv): Promise<void> {
  const db = drizzle(env.DB, { schema });
  const polling = createPollingRepository(db);
  const queue = createPollQueue(env.POLL_QUEUE);

  const { enqueued } = await enqueueDuePlayers({ polling, queue, now: () => new Date() });
  console.log(`enqueued ${enqueued}`);
}

/**
 * Queue consumer entry point (`queues.consumers` in wrangler.jsonc). Same
 * per-invocation constraint as `scheduled`: no `getCloudflareContext` here.
 *
 * Every message is acked regardless of outcome: `pollPlayer` already records
 * a failure in `poll_state` with its own backoff (see `nextPollAfter` in
 * src/domain/polling.ts), so a Queue-level retry would only poll — and
 * rate-limit — the same player a second time for no benefit. The loop itself
 * lives in `consumePollBatch` (src/application/consume-poll-batch.ts), the
 * one piece of this file worth unit testing on its own; this stays glue.
 */
async function queue(batch: MessageBatch<unknown>, env: CloudflareEnv): Promise<void> {
  const db = drizzle(env.DB, { schema });
  const polling = createPollingRepository(db);
  const challenges = createChallengeRepository(db);
  const poll = pollPlayer({
    polling,
    challenges,
    matchProviderFor: (region) => createRiotApi({ apiKey: env.RIOT_API_KEY, region, maxRetries: 2 }),
    now: () => new Date(),
  });

  await consumePollBatch({ poll })(batch);
}

export default {
  fetch: handler.fetch,
  scheduled,
  queue,
} satisfies ExportedHandler<CloudflareEnv>;

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "@open-next/worker";
