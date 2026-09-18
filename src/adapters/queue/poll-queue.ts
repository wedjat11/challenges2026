import type { PollMessage, PollQueue } from "@/domain/ports/poll-queue";

/** Cloudflare rejects a `sendBatch` call carrying more than this many messages. */
const CLOUDFLARE_BATCH_LIMIT = 100;

/**
 * Adapts a Cloudflare Queue producer binding to `PollQueue`.
 *
 * Chunks at Cloudflare's own batch limit so `enqueueDuePlayers` never has to
 * know about it — its `batchSize` default (10) stays under 100 today, but
 * this keeps the adapter correct even if that default grows past it later.
 */
export function createPollQueue(queue: Queue<PollMessage>): PollQueue {
  return {
    async send(messages: PollMessage[]): Promise<void> {
      for (let offset = 0; offset < messages.length; offset += CLOUDFLARE_BATCH_LIMIT) {
        const chunk = messages.slice(offset, offset + CLOUDFLARE_BATCH_LIMIT);
        await queue.sendBatch(chunk.map((body) => ({ body })));
      }
    },
  };
}
