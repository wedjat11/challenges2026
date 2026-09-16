import { describe, expect, it } from "vitest";

import { SUPPORTED_GAMES, isSupportedGame } from "@/domain/game";

describe("game", () => {
  it("supports League of Legends", () => {
    expect(SUPPORTED_GAMES).toContain("lol");
  });

  it("does not support Teamfight Tactics yet", () => {
    // TFT is deferred to v2. The discriminant exists from the start so adding
    // it later is additive, but nothing should accept it as valid input now.
    expect(isSupportedGame("tft")).toBe(false);
  });

  it("rejects values that are not games at all", () => {
    expect(isSupportedGame("valorant")).toBe(false);
    expect(isSupportedGame("")).toBe(false);
  });
});
