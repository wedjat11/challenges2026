import { describe, expect, it } from "vitest";

import { createPollQueue } from "@/adapters/queue/poll-queue";
import type { PollMessage } from "@/domain/ports/poll-queue";

/**
 * Honest double for the slice of Cloudflare's global `Queue` type this
 * adapter uses. `metrics` and `send` are declared, not implemented, the same
 * discipline as `fakePolling`/`fakeQueue` in enqueue-due-players.test.ts —
 * this adapter never calls either, so a call reaching them is a bug.
 */
function fakeQueue(): Queue<PollMessage> & {
  batches: MessageSendRequest<PollMessage>[][];
} {
  const batches: MessageSendRequest<PollMessage>[][] = [];
  return {
    batches,
    async metrics() {
      throw new Error("not used by createPollQueue");
    },
    async send() {
      throw new Error("not used by createPollQueue");
    },
    async sendBatch(messages) {
      batches.push(Array.from(messages));
      return { metadata: { metrics: { backlogCount: 0, backlogBytes: 0 } } };
    },
  };
}

const message = (n: number): PollMessage => ({
  kind: "poll-player",
  puuid: `puuid-${n}`,
  riotAccountId: `account-${n}`,
  platform: "la1",
});

describe("createPollQueue", () => {
  it("sends every message in one batch when under Cloudflare's limit", async () => {
    const queue = fakeQueue();
    const pollQueue = createPollQueue(queue);

    await pollQueue.send([message(1), message(2)]);

    expect(queue.batches).toEqual([[{ body: message(1) }, { body: message(2) }]]);
  });

  it("chunks into batches of 100, Cloudflare's per-call limit", async () => {
    const queue = fakeQueue();
    const pollQueue = createPollQueue(queue);
    const messages = Array.from({ length: 250 }, (_, i) => message(i));

    await pollQueue.send(messages);

    expect(queue.batches.map((batch) => batch.length)).toEqual([100, 100, 50]);
  });

  it("sends nothing for an empty list", async () => {
    const queue = fakeQueue();
    const pollQueue = createPollQueue(queue);

    await pollQueue.send([]);

    expect(queue.batches).toEqual([]);
  });
});
