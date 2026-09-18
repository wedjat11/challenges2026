import { describe, expect, it } from "vitest";

import { parsePollMessage } from "@/domain/ports/poll-queue";

const VALID = {
  kind: "poll-player",
  puuid: "puuid-1",
  riotAccountId: "account-1",
  platform: "la1",
};

describe("parsePollMessage", () => {
  it("parses a well-formed message", () => {
    expect(parsePollMessage(VALID)).toEqual({
      kind: "poll-player",
      puuid: "puuid-1",
      riotAccountId: "account-1",
      platform: "la1",
    });
  });

  it("rejects a message with the wrong kind", () => {
    expect(parsePollMessage({ ...VALID, kind: "something-else" })).toBeNull();
  });

  it("rejects a message with an unrecognised platform", () => {
    expect(parsePollMessage({ ...VALID, platform: "not-a-platform" })).toBeNull();
  });

  it("rejects a message missing puuid", () => {
    expect(
      parsePollMessage({ kind: VALID.kind, riotAccountId: VALID.riotAccountId, platform: VALID.platform }),
    ).toBeNull();
  });

  it("rejects a message missing riotAccountId", () => {
    expect(
      parsePollMessage({ kind: VALID.kind, puuid: VALID.puuid, platform: VALID.platform }),
    ).toBeNull();
  });

  it("rejects an empty puuid", () => {
    expect(parsePollMessage({ ...VALID, puuid: "" })).toBeNull();
  });

  it("rejects non-object input", () => {
    expect(parsePollMessage("not-an-object")).toBeNull();
    expect(parsePollMessage(null)).toBeNull();
    expect(parsePollMessage(undefined)).toBeNull();
  });
});
