import type { Queue } from "@/domain/match";
import { cn } from "@/lib/cn";

/**
 * design-system: UI Primitives and Their States. Text only, no Riot marks
 * (no crest, no in-game asset). `queue` is typed from the domain's `Queue`
 * union (`src/domain/match.ts`) so an invalid queue string cannot compile.
 *
 * `QUEUE_LABELS` (a human word per queue, e.g. "Ranked Solo") lands in S3b
 * (task 3b.2) alongside `rule-text.ts` — this primitive renders the raw
 * `Queue` value until that lookup exists, matching the "text only" scope
 * of this task; nothing here depends on S3b.
 */

export type GameTagProps = {
  game?: "lol";
  short?: boolean;
  queue?: Queue;
  className?: string;
};

const GAME_LABELS: Record<"lol", { full: string; short: string }> = {
  lol: { full: "League of Legends", short: "LoL" },
};

export function GameTag({ game = "lol", short = false, queue, className }: GameTagProps) {
  const gameLabel = short ? GAME_LABELS[game].short : GAME_LABELS[game].full;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-micro tracking-eyebrow text-text-muted uppercase",
        className,
      )}
    >
      {gameLabel}
      {queue ? <span aria-hidden="true">·</span> : null}
      {queue ? queue : null}
    </span>
  );
}
