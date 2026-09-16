import type { MatchSummary, Queue, Role } from "@/domain/match";

/**
 * A single condition a match must meet to count towards a rule.
 *
 * Criteria are conditions, not goals. The count lives on the rule, so
 * "win 10 ranked games as Jungle" is one goal with three conditions rather than
 * three goals that thirty unrelated games could satisfy between them.
 */
export type Criterion =
  | { kind: "won" }
  | { kind: "champion"; champion: string }
  | { kind: "role"; role: Role }
  | { kind: "queue"; queue: Queue };

/**
 * One goal inside a challenge: how many matches must qualify, and what makes a
 * match qualify. An empty `criteria` list means every match counts, which is how
 * "play 20 games" is expressed.
 */
export type Rule = {
  target: number;
  criteria: Criterion[];
};

/** Champion names reach us from user input, so compare them forgivingly. */
function sameChampion(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function meets(criterion: Criterion, match: MatchSummary): boolean {
  switch (criterion.kind) {
    case "won":
      return match.win;
    case "champion":
      return sameChampion(criterion.champion, match.champion);
    case "role":
      return criterion.role === match.role;
    case "queue":
      return criterion.queue === match.queue;
  }
}

/** Whether this match counts towards this rule. Every criterion must hold. */
export function qualifies(rule: Rule, match: MatchSummary): boolean {
  return rule.criteria.every((criterion) => meets(criterion, match));
}
