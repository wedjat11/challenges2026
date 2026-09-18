import { describe, expect, it, vi } from "vitest";

import { consumePollBatch } from "@/application/consume-poll-batch";
import type { PollResult } from "@/application/poll-player";
import type { PollTarget } from "@/domain/ports/polling-repository";

/** A minimal stand-in for Cloudflare's `Message`: just what this loop reads. */
function fakeMessage(body: unknown) {
  return { body, ack: vi.fn((): void => {}) };
}

function fakeLog() {
  return { log: vi.fn((): void => {}), error: vi.fn((): void => {}) };
}

const VALID_BODY = { kind: "poll-player", puuid: "puuid-1", riotAccountId: "account-1", platform: "la1" };

describe("consumePollBatch", () => {
  it("acks a malformed message and logs without echoing its body", async () => {
    const log = fakeLog();
    const poll = vi.fn(async (): Promise<PollResult> => {
      throw new Error("must not be called for a malformed message");
    });
    const message = fakeMessage({ nonsense: true, secret: "should-not-be-logged" });
    const consume = consumePollBatch({ poll, log });

    const result = await consume({ messages: [message] });

    expect(message.ack).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ acked: 1, malformed: 1, failed: 0 });
    expect(log.error).toHaveBeenCalledTimes(1);
    const loggedArgs = log.error.mock.calls[0];
    expect(JSON.stringify(loggedArgs)).not.toContain("should-not-be-logged");
  });

  it("does not stop the batch when poll throws for one message", async () => {
    const log = fakeLog();
    const poll = vi.fn(async (target: PollTarget): Promise<PollResult> => {
      if (target.puuid === "puuid-1") throw new Error("boom");
      return { kind: "no_active_challenges" };
    });
    const failing = fakeMessage(VALID_BODY);
    const succeeding = fakeMessage({ ...VALID_BODY, puuid: "puuid-2" });
    const consume = consumePollBatch({ poll, log });

    const result = await consume({ messages: [failing, succeeding] });

    expect(poll).toHaveBeenCalledTimes(2);
    expect(failing.ack).toHaveBeenCalledTimes(1);
    expect(succeeding.ack).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ acked: 2, malformed: 0, failed: 1 });
    expect(log.error).toHaveBeenCalledWith("poll-player: unexpected failure", { puuid: "puuid-1" });
  });

  it("acks every message in the batch regardless of outcome", async () => {
    const log = fakeLog();
    const poll = vi.fn(async (): Promise<PollResult> => ({ kind: "no_active_challenges" }));
    const messages = [fakeMessage(VALID_BODY), fakeMessage(VALID_BODY), fakeMessage(VALID_BODY)];
    const consume = consumePollBatch({ poll, log });

    const result = await consume({ messages });

    for (const message of messages) expect(message.ack).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ acked: 3, malformed: 0, failed: 0 });
  });

  it("logs a polled result by kind, without treating it as failed", async () => {
    const log = fakeLog();
    const poll = vi.fn(
      async (): Promise<PollResult> => ({ kind: "polled", newMatches: 3, challengesUpdated: 1 }),
    );
    const consume = consumePollBatch({ poll, log });

    const result = await consume({ messages: [fakeMessage(VALID_BODY)] });

    expect(result).toEqual({ acked: 1, malformed: 0, failed: 0 });
    expect(log.log).toHaveBeenCalledWith("poll-player: polled");
  });

  it("defaults to the global console when no log is given", async () => {
    const poll = vi.fn(async (): Promise<PollResult> => ({ kind: "no_active_challenges" }));
    const consume = consumePollBatch({ poll });

    await expect(consume({ messages: [fakeMessage(VALID_BODY)] })).resolves.toEqual({
      acked: 1,
      malformed: 0,
      failed: 0,
    });
  });
});
