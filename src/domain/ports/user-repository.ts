/** What Discord's own profile() output tells us about who signed in. */
export type DiscordIdentity = {
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
};

/** A person, as stored. Identity comes from Discord — see `users` in schema.ts. */
export type User = {
  id: string;
  discordId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
};

/**
 * What auth needs from storage, in the domain's terms.
 *
 * There is no `create` alongside `upsertFromDiscord`: every sign-in, first or
 * repeated, is the same operation from the caller's side. The port hides
 * which one happened, the same way `ChallengeRepository.join` hides whether
 * this was the first join.
 */
export type UserRepository = {
  /**
   * First sign-in inserts a row with a generated id. A later sign-in updates
   * `displayName` and `avatarUrl` — Discord names and avatars change — but
   * keeps the original id and `createdAt`, because both are referenced by
   * `riot_accounts.user_id` and by "member since" once that exists.
   */
  upsertFromDiscord(identity: DiscordIdentity): Promise<User>;

  findById(id: string): Promise<User | null>;
};
