import { QUEUE_LABELS, ROLE_LABELS } from "@/domain/match";
import type { Criterion, Rule } from "@/domain/rule";

/**
 * Renders one rule as a human-readable sentence, per the design's
 * deterministic template:
 *
 *   {Win|Play} {target} {queueWord?} {game|games}{ as {champion}}{ in {roleLabel}}
 *
 * `Win` when a `won` criterion is present, else `Play`; `game` when
 * `target === 1`. Sentence order is fixed by this template, not by the order
 * criteria appear in `rule.criteria` — three consumers (the create wizard's
 * review step, the browse card, the view page) need the identical output, so
 * this lives in `src/domain` where the `challenge-view` spec's exact-output
 * scenarios can run under Vitest with no DOM, matching `PLATFORM_LABELS`'s
 * precedent in `src/domain/riot-id.ts`.
 */
export function ruleToSentence(rule: Rule): string {
  const won = rule.criteria.some((criterion) => criterion.kind === "won");
  const queue = findCriterion(rule.criteria, "queue");
  const champion = findCriterion(rule.criteria, "champion");
  const role = findCriterion(rule.criteria, "role");

  const verb = won ? "Win" : "Play";
  const noun = rule.target === 1 ? "game" : "games";

  const parts = [verb, String(rule.target)];
  if (queue) parts.push(QUEUE_LABELS[queue.queue]);
  parts.push(noun);

  let sentence = parts.join(" ");
  if (champion) sentence += ` as ${champion.champion}`;
  if (role) sentence += ` in ${ROLE_LABELS[role.role]}`;

  return sentence;
}

/** Applies `ruleToSentence` to every rule, preserving order. */
export function rulesToSentences(rules: Rule[]): string[] {
  return rules.map(ruleToSentence);
}

function findCriterion<Kind extends Criterion["kind"]>(
  criteria: Criterion[],
  kind: Kind,
): Extract<Criterion, { kind: Kind }> | undefined {
  return criteria.find(
    (criterion): criterion is Extract<Criterion, { kind: Kind }> => criterion.kind === kind,
  );
}
