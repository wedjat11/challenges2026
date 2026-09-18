import type { PollResult } from "@/application/poll-player";
import type { PollTarget } from "@/domain/ports/polling-repository";
import { parsePollMessage } from "@/domain/ports/poll-queue";

/** The one slice of Cloudflare's `Message` this loop needs — see riot-api.ts's `HttpResponse` for the same reasoning. */
export type PollBatchMessage = { body: unknown; ack(): void };

export type PollBatch = { messages: ReadonlyArray<PollBatchMessage> };

export type ConsumePollBatchResult = { acked: number; malformed: number; failed: number };

/**
 * Drains one Queue batch of poll messages: parses, polls, logs, acks.
 *
 * Extracted from worker.ts (work unit B) so the loop's own contract — every
 * message gets acked regardless of outcome, one bad message or one bad
 * player never stops the rest of the batch — is testable without a real
 * Cloudflare `MessageBatch`.
 */
export function consumePollBatch(deps: {
  poll: (target: PollTarget) => Promise<PollResult>;
  log?: Pick<Console, "log" | "error">;
}): (batch: PollBatch) => Promise<ConsumePollBatchResult> {
  const log = deps.log ?? console;

  return async (batch: PollBatch): Promise<ConsumePollBatchResult> => {
    let malformed = 0;
    let failed = 0;

    for (const message of batch.messages) {
      const target = parsePollMessage(message.body);
      if (!target) {
        // Never echo the body: an unrecognised shape could carry anything.
        log.error("poll-player: malformed message");
        malformed += 1;
        message.ack();
        continue;
      }

      try {
        const result = await deps.poll(target);
        if (result.kind === "failed" && result.cause === "provider") {
          log.log("poll-player: failed", { cause: result.cause, status: result.status });
        } else if (result.kind === "failed") {
          log.log("poll-player: failed", { cause: result.cause });
        } else {
          log.log(`poll-player: ${result.kind}`);
        }
      } catch {
        // Every expected failure is already caught inside pollPlayer itself
        // — reaching here means something unanticipated in `poll` itself
        // (not in the work it delegates to `pollPlayer`, which already
        // catches everything it can attribute to one player). One bad
        // player must not poison the rest of the batch, so this is logged
        // and swallowed, not rethrown.
        log.error("poll-player: unexpected failure", { puuid: target.puuid });
        failed += 1;
      }

      message.ack();
    }

    return { acked: batch.messages.length, malformed, failed };
  };
}
