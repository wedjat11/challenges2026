import { z } from "zod";

import { isPlatform, type Platform } from "@/domain/riot-id";

/**
 * One player due for polling, as the cron handler hands it to the consumer.
 *
 * `kind` exists even though this is the only variant today, the same reason
 * `MatchSummary.game` does: a Cloudflare Queue is one channel per binding, and
 * a discriminant costs nothing now and means a second message shape can be
 * added later without every consumer needing a runtime type check to notice.
 */
export type PollMessage = {
  kind: "poll-player";
  puuid: string;
  riotAccountId: string;
  platform: Platform;
};

/**
 * What `enqueueDuePlayers` needs from Cloudflare Queues, in the domain's
 * terms. Kept to the one method this use case calls — the consumer side
 * (`worker.ts`, work unit B) reads messages through the platform's own
 * `MessageBatch` type, which this port does not need to describe.
 */
export type PollQueue = {
  send(messages: PollMessage[]): Promise<void>;
};

const pollMessageSchema = z.object({
  kind: z.literal("poll-player"),
  puuid: z.string().min(1),
  riotAccountId: z.string().min(1),
  platform: z.string().refine(isPlatform),
});

/**
 * The boundary between an untrusted Queue message body and a `PollMessage`.
 *
 * `message.body` on Cloudflare's `Message` type is `unknown` — nothing stops a
 * stale producer, a manual `wrangler queues` send, or a future message shape
 * from landing in this consumer. Returning `null` rather than throwing lets
 * the caller (`worker.ts`, work unit B) log and `ack()` a malformed message
 * without a raw body reaching the log line — mirrors `parseMatchSummary`.
 */
export function parsePollMessage(body: unknown): PollMessage | null {
  const result = pollMessageSchema.safeParse(body);
  if (!result.success) return null;

  return {
    kind: result.data.kind,
    puuid: result.data.puuid,
    riotAccountId: result.data.riotAccountId,
    platform: result.data.platform,
  };
}
