import { describe, expect, it } from "vitest";

import { parseRules, serialiseRules } from "@/domain/rule-codec";
import { RULE_PRESETS } from "@/domain/rule-presets";

describe("RULE_PRESETS", () => {
  it("exposes exactly the four presets, in the spec's order", () => {
    expect(RULE_PRESETS.map((preset) => preset.id)).toEqual([
      "win-the-match",
      "win-n-with-champion",
      "play-n-games",
      "win-n-ranked-as-role",
    ]);
  });

  it.each(RULE_PRESETS)(
    "$label's default build() output survives parseRules(serialiseRules(...))",
    (preset) => {
      const rule = preset.build({});

      expect(parseRules(serialiseRules([rule]))).toEqual([rule]);
    },
  );

  it("'Win the match' always builds target 1 with a single won criterion, ignoring args", () => {
    const preset = RULE_PRESETS.find((candidate) => candidate.id === "win-the-match");
    if (!preset) throw new Error("expected the win-the-match preset to exist");

    expect(preset.build({})).toEqual({ target: 1, criteria: [{ kind: "won" }] });
    // The spec fixes this preset's shape; supplying unrelated args changes nothing.
    expect(preset.build({ target: 99, champion: "Ahri", role: "top" })).toEqual({
      target: 1,
      criteria: [{ kind: "won" }],
    });
  });

  it("flows an edited target and champion through 'Win N games with champion X'", () => {
    const preset = RULE_PRESETS.find((candidate) => candidate.id === "win-n-with-champion");
    if (!preset) throw new Error("expected the win-n-with-champion preset to exist");

    const rule = preset.build({ target: 15, champion: "Lee Sin" });

    expect(rule.target).toBe(15);
    expect(rule.criteria).toEqual([
      { kind: "won" },
      { kind: "champion", champion: "Lee Sin" },
    ]);
    expect(parseRules(serialiseRules([rule]))).toEqual([rule]);
  });

  it("flows an edited target through 'Play N games', keeping criteria empty", () => {
    const preset = RULE_PRESETS.find((candidate) => candidate.id === "play-n-games");
    if (!preset) throw new Error("expected the play-n-games preset to exist");

    const rule = preset.build({ target: 33 });

    expect(rule).toEqual({ target: 33, criteria: [] });
  });

  it("flows an edited target and role through 'Win N ranked games as role R', matching the spec's criteria order", () => {
    const preset = RULE_PRESETS.find((candidate) => candidate.id === "win-n-ranked-as-role");
    if (!preset) throw new Error("expected the win-n-ranked-as-role preset to exist");

    const rule = preset.build({ target: 8, role: "support" });

    expect(rule.target).toBe(8);
    // challenge-authoring: Preset Starting Points names this exact order —
    // won, then role, then queue.
    expect(rule.criteria).toEqual([
      { kind: "won" },
      { kind: "role", role: "support" },
      { kind: "queue", queue: "ranked-solo" },
    ]);
    expect(parseRules(serialiseRules([rule]))).toEqual([rule]);
  });

  it("falls back to a sensible default champion when an edited value is blank", () => {
    const preset = RULE_PRESETS.find((candidate) => candidate.id === "win-n-with-champion");
    if (!preset) throw new Error("expected the win-n-with-champion preset to exist");

    const rule = preset.build({ champion: "   " });

    const champion = rule.criteria.find((criterion) => criterion.kind === "champion");
    expect(champion?.kind === "champion" && champion.champion.length > 0).toBe(true);
    expect(parseRules(serialiseRules([rule]))).toEqual([rule]);
  });
});
