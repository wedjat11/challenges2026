import { beforeEach, describe, expect, it } from "vitest";

import { createTestDb } from "@/adapters/db/test-db";
import { createUserRepository } from "@/adapters/db/user-repository";
import type { UserRepository } from "@/domain/ports/user-repository";

let repository: UserRepository;
beforeEach(async () => {
  repository = createUserRepository(await createTestDb());
});

describe("upsertFromDiscord", () => {
  it("inserts a new user on first sign-in", async () => {
    const user = await repository.upsertFromDiscord({
      discordId: "discord-1",
      displayName: "Thoth",
      avatarUrl: "https://cdn.discordapp.com/avatars/discord-1/abc.png",
    });

    expect(user.discordId).toBe("discord-1");
    expect(user.displayName).toBe("Thoth");
    expect(user.avatarUrl).toBe("https://cdn.discordapp.com/avatars/discord-1/abc.png");
    expect(user.id).toEqual(expect.any(String));
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it("keeps the same id and createdAt across a later sign-in", async () => {
    // Discord names and avatars change; the account they belong to must not.
    const first = await repository.upsertFromDiscord({
      discordId: "discord-1",
      displayName: "Thoth",
      avatarUrl: null,
    });

    const second = await repository.upsertFromDiscord({
      discordId: "discord-1",
      displayName: "Thoth Renamed",
      avatarUrl: "https://cdn.discordapp.com/avatars/discord-1/new.png",
    });

    expect(second.id).toBe(first.id);
    expect(second.createdAt).toEqual(first.createdAt);
    expect(second.displayName).toBe("Thoth Renamed");
    expect(second.avatarUrl).toBe("https://cdn.discordapp.com/avatars/discord-1/new.png");
  });

  it("gives two different Discord accounts two different rows", async () => {
    const first = await repository.upsertFromDiscord({
      discordId: "discord-1",
      displayName: "Thoth",
      avatarUrl: null,
    });
    const second = await repository.upsertFromDiscord({
      discordId: "discord-2",
      displayName: "Someone Else",
      avatarUrl: null,
    });

    expect(second.id).not.toBe(first.id);
  });
});

describe("findById", () => {
  it("returns null for an id nobody has", async () => {
    expect(await repository.findById("nope")).toBeNull();
  });

  it("finds a user previously upserted", async () => {
    const created = await repository.upsertFromDiscord({
      discordId: "discord-1",
      displayName: "Thoth",
      avatarUrl: null,
    });

    expect(await repository.findById(created.id)).toEqual(created);
  });
});
