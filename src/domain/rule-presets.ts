import type { Role } from "@/domain/match";
import type { Rule } from "@/domain/rule";

/**
 * The fields a preset's `build()` may read. One shared shape rather than a
 * discriminated union per preset: every field a preset might use — `target`,
 * `champion`, `role` — is optional here, and each `build()` only reads the
 * ones its own rule shape needs (`"Play N games"` never looks at `champion`
 * or `role`). A discriminated union keyed by preset id would force the
 * caller (the rule builder) to narrow before calling `build`, for no benefit:
 * `parseRules` — not this type — is still the only place that rejects an
 * invalid rule (D12), so a loosely-typed args object cannot smuggle an
 * invalid `Rule` past validation.
 */
export type RulePresetArgs = {
  target?: number;
  champion?: string;
  role?: Role;
};

export type RulePreset = {
  id: string;
  label: string;
  description: string;
  build(args: RulePresetArgs): Rule;
};

const DEFAULT_TARGET_WITH_CHAMPION = 5;
const DEFAULT_TARGET_PLAY_GAMES = 10;
const DEFAULT_TARGET_RANKED_ROLE = 5;
const DEFAULT_CHAMPION = "Ahri";
const DEFAULT_ROLE: Role = "jungle";

/** A target below one is a challenge that completes on creation — same floor `parseRules` enforces. */
function sanitizeTarget(target: number | undefined, fallback: number): number {
  return target !== undefined && Number.isInteger(target) && target > 0 ? target : fallback;
}

function sanitizeChampion(champion: string | undefined): string {
  const trimmed = champion?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_CHAMPION;
}

/**
 * Convenience starting points for the rule builder (D12, challenge-authoring:
 * Preset Starting Points). Selecting one pre-fills an editable rule — the
 * resulting `Rule` is validated by `parseRules` exactly like a manually built
 * one, so no separate stored shape exists for a preset-originated rule.
 */
export const RULE_PRESETS: readonly RulePreset[] = [
  {
    id: "win-the-match",
    label: "Win the match",
    description: "Win a single game. No other condition.",
    build: () => ({ target: 1, criteria: [{ kind: "won" }] }),
  },
  {
    id: "win-n-with-champion",
    label: "Win N games with champion X",
    description: "Win a number of games on one chosen champion.",
    build: (args) => ({
      target: sanitizeTarget(args.target, DEFAULT_TARGET_WITH_CHAMPION),
      criteria: [{ kind: "won" }, { kind: "champion", champion: sanitizeChampion(args.champion) }],
    }),
  },
  {
    id: "play-n-games",
    label: "Play N games",
    description: "Play a number of games. Any result counts.",
    build: (args) => ({
      target: sanitizeTarget(args.target, DEFAULT_TARGET_PLAY_GAMES),
      criteria: [],
    }),
  },
  {
    id: "win-n-ranked-as-role",
    label: "Win N ranked games as role R",
    description: "Win a number of ranked solo games in one chosen role.",
    build: (args) => ({
      target: sanitizeTarget(args.target, DEFAULT_TARGET_RANKED_ROLE),
      // challenge-authoring: Preset Starting Points fixes this exact order —
      // won, then role, then queue.
      criteria: [
        { kind: "won" },
        { kind: "role", role: args.role ?? DEFAULT_ROLE },
        { kind: "queue", queue: "ranked-solo" },
      ],
    }),
  },
];
