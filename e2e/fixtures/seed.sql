-- e2e fixtures: two users and one linked Riot account each, keyed by a
-- fixed `e2e-` prefix (design.md §9, D17, task 7.4).
--
-- Deleted and re-inserted by global-setup.ts before every e2e run, in
-- FK-safe order (children before parents) rather than relying on
-- ON DELETE CASCADE, since D1 does not necessarily run with
-- `PRAGMA foreign_keys = ON`. `participants`/`progress` are matched both by
-- their own `e2e-%` riot_account_id and by any challenge owned by an
-- `e2e-%` user, since a challenge created by this suite gets a fresh
-- `crypto.randomUUID()` id, not an `e2e-` prefixed one.

DELETE FROM participants
WHERE riot_account_id LIKE 'e2e-%'
   OR challenge_id IN (SELECT id FROM challenges WHERE owner_id LIKE 'e2e-%');

DELETE FROM progress
WHERE riot_account_id LIKE 'e2e-%'
   OR challenge_id IN (SELECT id FROM challenges WHERE owner_id LIKE 'e2e-%');

DELETE FROM challenges WHERE owner_id LIKE 'e2e-%';
DELETE FROM riot_accounts WHERE id LIKE 'e2e-%';
DELETE FROM users WHERE id LIKE 'e2e-%';

INSERT OR REPLACE INTO users (id, discord_id, display_name, avatar_url, created_at) VALUES
  ('e2e-user-a', 'e2e-discord-a', 'E2E User A', NULL, unixepoch() * 1000),
  ('e2e-user-b', 'e2e-discord-b', 'E2E User B', NULL, unixepoch() * 1000);

-- platform "la1" -> region "americas" (src/domain/riot-id.ts:regionForPlatform).
-- gameName/tagLine are distinct per account so both display names
-- ("E2E Player A#NA1", "E2E Player B#NA2") are independently assertable.
INSERT OR REPLACE INTO riot_accounts
  (id, user_id, puuid, game_name, tag_line, platform, region, verified, created_at)
VALUES
  ('e2e-account-a', 'e2e-user-a', 'e2e-puuid-a', 'E2E Player A', 'NA1', 'la1', 'americas', 0, unixepoch() * 1000),
  ('e2e-account-b', 'e2e-user-b', 'e2e-puuid-b', 'E2E Player B', 'NA2', 'la1', 'americas', 0, unixepoch() * 1000);
