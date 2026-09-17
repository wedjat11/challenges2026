import { z } from "zod";

import { QUEUES, ROLES } from "@/domain/match";
import type { Rule } from "@/domain/rule";

/**
 * The boundary between untrusted JSON and a `Rule`.
 *
 * `challenges.rules_json` is a text column, so what comes back is whatever was
 * written — possibly by an older or newer version of this app. Validating on
 * the way out means a bad row fails loudly instead of quietly changing what a
 * challenge means: an unrecognised criterion dropped in silence would leave a
 * rule with fewer conditions, and every match would start counting.
 */
const criterionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("won") }),
  z.object({
    kind: z.literal("champion"),
    champion: z.string().trim().min(1),
  }),
  z.object({ kind: z.literal("role"), role: z.enum(ROLES) }),
  z.object({ kind: z.literal("queue"), queue: z.enum(QUEUES) }),
]);

const ruleSchema = z.object({
  // A target below one is a challenge that completes on creation.
  target: z.int().positive(),
  criteria: z.array(criterionSchema),
});

/** At least one rule: a challenge with none is complete the moment it exists. */
const rulesSchema = z.array(ruleSchema).min(1);

export function parseRules(json: string): Rule[] {
  return rulesSchema.parse(JSON.parse(json));
}

export function serialiseRules(rules: Rule[]): string {
  // Parsed on the way in too, so a trimmed champion name is stored once rather
  // than as two rows that look different and behave the same.
  return JSON.stringify(rulesSchema.parse(rules));
}
