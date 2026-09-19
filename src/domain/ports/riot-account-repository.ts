import type { Platform, Region } from "@/domain/riot-id";

/** A Riot account a user has linked, as stored. See `riot_accounts` in schema.ts. */
export type RiotAccount = {
  id: string;
  userId: string;
  puuid: string;
  gameName: string;
  tagLine: string;
  platform: Platform;
  region: Region;
  verified: boolean;
  createdAt: Date;
};

/**
 * A Riot account as the application asks for it to be linked.
 *
 * No `region` here: it is a pure function of `platform` (see
 * `regionForPlatform`), so the adapter derives it on insert rather than
 * trusting a second value that could disagree with the first.
 */
export type NewRiotAccount = {
  userId: string;
  puuid: string;
  gameName: string;
  tagLine: string;
  platform: Platform;
};

/**
 * What `link` found, told in terms the UI can turn straight into a message
 * without re-deriving it from a thrown error or a diffed row count.
 *
 * `linked` means this call created the row. `already_linked` means the same
 * user had already linked this `puuid`; the returned `account` reflects the
 * stored identity after this call — refreshed from the input's `gameName`,
 * `tagLine` and `platform` (and the region that follows from it) when they
 * differ from what was stored, since Riot IDs get renamed and players
 * transfer platforms. `claimed_by_other_user` means a different user already
 * holds this `puuid`; nothing was inserted or modified, and the caller gets
 * no `account` because it is not this user's to see.
 */
export type LinkOutcome =
  | { kind: "linked"; account: RiotAccount }
  | { kind: "already_linked"; account: RiotAccount }
  | { kind: "claimed_by_other_user" };

/**
 * What the application needs from Riot account storage, in the domain's
 * terms. Mirrors `UserRepository`'s shape: no `create` alongside `link`,
 * because `link` already hides whether a row existed.
 */
export type RiotAccountRepository = {
  link(account: NewRiotAccount): Promise<LinkOutcome>;

  /**
   * Ordered by createdAt, oldest link first, matching how they were added;
   * ties (possible at this column's storage resolution) break on id.
   */
  listByUser(userId: string): Promise<RiotAccount[]>;

  findByPuuid(puuid: string): Promise<RiotAccount | null>;

  /** Resolves a stored participant id to its identity and puuid. Null when unknown. */
  findById(id: string): Promise<RiotAccount | null>;

  /** True if a row owned by `userId` was deleted. Never deletes another user's row. */
  unlink(id: string, userId: string): Promise<boolean>;
};
