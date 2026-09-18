/**
 * A parsed `gameName#tagLine` Riot ID.
 *
 * The split happens on the *last* `#`, not the first, because Riot's own
 * client does the same — a game name cannot contain `#` in practice, but a
 * pasted value should never fail on an unexpected extra one.
 */
export type ParsedRiotId = { ok: true; gameName: string; tagLine: string } | RiotIdParseFailure;

/** The failed half of `ParsedRiotId`, exported so callers can name the reason without repeating the union. */
export type RiotIdParseFailure = {
  ok: false;
  reason: "missing_tag" | "game_name_length" | "tag_line_format";
};

/** The set of reasons `parseRiotId` can fail with. */
export type RiotIdParseReason = RiotIdParseFailure["reason"];

const MIN_GAME_NAME_LENGTH = 3;
const MAX_GAME_NAME_LENGTH = 16;
const TAG_LINE_PATTERN = /^[a-z0-9]{3,5}$/i;

/**
 * Splits and validates a Riot ID the way a player typed it.
 *
 * Casing is preserved rather than normalised: lookup against Riot's API is
 * case-insensitive, but what the user typed is what should show up again in
 * the UI. Game names are not restricted to ASCII — Riot allows spaces and
 * unicode letters — so only length is checked, never a character class.
 */
export function parseRiotId(input: string): ParsedRiotId {
  const trimmed = input.trim();
  const hashIndex = trimmed.lastIndexOf("#");

  if (hashIndex === -1) return { ok: false, reason: "missing_tag" };

  const gameName = trimmed.slice(0, hashIndex);
  const tagLine = trimmed.slice(hashIndex + 1);

  // Code points, not UTF-16 units: `.length` counts an astral character (one
  // outside the Basic Multilingual Plane) as two, which would reject a
  // borderline-length name a player typed correctly.
  const gameNameLength = Array.from(gameName).length;
  if (gameNameLength < MIN_GAME_NAME_LENGTH || gameNameLength > MAX_GAME_NAME_LENGTH) {
    return { ok: false, reason: "game_name_length" };
  }

  if (!TAG_LINE_PATTERN.test(tagLine)) {
    return { ok: false, reason: "tag_line_format" };
  }

  return { ok: true, gameName, tagLine };
}

/**
 * Platform shards this product offers on the link form.
 *
 * All of Riot's League shards are listed, not just the launch regions: the
 * decision to trim this list stays open (see T10's plan) and only removes
 * entries later, rather than the form quietly excluding a region today.
 */
export const PLATFORMS = [
  "na1",
  "br1",
  "la1",
  "la2",
  "euw1",
  "eun1",
  "tr1",
  "ru",
  "me1",
  "kr",
  "jp1",
  "oc1",
  "ph2",
  "sg2",
  "th2",
  "tw2",
  "vn2",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

/**
 * The platform the link form pre-selects.
 *
 * LAN is the working default while the launch-regions decision (see
 * `odd/tasks/lol-tft-challenges.md`) stays open — this constant only names
 * that choice so it is not a bare literal in the form component.
 */
export const DEFAULT_PLATFORM: Platform = "la1";

/** Human labels for the platform `<select>`, in the terms players use. */
export const PLATFORM_LABELS: Record<Platform, string> = {
  na1: "NA",
  br1: "BR",
  la1: "LAN",
  la2: "LAS",
  euw1: "EUW",
  eun1: "EUNE",
  tr1: "TR",
  ru: "RU",
  me1: "ME",
  kr: "KR",
  jp1: "JP",
  oc1: "OCE",
  ph2: "PH",
  sg2: "SG",
  th2: "TH",
  tw2: "TW",
  vn2: "VN",
};

/**
 * Regional cluster match-v5 expects, per Riot's routing docs.
 *
 * A platform shard (e.g. `la1`) and its regional cluster (e.g. `americas`)
 * are different values on different hosts — `RiotApiConfig.region` needs the
 * latter, and this is the only place that mapping lives. account-v1 does
 * *not* share this set — see `AccountRegion` and `accountRegionForPlatform`.
 */
export type Region = "americas" | "europe" | "asia" | "sea";

const REGION_BY_PLATFORM: Record<Platform, Region> = {
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  me1: "europe",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  tw2: "sea",
  vn2: "sea",
};

export function regionForPlatform(platform: Platform): Region {
  return REGION_BY_PLATFORM[platform];
}

/**
 * Regional cluster account-v1 (Riot ID lookup) expects, per Riot's routing
 * docs.
 *
 * This is *not* the same set `Region` covers: account-v1 only routes to
 * `americas`, `asia` or `europe` — there is no `sea` cluster for it, unlike
 * match-v5. The SEA platform shards (oc1/ph2/sg2/th2/tw2/vn2) therefore route
 * to `asia` here specifically, even though `regionForPlatform` reports `sea`
 * for those same platforms.
 */
export type AccountRegion = "americas" | "asia" | "europe";

export function accountRegionForPlatform(platform: Platform): AccountRegion {
  const region = regionForPlatform(platform);
  return region === "sea" ? "asia" : region;
}
