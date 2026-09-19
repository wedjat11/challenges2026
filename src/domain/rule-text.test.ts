import { describe, expect, it } from "vitest";

import { ruleToSentence, rulesToSentences } from "@/domain/rule-text";
import type { Rule } from "@/domain/rule";

describe("ruleToSentence", () => {
  it("renders a won + champion rule as 'Win N games as Champion'", () => {
    const rule: Rule = {
      target: 3,
      criteria: [{ kind: "won" }, { kind: "champion", champion: "Ahri" }],
    };

    expect(ruleToSentence(rule)).toBe("Win 3 games as Ahri");
  });

  it("renders a rule with no criteria as a plain play-count sentence", () => {
    const rule: Rule = { target: 20, criteria: [] };

    expect(ruleToSentence(rule)).toBe("Play 20 games");
  });

  it("uses the singular 'game' when target is 1", () => {
    const rule: Rule = { target: 1, criteria: [{ kind: "won" }] };

    expect(ruleToSentence(rule)).toBe("Win 1 game");
  });

  it("includes the role label when a role criterion is present", () => {
    const rule: Rule = { target: 5, criteria: [{ kind: "role", role: "jungle" }] };

    expect(ruleToSentence(rule)).toBe("Play 5 games in Jungle");
  });

  it("includes the queue word when a queue criterion is present", () => {
    const rule: Rule = { target: 10, criteria: [{ kind: "queue", queue: "ranked-solo" }] };

    expect(ruleToSentence(rule)).toBe("Play 10 ranked solo games");
  });

  it("orders combined criteria by the fixed template, not input order", () => {
    // Criteria deliberately out of template order: role, then champion is
    // absent, then queue, then won — the sentence must still read verb,
    // target, queue, noun, role, matching design.md's worked example.
    const rule: Rule = {
      target: 10,
      criteria: [
        { kind: "role", role: "jungle" },
        { kind: "queue", queue: "ranked-solo" },
        { kind: "won" },
      ],
    };

    expect(ruleToSentence(rule)).toBe("Win 10 ranked solo games in Jungle");
  });

  it("renders a readable sentence for an unknown-role criterion", () => {
    const rule: Rule = { target: 4, criteria: [{ kind: "role", role: "unknown" }] };

    const sentence = ruleToSentence(rule);

    expect(sentence.startsWith("Play 4 games in ")).toBe(true);
    expect(sentence).not.toContain("undefined");
  });
});

describe("rulesToSentences", () => {
  it("maps every rule to its sentence, preserving order", () => {
    const rules: Rule[] = [
      { target: 1, criteria: [{ kind: "won" }] },
      { target: 20, criteria: [] },
    ];

    expect(rulesToSentences(rules)).toEqual(["Win 1 game", "Play 20 games"]);
  });
});
