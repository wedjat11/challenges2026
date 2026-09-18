import { describe, expect, it } from "vitest";

import { discordIdentityFromProfile, enrichToken, sessionFromToken } from "@/auth/callbacks";

describe("discordIdentityFromProfile", () => {
  // This is the shape Discord's own profile() in next-auth/providers/discord
  // already returns: { id, name, email, image }. Reusing that output means
  // this function never re-derives the avatar CDN URL itself.
  it("reads the identity out of the provider's profile() output", () => {
    const identity = discordIdentityFromProfile({
      id: "123456789012345678",
      name: "Thoth",
      email: "thoth@example.com",
      image: "https://cdn.discordapp.com/avatars/123456789012345678/abc.png",
    });

    expect(identity).toEqual({
      discordId: "123456789012345678",
      displayName: "Thoth",
      avatarUrl: "https://cdn.discordapp.com/avatars/123456789012345678/abc.png",
    });
  });

  it("maps a missing image to null rather than undefined", () => {
    const identity = discordIdentityFromProfile({
      id: "123456789012345678",
      name: "Thoth",
      email: null,
      image: null,
    });

    expect(identity.avatarUrl).toBeNull();
  });

  it("throws a descriptive error when the id is missing", () => {
    expect(() =>
      discordIdentityFromProfile({ name: "Thoth", email: null, image: null }),
    ).toThrow(/id/i);
  });

  it("throws a descriptive error on a non-object profile", () => {
    expect(() => discordIdentityFromProfile(null)).toThrow();
    expect(() => discordIdentityFromProfile("not a profile")).toThrow();
  });
});

describe("enrichToken", () => {
  it("carries the internal user id onto the token, keeping the rest", () => {
    const token = enrichToken({ sub: "discord-123" }, "user-1");

    expect(token.userId).toBe("user-1");
    expect(token.sub).toBe("discord-123");
  });
});

describe("sessionFromToken", () => {
  it("exposes the token's user id as session.user.id", () => {
    const session = sessionFromToken(
      // `id` here is whatever the previous session carried — always
      // overwritten by this function, never read from it.
      { user: { id: "stale-id", name: "Thoth" }, expires: "2026-01-01T00:00:00.000Z" },
      { userId: "user-1" },
    );

    expect(session.user?.id).toBe("user-1");
    expect(session.user?.name).toBe("Thoth");
  });

  it("falls back to an empty id rather than throwing when the token carries none", () => {
    // Should not happen in practice — jwt() always runs enrichToken on sign-in
    // before session() runs — but a pure function should not crash on it.
    const session = sessionFromToken(
      { user: { id: "stale-id" }, expires: "2026-01-01T00:00:00.000Z" },
      {},
    );

    expect(session.user?.id).toBe("");
  });
});
