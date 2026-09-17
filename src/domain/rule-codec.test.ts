import { describe, expect, it } from "vitest";

import { parseRules, serialiseRules } from "@/domain/rule-codec";
import type { Rule } from "@/domain/rule";

const winTenRankedJungle: Rule[] = [
  {
    target: 10,
    criteria: [
      { kind: "won" },
      { kind: "queue", queue: "ranked-solo" },
      { kind: "role", role: "jungle" },
    ],
  },
];

describe("round trip", () => {
  it("survives being written and read back", () => {
    expect(parseRules(serialiseRules(winTenRankedJungle))).toEqual(winTenRankedJungle);
  });

  it("keeps a rule with no criteria", () => {
    const playTwenty: Rule[] = [{ target: 20, criteria: [] }];
    expect(parseRules(serialiseRules(playTwenty))).toEqual(playTwenty);
  });
});

describe("rejecting what the database should never hold", () => {
  it("rejects a criterion kind it does not know", () => {
    // A row written by an older or newer version of the app must not be
    // silently treated as "no criteria", which would make every match count.
    expect(() => parseRules('[{"target":10,"criteria":[{"kind":"kda","value":3}]}]')).toThrow();
  });

  it("rejects a role or queue outside the allowed set", () => {
    expect(() =>
      parseRules('[{"target":1,"criteria":[{"kind":"role","role":"mid"}]}]'),
    ).toThrow();
    expect(() =>
      parseRules('[{"target":1,"criteria":[{"kind":"queue","queue":"ranked"}]}]'),
    ).toThrow();
  });

  it("rejects a target that cannot be reached or was never meant", () => {
    expect(() => parseRules('[{"target":0,"criteria":[]}]')).toThrow();
    expect(() => parseRules('[{"target":-5,"criteria":[]}]')).toThrow();
    expect(() => parseRules('[{"target":2.5,"criteria":[]}]')).toThrow();
  });

  it("rejects an empty champion name", () => {
    expect(() =>
      parseRules('[{"target":1,"criteria":[{"kind":"champion","champion":"   "}]}]'),
    ).toThrow();
  });

  it("rejects malformed JSON rather than returning nothing", () => {
    expect(() => parseRules("not json")).toThrow();
    expect(() => parseRules('{"target":1}')).toThrow();
  });

  it("rejects a challenge with no rules", () => {
    // A challenge nobody can fail is not a challenge, and `evaluate` would
    // report it complete the moment it is created.
    expect(() => parseRules("[]")).toThrow();
  });
});

describe("champion names", () => {
  it("stores them trimmed, so the same rule is one row not two", () => {
    const rules: Rule[] = [{ target: 5, criteria: [{ kind: "champion", champion: "  Lee Sin " }] }];
    expect(parseRules(serialiseRules(rules))[0]?.criteria[0]).toEqual({
      kind: "champion",
      champion: "Lee Sin",
    });
  });
});
