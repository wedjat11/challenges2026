# Design: Email Magic-Link Sign-In (replacing Discord OAuth)

Change: `email-magic-link-auth` · Store: hybrid (this file + Engram topic `sdd/email-magic-link-auth/design`, project `challenges2026`) · Written 2026-10-03 · Inputs: `proposal.md` (owner-approved, A1–A11, R1–R11, S0–S7; Engram #110), `exploration.md` (#109), `specs/email-authentication/spec.md` (23 requirements)

**In one line:** two migrations turn `users` into an email-keyed table and add `verification_tokens` + `auth_email_throttle`; four pure domain modules, four ports, four adapters and one use case compose into a six-method Auth.js `Adapter` and a project-owned `sendVerificationRequest`; `/login` becomes a zero-JS email form with a dedicated `/login/check-email` route — delivered as nine chained slices, each leaving `pnpm test && pnpm typecheck && pnpm lint && pnpm build` green.

---

## Technical Approach

Five layers change, in dependency order. Nothing outside auth is re-architected: all eight `session.user.id` consumers are untouched.

| Layer | What this change does | What it does not do |
|---|---|---|
| Schema / migrations | `drizzle/0002` adds `verification_tokens` + `auth_email_throttle`; `drizzle/0003` recreates `users` keyed by `email`, dropping `discord_id` | No `accounts` table, no `sessions` table, no `@auth/d1-adapter` tables |
| Domain (pure) | `email-identity.ts`, `magic-link-email.ts`, `send-throttle.ts`; three new ports plus a rewritten `UserRepository` | No zod schema for email (the normaliser is the validator), no framework import |
| Application | one use case, `request-magic-link.ts`, composing the throttle port + the pure policy + the sender port | Never imports `src/adapters` (`openspec/config.yaml` hexagonal rule) |
| Adapters | `src/adapters/auth/auth-adapter.ts` (Auth.js `Adapter` over ports), `src/adapters/email/resend-email-sender.ts` (HTTP), two new D1 repositories, one rewritten | The Auth.js adapter performs no DB access and imports nothing from `src/adapters/db` |
| App / routes | `src/auth.ts` provider swap; `/login` email form; `/login/check-email`; reworked error copy; Discord copy removed from `hero`, `terms`, `privacy` | No new route handler (the existing `src/app/api/auth/[...nextauth]/route.ts` is unchanged), no `pages.newUser`, no middleware |

The composition root is `src/auth.ts` — the only new place that imports `src/adapters/*` for this feature, exactly as `src/app/account/actions.ts` does for Riot linking.

### Next.js 16 facts this design is built on

Read from `node_modules/.pnpm/next@16.3.5_…/node_modules/next/dist/docs/`, per `AGENTS.md`:

| Source | Fact relied on |
|---|---|
| `01-app/01-getting-started/07-mutating-data.md:32` | "Server Functions are reachable via direct POST requests, not just through your application's UI. Always verify authentication and authorization inside every Server Function." — drives the server-side `normalizeEmail` + `safeReturnPath` re-validation (D18, threat row T1) |
| `01-app/03-api-reference/04-functions/redirect.md:51,53` | `redirect` throws, so it must be called **outside** any `try` — drives the no-`try/catch` shape of `signInWithEmailAction` |
| `01-app/03-api-reference/03-file-conventions/page.md:14,125,140` | `searchParams` is a `Promise`; `PageProps<'/login/check-email'>` is a **globally available** generated helper, no import |
| `next/dist/client/components/navigation.d.ts:128` | `unstable_rethrow` **is** exported from `next/navigation` in 16.3.5. Recorded because it is the only correct way to catch around a `redirect`-throwing call — and D18 explains why this design still needs no catch |
| existing route | `src/app/api/auth/[...nextauth]/route.ts` exports `{ GET, POST } = handlers`. Unchanged. Every Auth.js redirect in the data flow below is served by this one file |

### Auth.js facts this design is built on

Read from `node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/` and `next-auth@5.0.0-beta.32`. Every row was read from source this pass, not carried from the exploration.

| Source | Fact relied on |
|---|---|
| `lib/utils/assert.js:18-22,128-161` | `emailMethods` is exactly `["createVerificationToken","useVerificationToken","getUserByEmail"]`. `requiredMethods` is selected by `hasEmail` (`assert.js:92,133-142`): because the Resend provider is `type: "email"`, it is always the three `emailMethods`, regardless of `session.strategy`. The explicit `session: { strategy: "jwt" }` matters for a different reason — it drives `useJwtSession` in `handle-login.js`, which keeps the database-session branch (`createSession`/`getSessionAndUser`/`deleteSession`) unreached. The check is `!(m in adapter)`: a key present but not a function passes (D10) |
| `lib/actions/callback/handle-login.js:29,34-41,55-89` | All nine methods are destructured unconditionally (destructuring a missing key yields `undefined`, it does not throw). The *calls* are: `getUserByEmail` always (:57); `updateUser` when the email exists (:68); `createUser` when it does not (:76); `getUser` only when a session cookie is present and decodes with a `sub` (:40); `createSession`/`deleteSession`/`getSessionAndUser` only when `sessionStrategy !== "jwt"` (:48,65,83) |
| `lib/actions/callback/handle-login.js:76` | `createUser({ ...profile, emailVerified: new Date() })` where `profile` for a new address is the fabricated `{ id: randomUUID(), email, emailVerified: null }` from `callback/index.js:156-160` — **no `name`, no `image`**. The adapter must derive the display name (D9) and must persist `emailVerified` (D8) |
| `lib/actions/callback/index.js:173-178` | `defaultToken = { name, email, picture, sub: loggedInUser.id }` — `token.sub` is the internal `users.id` on this path (A9) |
| `lib/actions/signin/send-token.js:43-66` | `token = randomString(32)`; `url = ${basePath}/callback/resend?callbackUrl&token&email`; `sendVerificationRequest(...)` and `createVerificationToken({ identifier, token: await createHash(token+secret), expires })` run under one `Promise.all` — so a throttled (or failed) send still writes a token row |
| `lib/utils/web.js:75-82` | `createHash` is SHA-256 hex → `verification_tokens.token` is always 64 lowercase hex characters, and the raw token never reaches this codebase |
| `lib/actions/signin/send-token.js:74-104` | `defaultNormalizer`: `email.normalize("NFKC").toLowerCase().trim()`, reject `"`, require exactly two `@`-parts both non-empty, `domain = domain.split(",")[0]` non-empty. Throws a plain `Error` on bad input (D17) |
| `lib/actions/callback/index.js:132-154` | A missing `token` query param throws a **plain `TypeError` with `name = "Configuration"`** (not an `AuthError`). `useVerificationToken` returning `null`, an expired `expires`, or an `identifier` mismatch throws `Verification` |
| `index.js:120-141`, `errors.js:412-432` | On a thrown error: `isClientError` is false for anything that is not an `AuthError` whose `type` is in `clientErrors`, so **every** non-`AuthError` becomes `?error=Configuration`. `pageKind = error.kind ?? "error"` → `config.pages.error` → `Response.redirect(origin + "/login?error=…")` |
| `index.js:79-106` | A config error (`MissingAdapterMethods`) on a **non-GET** action returns bare `500 JSON`; on a **GET** html-page action it redirects to `pages.error?error=Configuration` |
| `next-auth/lib/actions.js:44-54` | The server-action `signIn()` calls `Auth(req, { ...config, raw, skipCSRFCheck })` and then `redirect(res.headers.get("Location") ?? url)` — where `url` is the signin **GET** URL. This is what turns the bare 500 into a styled page (D11) |
| `lib/utils/env.js::setEnvDefaults` | For provider id `resend`, `AUTH_RESEND_KEY` is read from `process.env` into `provider.apiKey`. There is **no** auto-wired variable for `from` |
| `lib/pages/index.js:107-112` | `verifyRequest()` returns `{ redirect: pages.verifyRequest + url.search }` — a **relative** Location, set via `toResponse` (`lib/utils/web.js:68-72`) at status 302, which browsers resolve |
| `errors.js:333-335`, `providers/webauthn.js:80` | `EmailSignInError` is thrown **only** by the WebAuthn provider in 0.41.3. It is unreachable on this flow (D20) |
| `package.json` exports | `@auth/core` exposes only `.`, `./adapters`, `./errors`, `./jwt`, `./providers`, `./providers/*`, `./types`. `./lib/*` is **not** an exported subpath — `defaultNormalizer` cannot be imported (D17). `next-auth/adapters` is a types-only re-export of `@auth/core/adapters` (D22) |

---

## Architecture Decisions

### D1 — Minimal custom `Adapter` over the hexagonal ports (confirms proposal Option B)

**Choice**: `src/adapters/auth/auth-adapter.ts` exports `createAuthAdapter({ users, tokens }): Adapter`, a factory over two domain ports. It performs no database access and imports nothing from `src/adapters/db`.

**Alternatives considered**: `@auth/d1-adapter` (Option A).

**Rationale**: unchanged from the exploration's verdict — the d1-adapter's four unprefixable tables collide by name with the existing `users` table and route DB access around `UserRepository`, which is the one convention every feature in this codebase keeps. The port boundary also buys the R3 escape hatch: swapping Resend for another HTTP email API is one adapter file, not an auth rewrite.

### D2 — `email_verified_at`, not `email_verified`

**Choice**: the column is `email_verified_at` (`emailVerifiedAt` in Drizzle and in the domain `User`), mapped to Auth.js's `AdapterUser.emailVerified` inside the adapter.

**Alternatives considered**: the proposal §1's `email_verified`; a separate boolean plus a timestamp.

**Rationale**: every timestamp column in `src/db/schema.ts` ends in `_at` — `created_at`, `completed_at`, `updated_at`, `last_polled_at`, `next_poll_after`, `joined_at`. `email_verified` would be the only one that does not, and it reads as a boolean while storing an epoch, which is exactly the kind of column a future reader `WHERE email_verified = 1`s. The adapter is already the translation layer between Auth.js's vocabulary and the domain's (`AdapterUser.name` ↔ `User.displayName`, `AdapterUser.image` ↔ `User.avatarUrl`), so one more rename costs nothing there. This is a naming refinement of the approved proposal, not a behavioural change.

### D3 — `0003` is generated by drizzle-kit and then hand-edited at exactly one statement

**Discovered defect in the generated output**: `drizzle-kit@0.31.10`'s `SQLiteRecreateTableConvertor` (`drizzle-kit/api.js:15168-15212`) builds the copy step as

```js
`INSERT INTO \`${newTableName}\`(${columnNames}) SELECT ${columnNames} FROM \`${tableName}\`;`
```

where `columnNames` is the **new** column list. For this diff that emits `SELECT "id", "email", "email_verified_at", … FROM users`, and `users` has no `email` column yet, so the generated migration fails with `no such column: email` on the first database it touches, including `createTestDb()`.

**Choice**: run `pnpm db:generate` (so `drizzle/meta/0003_snapshot.json` and `_journal.json` are authored by drizzle-kit and future diffs stay correct), then hand-edit **only** the `SELECT` list of that one statement to supply the two new columns:

```sql
INSERT INTO `__new_users`("id", "email", "email_verified_at", "display_name", "avatar_url", "created_at")
  SELECT "id", "id" || '@legacy.invalid', NULL, "display_name", "avatar_url", "created_at" FROM `users`;
```

The edit is recorded in a `--` comment at the top of the file naming the drizzle-kit source line, so a regenerate does not silently undo it.

**Alternatives considered**: (a) drop the copy step entirely — the proposal notes the rows carry nothing that matters; (b) hand-write the whole migration; (c) avoid the recreate with `DROP INDEX users_discord_id_unique` → `ALTER TABLE users DROP COLUMN discord_id` → `ADD COLUMN email text NOT NULL DEFAULT ''`.

**Rationale**: (a) leaves every `riot_accounts` / `challenges` / `participants` / `progress` row orphaned in any database that had data, because `PRAGMA foreign_keys=OFF` is in force and SQLite never retro-validates — silent corruption in the owner's local DB in exchange for saving one line. The synthetic address keeps the migration *total*: no orphans in any database it is applied to, uniqueness guaranteed because `id` is the primary key, `email_verified_at` NULL which is truthful (a legacy row has never proved an address), and `.invalid` is reserved by RFC 2606 so the address can never receive mail and the row can therefore never be signed into. (b) loses the drizzle-kit snapshot, so the next `pnpm db:generate` would emit a spurious recreate. (c) is the only PRAGMA-free path, but `ADD COLUMN … NOT NULL` requires a non-NULL default, and a `DEFAULT ''` that is absent from `schema.ts` makes drizzle-kit want to recreate the table on the very next diff — trading one documented edit for permanent snapshot drift.

### D4 — `PRAGMA foreign_keys=OFF` is load-bearing, and the migration is only ever applied where no child rows exist

**The hazard**: with foreign keys enforced, `DROP TABLE users` performs an implicit `DELETE` that fires `ON DELETE CASCADE` on `riot_accounts` and `challenges` (and transitively `participants`). The copied user rows survive in `__new_users`, but every child row would be deleted. `PRAGMA defer_foreign_keys` does **not** help: it defers constraint *checks* to commit, while cascade *actions* still fire. Only `foreign_keys=OFF` prevents it.

**What is verified**: drizzle-kit emits `PRAGMA foreign_keys=OFF;` first and `PRAGMA foreign_keys=ON;` last (`api.js:15177,15210`). `wrangler`'s `splitSqlQuery` (`wrangler-dist/cli.js:224771`) splits migration files on semicolons and treats `--> statement-breakpoint` as an ordinary `--` line comment, so each PRAGMA is sent to D1 as its own statement. `@libsql/client@0.18.0` uses `PRAGMA foreign_keys=off` in its own batch implementation (`lib-esm/sqlite3.js:292`), so `createTestDb()` executes it without complaint.

**What is not verified**: whether D1 honours, ignores, or rejects `PRAGMA foreign_keys`. This repository has already recorded that uncertainty — `e2e/fixtures/seed.sql:5-8` deletes children before parents "since D1 does not necessarily run with `PRAGMA foreign_keys = ON`" — and no local source answers it.

**Choice**: do not try to resolve it. Make the question non-blocking instead, by requiring that `0003` is only ever applied to a database with **zero** `riot_accounts` and `challenges` rows:

| Database | Child rows at apply time | Why |
|---|---|---|
| `createTestDb()` | zero | migrations replay into an empty `:memory:` database before any suite seeds |
| local D1 (`pnpm db:migrate:local`) | disposable | `e2e-%` and `seed-%` rows only; `e2e/global-setup.ts` re-seeds on the next run |
| remote D1 (`pnpm db:migrate`) | zero | nothing has ever been deployed with working auth (Engram #27, #54, #100) |

The apply step for the remote migration therefore runs `wrangler d1 execute DB --remote --command "SELECT count(*) FROM riot_accounts"` and refuses to proceed on a non-zero count. If D1 rejects the PRAGMA statements outright, `wrangler d1 migrations apply` fails before mutating anything — a safe failure — and the contingency is to delete the two PRAGMA lines and re-apply, which is safe *precisely because* there are no child rows to cascade.

**Rationale**: this is the proposal's "point of no return at S3b" stated as an operational precondition instead of a hope. It is also the honest answer: a design that asserted a D1 PRAGMA behaviour it could not verify would be guessing about the one statement that can delete the owner's data.

### D5 — No standalone index on `verification_tokens.expires`

**Choice**: `verification_tokens` carries only its composite primary key `(identifier, token)`. The proposal's "plus an index on `expires`" is dropped.

**Rationale**: exactly one query in this design filters on `expires` — the opportunistic reap in `create`, which is `WHERE identifier = ? AND expires < ?`. The primary key's leading column already serves that, and the throttle caps a single identifier at five live rows, so the residual filter scans at most five rows. The only query an `expires`-only index would help is a global sweep, which this design deliberately does not have (D7). An unused index is a B-tree write on every magic link issued, forever. If a reaper cron is ever added, it brings its own migration and its own index.

### D6 — `consume` is one `DELETE … RETURNING` statement; the db type stays driver-agnostic

**Choice**:

```sql
DELETE FROM verification_tokens WHERE identifier = ? AND token = ? RETURNING identifier, token, expires
```

expressed as `db.delete(...).where(and(eq(identifier), eq(token))).returning()`. One statement, therefore atomic in SQLite, therefore single-use with no transaction and no `batch`.

**Alternatives considered**: `SELECT` then `DELETE` (two statements, a window in which two concurrent clicks both read the row); wrapping the pair in `db.batch([...])`.

**Rationale**: a magic link that can be redeemed twice is not a magic link, and a read-then-delete pair cannot promise otherwise without a transaction D1 does not expose per-statement. `.returning()` on a SQLite delete is in the installed `drizzle-orm@0.45.2` (`sqlite-core/query-builders/delete.d.ts:107-108`). `batch` was rejected for a second reason: it is a driver-specific method absent from `BaseSQLiteDatabase`, so using it would force the db parameter to `DrizzleD1Database` and the adapter tests to cast — and "a cast in a test is a lie about what the code accepts" (`src/adapters/db/challenge-repository.ts:14-22`). The new repositories reuse that exact type:

```ts
export type AuthDb = BaseSQLiteDatabase<"async", unknown, typeof schema>;
```

`DELETE … RETURNING` is the one statement whose D1 support this design cannot prove locally (libsql definitely supports it; the adapter test therefore proves semantics, not driver availability). Manual plan step 3 — clicking the same link twice against real D1 — is what covers it, and it is step 3 for that reason.

### D7 — `create` inserts first, then reaps expired rows for the same identifier

**Choice**: two sequential awaits, no batch:

```sql
INSERT INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?);
DELETE FROM verification_tokens WHERE identifier = ? AND expires < ?;
```

**Alternatives considered**: reap first; a scheduled global reaper on the existing `*/5 * * * *` cron; no reaping at all.

**Rationale**: insert-first means the row the visitor is about to need exists before any housekeeping can fail; the reap's `expires < now` can never match the row just written, whose `expires` is `now + 15min`. Atomicity across the pair is not required — a failure between them leaves stale expired rows, which the next `create` for that identifier removes, and which no read path can mistake for valid (Auth.js owns the expiry comparison, `callback/index.js:147`). This is why the table needs no cron job: the write path is the garbage collector, bounded to one identifier. Reaping **only** expired rows for that identifier, never live ones, is A6 — requesting a second link does not invalidate the first.

### D8 — `createFromEmail` takes `emailVerifiedAt` (corrects the proposal's port shape)

**Choice**: `createFromEmail({ email, displayName, emailVerifiedAt })`.

**Alternatives considered**: the proposal §2's `createFromEmail({ email, displayName })`; `createFromEmail` followed by `markEmailVerified` (two writes).

**Rationale**: a defect in the proposal's shape. `handleLoginOrRegister` calls `createUser({ ...profile, emailVerified: new Date() })` (`handle-login.js:76`) — a first-time user has *just* proved they control the address — but the proposal's §1 says `email_verified` is "set by `updateUser` on every successful link consumption", and `updateUser` only runs on the **existing-user** branch (`:68`). With the two-argument shape, a brand-new user's `email_verified_at` stays NULL until their second sign-in, and the column's whole meaning ("the date of the first successful signin", `adapters.d.ts:177-180`) is wrong for every account on its first day. Passing the timestamp through costs one field and one write.

### D9 — `createUser` ignores the incoming id and derives the display name; `updateUser` accepts only `{ id, emailVerified }`

**Choice**:

- `createUser` discards `user.id` (Auth.js's throwaway `randomUUID()`), lets the repository mint `crypto.randomUUID()`, and sets `displayName: displayNameFromEmail(user.email)`. It ignores `user.name` and `user.image` because, verified above, Auth.js does not send them on this path.
- `updateUser` requires `emailVerified` to be a `Date` and **throws** when any key other than `id` and `emailVerified` is present.

**Alternatives considered**: honour Auth.js's `id` (it is what Auth.js puts on the token either way); silently ignore unsupported `updateUser` fields; implement a general-purpose `updateUser`.

**Rationale**: id generation stays in the one place that already owns it, and the returned `id` is what Auth.js writes to `token.sub`, so the internal id wins regardless. On `updateUser`: silently dropping a field Auth.js expected to be persisted is the failure mode nobody notices, and this adapter is pinned to an exact version (`next-auth@5.0.0-beta.32`, not a range) whose complete call site is quoted above — so an unexpected key means the version moved and the adapter has not. The cost of throwing is bounded and recoverable: per D11 it surfaces as `/login?error=Configuration` with styled copy, not a 500, and the contract test plus the pinned version mean the owner finds out at build time in the normal case.

### D10 — `REQUIRED_ADAPTER_METHODS` asserts `typeof === "function"`, not key presence

**Choice**:

```ts
export const REQUIRED_ADAPTER_METHODS = [
  "createVerificationToken",
  "useVerificationToken",
  "getUserByEmail",
  "createUser",
  "updateUser",
  "getUser",
] as const satisfies readonly (keyof Adapter)[];
```

The contract test iterates it and asserts `typeof adapter[method] === "function"` for each.

**Alternatives considered**: assert `method in adapter`, mirroring `assertConfig`.

**Rationale**: `assertConfig` itself only does `requiredMethods.filter((m) => !(m in adapter))` (`assert.js:157`), so a key whose value is `undefined` — the exact shape a bad destructure or a renamed export produces — passes Auth.js's own check and then `TypeError`s at call time. The `satisfies readonly (keyof Adapter)[]` clause makes the tuple fail to compile if Auth.js renames a method, which is the one failure mode a runtime test cannot see. The six are also justified individually, not as a round number: `getUserByEmail` is called on every sign-in and every callback; `updateUser` on the returning-user branch; `createUser` on the new-user branch; `getUser` only when a session cookie is already present — and even then inside a swallowing `try/catch` whose result is read only behind `!useJwtSession` (`handle-login.js:36-42,61`), so a missing `getUser` has no runtime symptom in this JWT-only app. Its place in the tuple is a drift guard (the `satisfies` clause fails to compile if Auth.js renames it), not a runtime-symptom guard; manual plan step 2 cannot detect it (D11).

### D11 — Verified: no bare 500 reaches the visitor; every failure lands on `/login?error=<code>`

This revises the severity of proposal risks R1 and R2 and re-aims what the contract test is for. Traced through source this pass:

| Failure | Path | What the visitor sees |
|---|---|---|
| Adapter missing a **statically checked** method | `signIn()` POSTs with `raw`; `Auth()` returns bare `500 JSON` (`index.js:85-89`). `next-auth/lib/actions.js:48-53` reads `Location` from that Response — `null` — and falls back to `redirectUrl = url`, the signin **GET** URL. `redirect()` serves 303; the browser GETs `/api/auth/signin/resend`; `assertConfig` fails again, but now `htmlPages.has("signin") && method === "GET"`, so `index.js:105-106` redirects to `pages.error` | `/login?error=Configuration`, styled |
| Adapter missing `createUser`/`updateUser` | `TypeError` inside `handleLoginOrRegister` on the callback GET (`handle-login.js:68,76`, outside any try) → not an `AuthError` → `index.js:130-140` → `pages.error` | `/login?error=Configuration`, styled |
| Adapter missing `getUser` | **No visible symptom.** The only call (`handle-login.js:40`) sits inside a bare `try/catch` that swallows the `TypeError`, and its result is read only behind `!useJwtSession` (`:61`), which is always false here. The contract test (D10) is the only guard for this method; manual plan step 2 cannot detect it | nothing — sign-in proceeds normally |
| Resend send fails, or `AUTH_RESEND_KEY` absent | our named error out of `sendVerificationRequest` → out of `sendToken` → `index.js:120-140`, not an `AuthError` → `type = "Configuration"` | `/login?error=Configuration`, styled |
| Link opened with `token` stripped | plain `TypeError` named `"Configuration"` (`callback/index.js:134-138`) | `/login?error=Configuration`, styled |
| Link expired, reused, or identifier mismatched | `Verification` — an `AuthError` in `clientErrors`, `kind` defaults to `"error"` | `/login?error=Verification`, styled |
| `callbacks.signIn` rejects | `AccessDenied` — in `clientErrors`, `kind` `"error"` | `/login?error=AccessDenied`, styled |
| Invalid email submitted straight to `/api/auth/signin/resend` | `defaultNormalizer` throws a plain `Error` before any try | `/login?error=Configuration`, styled |

**Consequences for this design**, all of which it adopts:

1. `signInWithEmailAction` needs **no** `try/catch` — there is no reachable non-redirect throw to catch (D18). This replaces the "catch a thrown non-redirect error and return an action state" shape the phase brief anticipated.
2. The `Configuration` merge (A3) is carrying **four** cases, not two: mangled link, missing adapter method, failed send, and an invalid address POSTed directly. Its copy must be true for all four — which is why it says "temporarily unavailable" rather than "misconfigured" (D20).
3. The `REQUIRED_ADAPTER_METHODS` test is not protecting against a bare 500. It is protecting against shipping a sign-in that *always* shows the merged `Configuration` message — a flow that is 100% broken while looking like a transient server problem. That is a worse outcome than a 500, and a build-time test is still the only place it can be caught, because Auth.js will not notice until a human clicks a link.

**Named caveat, accepted because unreached**: `@auth/core/index.js` re-throws a genuine `AuthError` when the call is `raw` and no `X-Auth-Return-Redirect` header is present (`if (isAuthError && isRaw && !isRedirect) throw error`, around `index.js:121`) — and `next-auth/lib/actions.js`'s `signIn()` sets neither. Today nothing on the `sendToken` path throws an `AuthError` because this config defines no `callbacks.signIn`; the moment one is added (an allow-list, say), its `AccessDenied` would surface to the Server Function as a thrown error rather than a `/login?error=AccessDenied` redirect, and `signInWithEmailAction` would need the `try/catch` D18 currently omits.

### D12 — Throttle: pure policy + storage-only port + one application use case as the seam

**Choice**: three pieces instead of one.

- `src/domain/send-throttle.ts` — pure `allowSend(state, now, policy)` and `DEFAULT_SEND_POLICY`.
- `src/domain/ports/email-throttle-repository.ts` — `find(identifier)` / `save(identifier, state)`. Storage only; no decision.
- `src/application/request-magic-link.ts` — the use case that reads, decides, writes, and sends.

**Alternatives considered**: the phase brief's `EmailThrottleRepository.recordAndCheck(email, now, policy)`; passing the policy function into the repository.

**Rationale**: `recordAndCheck` puts the rate-limit rule inside a D1 adapter, where it can only be tested against a database and where `src/application` can no longer see it — the opposite of every other rule in this codebase (`evaluate`, `needsBackfill`, `parseRiotId`, `safeParseRules` are all pure, with a thin adapter under them). The three-piece split means the window-rollover and cooldown cases are plain table-driven unit tests, the adapter test is a one-row read-modify-write, and the composition lives in `src/application` where `openspec/config.yaml`'s hexagonal rule already says decisions belong. `src/auth.ts` is the composition root that injects the D1 adapters, exactly as `src/app/account/actions.ts` injects `createRiotAccountRepository` into `linkRiotAccount`.

### D13 — A throttled request returns without throwing, and the residual timing signal is named rather than claimed away

**Choice**: `requestMagicLink` returns `{ kind: "throttled" }` and `sendVerificationRequest` awaits it and returns normally. Auth.js then writes the token row and redirects to `/login/check-email` exactly as it would for a sent link.

**Rationale**: returning without throwing *is* the enumeration-neutral response — same redirect, same page, same copy, for a new address, a known address, and a throttled address (R-ENUM, spec "Magic-Link Request Enumeration Neutrality"). The one thing this design will not claim is perfect timing neutrality: a throttled request skips an outbound HTTPS call to `api.resend.com` and therefore returns measurably faster. That difference discloses *the requester's own* throttle state, not whether an address is registered — registered and unregistered addresses run identical work (one `SELECT` that hits or misses, then an identical send). The spec's oracle requirement holds; the residual is recorded as threat row T5 rather than hidden.

### D14 — No dev-only URL logging. One `EmailSender`, which throws a named, URL-free error when unconfigured

**Choice**: the composition root builds exactly one `EmailSender` — the Resend HTTP adapter. When `AUTH_RESEND_KEY` is empty it throws `EmailSenderNotConfiguredError` at send time. No `console.log` of the magic link exists in any shipped file, under any env branch. Local development uses a real Resend key (the free tier sends to the account owner's own verified address without a domain, which is enough to exercise the flow).

**Alternatives considered**: a `ConsoleEmailSender` selected at the composition root when `AUTH_RESEND_KEY` is absent; printing the URL only when `process.env.NODE_ENV !== "production"`.

**Rationale**: this is not a preference, it is forced. `wrangler.jsonc:33-35` has `observability.enabled: true`, so anything printed goes to Cloudflare's log stream; the magic link is a bearer credential; and the spec requirement "No Token Leakage in Logs" is explicit that it holds "under any configuration state **including a missing or invalid provider API key**". A dev-only branch is production code whose guard is an environment variable — one `NODE_ENV` surprise under OpenNext and the credential is in a log aggregator. The failure mode without it is good: a named error, with no URL in its message, surfacing as styled copy on `/login` (D11), which is louder and safer than a flow that appears to work.

The error message is assembled from the HTTP status plus Resend's own `name`/`message` fields when they are strings — never from the request payload, never from the response body wholesale. That keeps the owner's P2 domain-verification debugging possible (Resend's errors say things like "domain is not verified") while making it structurally impossible for the link, the recipient, or the body to reach a log through the error path.

### D15 — `EMAIL_FROM` and `AUTH_RESEND_KEY` are read from `process.env` at the composition root, and neither read throws at config time

**Choice**: one `const emailFrom = process.env.EMAIL_FROM ?? ""` and one `const resendKey = process.env.AUTH_RESEND_KEY ?? ""` inside the lazy config body. `emailFrom` is passed both to `Resend({ from })` and to the sender. Missing values produce `""`, not a throw.

**Alternatives considered**: `wrangler.jsonc` `vars` + `env.EMAIL_FROM` (needs `pnpm cf-typegen`); reading `provider.apiKey` inside `sendVerificationRequest` (Auth.js already wires `AUTH_RESEND_KEY` there via `setEnvDefaults`); a `requireEnv` that throws when either is unset.

**Rationale**: `process.env` is the mechanism `AUTH_DISCORD_ID` already relies on under OpenNext, so there is no new plumbing and no typegen change — `cloudflare-env.d.ts` is generated from `wrangler.jsonc` bindings, not from `.dev.vars` keys. Throwing at config time was rejected outright: the lazy config function runs on **every** `auth()` call, so a missing `EMAIL_FROM` would 500 every page on the site because sign-in email is unconfigured. Confining the failure to the send is the whole point of D14's named error. Reading `provider.apiKey` instead of `process.env` would be one source rather than two, but its type on the internal params object needs a narrowing guard for no behavioural gain; the duplicate read is documented in `src/auth.ts` with a comment naming `setEnvDefaults` so nobody "fixes" one of them away.

`from` is set on the provider even though our `sendVerificationRequest` replaces the one function that reads it, so the config reads truthfully and a future revert to Auth.js's default `sendVerificationRequest` is not silently broken with `no-reply@authjs.dev` (which Resend rejects for an unverified domain).

Both values also need to exist for the deployed worker: `wrangler secret put AUTH_RESEND_KEY` and `wrangler secret put EMAIL_FROM`. `EMAIL_FROM` is not secret and could be a `vars` entry instead, but keeping both in one mechanism keeps the owner's setup to one command shape.

### D16 — Pure helpers live flat in `src/domain/*`, not `src/domain/auth/*`

**Choice**: `src/domain/email-identity.ts`, `src/domain/magic-link-email.ts`, `src/domain/send-throttle.ts`. New adapter folders `src/adapters/auth/` and `src/adapters/email/` **are** created.

**Alternatives considered**: the proposal §4's `src/domain/auth/{magic-link-email,send-throttle,email-identity}.ts`.

**Rationale**: `src/domain/` is flat today — 15 modules plus a single `ports/` subdirectory. `src/adapters/` is grouped by technology (`db`, `riot`, `queue`), so `auth` and `email` belong there. Three files do not justify inverting the domain's layout, and the design skill's own rule is to follow the existing pattern unless the change is specifically about changing it. `magic-link-email.ts` in the domain follows the archived D11 precedent exactly: product copy with scenarios belongs where Vitest can run it under `environment: "node"` with no DOM, which is where `rule-text.ts` already lives.

### D17 — `normalizeEmail` mirrors `defaultNormalizer` by a cited case table, and returns `null` instead of throwing

**Choice**:

```ts
export function normalizeEmail(raw: unknown): string | null;
```

implementing, in this order (mirroring `send-token.js:74-104`, cited in the doc comment): reject non-strings and empties → `raw.normalize("NFKC").toLowerCase().trim()` → reject any `"` → split on `@`, require exactly two non-empty parts → `domain = domain.split(",")[0]`, reject empty → return `` `${local}@${domain}` ``. No plus-tag stripping, no dot folding.

**Alternatives considered**: import `defaultNormalizer` and delegate; a zod email schema; throwing on invalid input.

**Rationale**: `@auth/core`'s `exports` map (read this pass) exposes no `./lib/*` subpath, so `defaultNormalizer` is unreachable — delegation is not an option, and a deep relative import into `node_modules` would be both unresolvable under the package's export map and brittle. A zod email schema would be a *second*, differently-shaped validator: the invariant that actually matters is that our stored value and Auth.js's `identifier` can never disagree, because a mismatch makes every link unredeemable, and the only way to hold that invariant is to implement the same rules and pin them with a case table. The pin is safe for the same reason the e2e cookie fixture's internals are (archived D16): `next-auth` is pinned to the exact `5.0.0-beta.32`, not a range.

Returning `null` rather than throwing is what lets the Server Function render a field-level error with no `try/catch` (D18). **No plus-tag stripping**: `alice+x@example.com` and `alice@example.com` are two addresses to Auth.js, and folding them in our storage while Auth.js keeps them apart is exactly the disagreement this function exists to prevent.

### D18 — `/login` stays a zero-JS server component: a plain Server Function plus `redirect`, never `useActionState`

**Choice**:

```ts
"use server";
export async function signInWithEmailAction(formData: FormData): Promise<void> {
  const email = normalizeEmail(formData.get("email"));
  const from = formData.get("from");

  if (!email) {
    redirect(invalidEmailLoginPath(from)); // throws; must stay outside any try
  }

  await signIn("resend", { email, redirectTo: safeReturnPath(from) });
}
```

The field-level error travels as its own query parameter, `/login?invalid=email&from=…`, rendered through the existing `Input error=` prop. `LoginPanel` gains `emailError?: string` and stays a server component with no `"use client"`.

**Alternatives considered**: `useActionState` + a `"use client"` `LoginPanel` (the `/account` `link-form.tsx` pattern); reusing `?error=` for the invalid-email case and having `messageForAuthError` return `null` for it.

**Rationale**: `/login` is the public entry point and ships zero client JavaScript today; `useActionState` would put a client boundary on the whole panel, discard the `renderToStaticMarkup` test pattern, and buy only the ability to repopulate a field the browser's own `type="email" required` already blocks in the overwhelming majority of cases. A separate `?invalid=email` parameter rather than an `?error=InvalidEmail` code keeps one meaning per channel: `?error=` is Auth.js's five-code panel-level taxonomy, `?invalid=` is our one field-level marker, and `messageForAuthError` does not have to learn a code Auth.js will never send. The cost is that the typed address is lost on the redirect; at one field that is a smaller cost than a client bundle.

No `try/catch` anywhere in the action, and none is needed — D11 establishes that every downstream Auth.js failure is already converted into a `/login?error=<code>` redirect before it can reach this function. `unstable_rethrow` from `next/navigation` (confirmed exported in 16.3.5) is the tool that *would* be required if a catch were ever added; this note exists so a future reader reaches for it instead of the private `isRedirectError` path.

`invalidEmailLoginPath` joins `safeReturnPath`/`withReturnPath` in `src/app/login/return-path.ts` — pure, unit-tested, and it re-runs `safeReturnPath(from, "")` so a hostile `from` is dropped on the error round trip too, not just on the success one.

### D19 — `/login/check-email` is a dependency-free static render

**Choice**: one file, `src/app/login/check-email/page.tsx`, a synchronous server component. It does **not** call `auth()`, ignores Auth.js's `?provider=resend&type=email`, and has no separate "panel" component.

**Alternatives considered**: a third `LoginPanel` state at `/login?sent=1`; calling `auth()` to redirect a signed-in visitor to `/account` the way `/login` does; splitting a thin root from a testable body.

**Rationale**: the dedicated route is A2, already approved; what this decision adds is that the page must have no async dependency, because that is the whole reason the route was preferred — "a parameterless static render, the cheapest possible test" (proposal §4). The thin-root/testable-body split in this codebase exists for exactly one reason, that `@/auth` cannot be imported under Vitest; a page that imports nothing but `next/link` needs no split and is tested directly with `renderToStaticMarkup`, which `login-panel.test.tsx` already proves works with `Link`. Not calling `auth()` leaves one cosmetic inconsistency with `/login` — a signed-in visitor who navigates here sees "check your inbox" instead of being bounced to `/account` — which is accepted in exchange for the zero-dependency property, and is unreachable in the real flow since Auth.js only redirects here immediately after a send.

Auth.js's query string arrives appended (`lib/pages/index.js:110`) and is deliberately unread: branching on `?provider=&type=` is the internal coupling the dedicated route was chosen to avoid.

### D20 — `messageForAuthError` keeps an unreachable `EmailSignInError` case, and the merged `Configuration` copy is widened to cover four situations

**Choice**: five cases plus the default.

| code | title | body |
|---|---|---|
| `Verification` | That link no longer works. | This sign-in link has expired or was already used. Request a new one. |
| `Configuration` | We couldn't use that sign-in link. | The link was incomplete, or sign-in is temporarily unavailable. Request a new link — if it keeps failing, that's on us, not on you. |
| `AccessDenied` | We can't sign you in with that email. | That address can't be used here. Nothing changed. |
| `EmailSignInError` | We couldn't send your sign-in link. | Something went wrong on our side before the email went out. Nothing changed on your account. Try again. |
| *(default)* | We couldn't sign you in. | Something went wrong while signing you in. Nothing changed on your account. Try again. |

**Rationale**: the `Configuration` body changed from the proposal's "sign-in is temporarily misconfigured" to "sign-in is temporarily unavailable" because D11 shows it carries four cases, one of which is a failed Resend call — which is an outage, not a misconfiguration. "Unavailable" is true for all four; "misconfigured" is true for two.

`EmailSignInError` is **not reachable** in `@auth/core@0.41.3`: the class is thrown only by the WebAuthn provider (`providers/webauthn.js:80`), and a throw out of `sendVerificationRequest` is a plain `Error` that becomes `Configuration`. The case is kept anyway — one switch arm, insurance against the obvious next version of Auth.js wrapping send failures in the error class whose own JSDoc describes exactly that (`errors.js:320-335`) — and its unreachability is recorded in a comment so nobody tests for it against a live round trip and concludes the flow is broken.

The error state's CTA keeps the main state's email field, relabelled "Try again", so a retry is one submit rather than a navigation.

### D21 — `AuthStatus` keeps its avatar branch; only the comment changes

**Choice**: `session.user.image` is now always `null` (no provider supplies one, `avatar_url` is never written — A8). The `{session.user.image ? <img …/> : null}` branch stays; the `eslint-disable` justification changes from "external Discord avatar" to a general external-URL note.

**Rationale**: A8 keeps the column; removing the branch is F-AVATAR's business, and deleting a conditional that is now statically false is a cleanup that would have to be re-added with the first real avatar. What `AuthStatus` renders after this change is therefore: the display name derived from the email local part, and a Sign out button — no image element in the markup, because the branch is false, not because it was deleted.

### D22 — Adapter types come from `next-auth/adapters`, not `@auth/core/adapters`

**Choice**: `import type { Adapter, AdapterUser, VerificationToken } from "next-auth/adapters";`

**Rationale**: `@auth/core` is a transitive dependency of `next-auth`, not a direct one, so pnpm's strict `node_modules` layout does not expose it at the project root — importing from it would resolve today only by accident of hoisting. `next-auth/adapters` is a types-only re-export (`export type * from "@auth/core/adapters"`), resolved through next-auth's own dependency tree, which also means it contributes nothing at runtime. This matches the existing convention: `e2e/fixtures/session.ts` imports `next-auth/jwt`, never `@auth/core/jwt`.

### D23 — Display name is the raw local part, trimmed and truncated; nothing cleverer

**Choice**: `displayNameFromEmail(email)` takes everything before the single `@`, trims, truncates to 20 characters, and falls back to `"Player"` when nothing usable remains. No plus-tag stripping, no dot-to-space, no title casing.

**Alternatives considered**: prettify (`diego.rivera` → `Diego Rivera`); strip `+tag`; the mockup's "05 Cuenta nueva" display-name step (deferred by A5).

**Rationale**: the spec's own scenario pins it — "`display_name` is derived from `diego.rivera`, truncated to at most 20 characters" — and the reason is that every prettification is a guess about a person's name that they cannot correct until F-NAME ships a rename surface. The raw local part is at least a string they typed. 20 characters matches the mockup's own `5 / 20` counter, so the limit is already the product's.

---

## 1. Schema and migrations

### `src/db/schema.ts` diff

`users` is replaced; two tables are added. Relations and every other table are untouched.

```ts
/** A person. Identity is the email address they proved they can read. */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  /** Normalised lowercase (NFKC, trimmed) — see normalizeEmail in domain/email-identity.ts. */
  email: text("email").notNull().unique(),
  /**
   * When this address was last proved readable. Auth.js refreshes it on every
   * successful link consumption; NULL only for a row carried by
   * drizzle/0003 from before email identity existed (D3).
   */
  emailVerifiedAt: integer("email_verified_at", { mode: "timestamp_ms" }),
  displayName: text("display_name").notNull(),
  /** Kept nullable and never written: no provider supplies one (A8, F-AVATAR). */
  avatarUrl: text("avatar_url"),
  createdAt: createdAt(),
});

/**
 * Auth.js's minimal verification-token shape (@auth/core/adapters.d.ts:232-241).
 * `token` is already SHA-256 hashed with AUTH_SECRET by the time Auth.js hands
 * it over (lib/utils/web.js:75-82), so the raw bearer value never reaches this
 * codebase or this database. No index on `expires`: the only query that filters
 * it also filters `identifier`, which the primary key's leading column covers (D5).
 */
export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

/**
 * One fixed-size row per address that has ever requested a link, so a flood
 * costs one row per distinct address rather than one row per request.
 * `window_started_at`/`sent_in_window` are the rolling-hour cap;
 * `last_sent_at` is the 60-second cooldown. See domain/send-throttle.ts.
 */
export const authEmailThrottle = sqliteTable("auth_email_throttle", {
  identifier: text("identifier").primaryKey(),
  lastSentAt: integer("last_sent_at", { mode: "timestamp_ms" }).notNull(),
  windowStartedAt: integer("window_started_at", { mode: "timestamp_ms" }).notNull(),
  sentInWindow: integer("sent_in_window").notNull().default(0),
});
```

Column names keep the proposal's `identifier` / `last_sent_at` / `window_started_at` / `sent_in_window` rather than the brief's `email` / `window_start` / `count`: `identifier` is the same word `verification_tokens` and Auth.js use for the same value, and `sent_in_window` says what it counts.

`export type User = typeof users.$inferSelect;` at the bottom of `schema.ts` keeps working; two type exports are added for the new tables.

### `drizzle/0002_auth_email_tables.sql` — generated by `pnpm db:generate`, unedited

drizzle-kit emits tables alphabetically (as `0000` shows: challenges, match_cache, participants, …):

```sql
CREATE TABLE `auth_email_throttle` (
	`identifier` text PRIMARY KEY NOT NULL,
	`last_sent_at` integer NOT NULL,
	`window_started_at` integer NOT NULL,
	`sent_in_window` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
```

Purely additive. Nothing references either table until S2/S3a.

### `drizzle/0003_users_email_identity.sql` — generated, then one statement hand-edited (D3)

```sql
-- Hand-edited after `pnpm db:generate`: drizzle-kit's SQLiteRecreateTableConvertor
-- (drizzle-kit/api.js:15191-15193) builds the copy step as
-- `SELECT <new column list> FROM users`, which fails with `no such column: email`
-- because `email` only exists on the new table. The SELECT list below is the only
-- edit; see design.md D3. Carried rows get a non-routable RFC 2606 `.invalid`
-- address so no row is orphaned and no carried row can ever be signed into.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified_at` integer,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "email_verified_at", "display_name", "avatar_url", "created_at") SELECT "id", "id" || '@legacy.invalid', NULL, "display_name", "avatar_url", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
```

The index name follows the existing convention (`users_discord_id_unique`, `riot_accounts_puuid_unique`). It is created **after** the copy, and the carried addresses are distinct because `id` is the primary key, so uniqueness holds.

### How `createTestDb()` applies both

Unchanged — `src/adapters/db/test-db.ts` already reads every `drizzle/NNNN_*.sql` in filename order and splits on `--> statement-breakpoint`, which is exactly what drizzle-kit emits, including for the recreate. Three consequences worth stating because they are what make the adapter suite the regression test for R8:

1. The `PRAGMA` chunks are single statements, which `@libsql/client`'s `execute` accepts (it issues `PRAGMA foreign_keys=off` itself at `lib-esm/sqlite3.js:292`).
2. The copy statement must *resolve* against the old table even when it matches zero rows, so the edited `SELECT` list may reference only `id`, `display_name`, `avatar_url`, `created_at` — never `email`, never `discord_id`.
3. Every existing adapter suite that seeds users → riot accounts → challenges → participants → progress runs against the post-recreate schema, so a recreate that broke a foreign key fails those suites rather than production.

No change to `test-db.ts` is needed or wanted.

---

## 2. Ports and contracts

### `src/domain/ports/user-repository.ts` — rewritten

```ts
/** A person, as stored. Identity is the email address — see `users` in schema.ts. */
export type User = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
};

/** A first sign-in, in the domain's terms. `email` is already normalised. */
export type NewEmailUser = {
  email: string;
  displayName: string;
  /** Non-null on a real first sign-in: the link proved the address readable (D8). */
  emailVerifiedAt: Date | null;
};

export type UserRepository = {
  findById(id: string): Promise<User | null>;

  /** `email` must already be normalised; this does not normalise it again. */
  findByEmail(email: string): Promise<User | null>;

  /** Mints the id. Rejects a duplicate email at the unique index, not in code. */
  createFromEmail(user: NewEmailUser): Promise<User>;

  /**
   * Refreshes `emailVerifiedAt`, preserving `id`, `createdAt`, `email` and
   * `displayName` — the first two because `riot_accounts.user_id` and
   * `challenges.owner_id` depend on them, the last because a derived display
   * name is never re-derived (spec: "display_name is not re-derived or changed").
   * Throws when no row matches: Auth.js's `updateUser` contract returns a user,
   * not null.
   */
  markEmailVerified(id: string, verifiedAt: Date): Promise<User>;
};
```

`DiscordIdentity` and `upsertFromDiscord` are deleted.

### `src/domain/ports/verification-token-repository.ts` — new

```ts
/** Auth.js's minimal verification token. `token` arrives already hashed. */
export type VerificationToken = {
  identifier: string;
  token: string;
  expires: Date;
};

export type VerificationTokenRepository = {
  /**
   * Stores one token, then opportunistically deletes already-expired tokens for
   * the same identifier (D7). Does not touch live tokens for that identifier:
   * requesting a second link must not invalidate the first (A6).
   */
  create(token: VerificationToken): Promise<void>;

  /**
   * Single use: deletes the row and returns what it deleted, in one statement
   * (D6). Returns null when the pair does not exist — including the second
   * attempt on the same link. Does **not** compare `expires`: Auth.js owns that
   * comparison (@auth/core/lib/actions/callback/index.js:147), and a repository
   * that silently dropped an expired row would turn an explainable "that link
   * expired" into an unexplainable "that link never existed".
   */
  consume(lookup: { identifier: string; token: string }): Promise<VerificationToken | null>;
};
```

### `src/domain/ports/email-throttle-repository.ts` — new

```ts
/** What is remembered about one address's send history. */
export type SendThrottleState = {
  lastSentAt: Date;
  windowStartedAt: Date;
  sentInWindow: number;
};

/** Storage only — the rule lives in domain/send-throttle.ts (D12). */
export type EmailThrottleRepository = {
  find(identifier: string): Promise<SendThrottleState | null>;
  /** Insert-or-replace of the single row for `identifier`. */
  save(identifier: string, state: SendThrottleState): Promise<void>;
};
```

### `src/domain/ports/email-sender.ts` — new

```ts
export type OutgoingEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Sending one email. No `from`: who this service is, is adapter configuration,
 * not something a use case decides per message.
 */
export type EmailSender = {
  send(email: OutgoingEmail): Promise<void>;
};
```

(The proposal's `send({ to, from, … })` carried `from` per message; moved to the adapter's constructor for the reason in the doc comment.)

### `src/domain/send-throttle.ts` — new, pure

```ts
export type SendPolicy = {
  cooldownMs: number;
  windowMs: number;
  maxPerWindow: number;
};

/** A4: one link per address per minute, five per address per rolling hour. */
export const DEFAULT_SEND_POLICY: SendPolicy = {
  cooldownMs: 60_000,
  windowMs: 60 * 60_000,
  maxPerWindow: 5,
};

export type SendDecision = { allowed: boolean; nextState: SendThrottleState };

export function allowSend(
  state: SendThrottleState | null,
  now: Date,
  policy: SendPolicy = DEFAULT_SEND_POLICY,
): SendDecision;
```

Rules, in order:

1. `state === null` → `{ allowed: true, nextState: { lastSentAt: now, windowStartedAt: now, sentInWindow: 1 } }`.
2. Roll the window first: if `now - windowStartedAt >= windowMs`, the working state becomes `{ lastSentAt: <unchanged>, windowStartedAt: now, sentInWindow: 0 }`. `lastSentAt` deliberately survives the roll, so the 60-second cooldown still applies across an hour boundary.
3. Refuse when `now - lastSentAt < cooldownMs` **or** `sentInWindow >= maxPerWindow`, returning `{ allowed: false, nextState: <the rolled state> }`.
4. Otherwise `{ allowed: true, nextState: { lastSentAt: now, windowStartedAt: <rolled>, sentInWindow: <rolled> + 1 } }`.

A `nextState` is returned on **every** path, and the use case always saves it — which is what satisfies the spec's "MUST persist the throttle state" and "the throttle decision is based on persisted state from the prior request, not reset to a fresh state" without a second code path. A clock that moves backwards makes `now - lastSentAt` negative, which reads as "inside the cooldown" and refuses; failing closed on a skewed clock is the correct direction and is a named test case.

### `src/application/request-magic-link.ts` — new use case

```ts
export type RequestMagicLinkResult = { kind: "sent" } | { kind: "throttled" };

export function requestMagicLink(deps: {
  throttle: EmailThrottleRepository;
  sender: EmailSender;
  now: () => Date;
  siteName: string;
  expiresInMinutes: number;
  policy?: SendPolicy;
}): (input: { identifier: string; url: string }) => Promise<RequestMagicLinkResult>;
```

Flow: `throttle.find(identifier)` → `allowSend(state, now(), policy)` → `throttle.save(identifier, nextState)` → if `!allowed` return `{ kind: "throttled" }` → `sender.send({ to: identifier, ...magicLinkEmail({ url, expiresInMinutes, siteName }) })` → `{ kind: "sent" }`.

The state is saved **before** the send, so a Resend failure cannot be retried past the cooldown by hammering the form. A send failure propagates (D14) — it must, or the visitor is told to check an inbox nothing was sent to. There is no `{ kind: "send_failed" }` result for the same reason: this use case has no way to show the visitor anything, and swallowing the failure would be the one outcome that silently breaks sign-in.

No `src/adapters` import — the hexagonal rule from `openspec/config.yaml` holds.

---

## 3. The Auth.js adapter — `src/adapters/auth/auth-adapter.ts`

```ts
import type { Adapter, AdapterUser, VerificationToken } from "next-auth/adapters";

/**
 * The six methods Auth.js's email + JWT path actually calls, verified against
 * @auth/core@0.41.3 source:
 *   createVerificationToken, useVerificationToken, getUserByEmail  — assertConfig's
 *     `emailMethods` (lib/utils/assert.js:18-22), the only three checked at boot
 *   createUser, updateUser, getUser                                 — called by
 *     handleLoginOrRegister at :76, :68 and :40, unchecked at boot, so a gap is a
 *     runtime TypeError on the first real click. See design.md D10/D11.
 * Not implemented, and not reachable: createSession / getSessionAndUser /
 * deleteSession (database-strategy only, :48/:65/:83), getUserByAccount /
 * linkAccount (OAuth and WebAuthn branches), everything WebAuthn.
 */
export const REQUIRED_ADAPTER_METHODS = [
  "createVerificationToken",
  "useVerificationToken",
  "getUserByEmail",
  "createUser",
  "updateUser",
  "getUser",
] as const satisfies readonly (keyof Adapter)[];

export function createAuthAdapter(deps: {
  users: UserRepository;
  tokens: VerificationTokenRepository;
}): Adapter;
```

### Mapping

| Auth.js method | Implementation |
|---|---|
| `createVerificationToken(token)` | `await tokens.create(token); return token;` — Auth.js ignores the return value on this path, but the interface declares one |
| `useVerificationToken({ identifier, token })` | `tokens.consume({ identifier, token })` |
| `getUserByEmail(email)` | `toAdapterUser(await users.findByEmail(normalizeEmail(email) ?? email))` — normalises its argument so a caller that skipped normalisation still hits the row; falls through to the raw value rather than returning `null` on an unnormalisable address, so the lookup misses honestly instead of looking like a validation failure |
| `createUser(user)` | ignores `user.id`; `users.createFromEmail({ email: normalizeEmail(user.email) ?? user.email, displayName: displayNameFromEmail(user.email), emailVerifiedAt: user.emailVerified ?? null })` |
| `updateUser(user)` | guards, then `users.markEmailVerified(user.id, user.emailVerified)` |
| `getUser(id)` | `toAdapterUser(await users.findById(id))` |

`toAdapterUser` is the whole translation layer:

```ts
function toAdapterUser(user: User | null): AdapterUser | null {
  return user === null
    ? null
    : {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerifiedAt,   // D2
        name: user.displayName,
        image: user.avatarUrl,                 // always null today (A8, D21)
      };
}
```

`updateUser`'s guard, stated exactly (D9):

```ts
async updateUser(user) {
  const unsupported = Object.keys(user).filter((key) => key !== "id" && key !== "emailVerified");
  if (unsupported.length > 0) {
    throw new Error(
      `auth-adapter: updateUser cannot persist ${unsupported.join(", ")}. ` +
        "Auth.js 5.0.0-beta.32 calls it only with { id, emailVerified } " +
        "(@auth/core/lib/actions/callback/handle-login.js:68). A new field means " +
        "the version moved and this adapter has not.",
    );
  }
  if (!(user.emailVerified instanceof Date)) {
    throw new Error("auth-adapter: updateUser called without an emailVerified Date.");
  }
  return toAdapterUserOrThrow(await users.markEmailVerified(user.id, user.emailVerified));
}
```

This file imports `normalizeEmail`/`displayNameFromEmail` from `src/domain/email-identity.ts` and the two port types. It imports nothing from `src/adapters/db` and touches no database, which is what makes the contract and mapping tests pure.

---

## 4. `src/auth.ts` after the swap

```ts
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";

import { createAuthAdapter } from "@/adapters/auth/auth-adapter";
import { createEmailThrottleRepository } from "@/adapters/db/email-throttle-repository";
import { createUserRepository } from "@/adapters/db/user-repository";
import { createVerificationTokenRepository } from "@/adapters/db/verification-token-repository";
import { createResendEmailSender } from "@/adapters/email/resend-email-sender";
import { enrichToken, sessionFromToken } from "@/auth/callbacks";
import { requestMagicLink } from "@/application/request-magic-link";
import { getAppDb } from "@/lib/db";
import { SITE_NAME } from "@/lib/legal";

/** A7: a link in an inbox is a bearer credential; 15 minutes, single use. */
const MAGIC_LINK_TTL_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  // Lazy config — a function, not an object — because the D1 binding only
  // exists once a request reaches the worker. This body therefore runs on
  // every auth() call, which is why nothing in it throws on missing env (D15):
  // a thrown config would 500 every page, not just sign-in.
  const db = await getAppDb();
  const users = createUserRepository(db);
  const tokens = createVerificationTokenRepository(db);
  const throttle = createEmailThrottleRepository(db);

  // Read explicitly from process.env, matching the Discord precedent and
  // needing no `pnpm cf-typegen` change (cloudflare-env.d.ts is generated from
  // wrangler.jsonc bindings, not from .dev.vars keys). Note that Auth.js's own
  // setEnvDefaults ALSO reads AUTH_RESEND_KEY into provider.apiKey; our
  // sendVerificationRequest does not use provider.apiKey, so both reads are
  // intentional — do not "simplify" one of them away.
  const emailFrom = process.env.EMAIL_FROM ?? "";
  const sender = createResendEmailSender({
    apiKey: process.env.AUTH_RESEND_KEY ?? "",
    from: emailFrom,
  });

  const sendMagicLink = requestMagicLink({
    throttle,
    sender,
    now: () => new Date(),
    siteName: SITE_NAME,
    expiresInMinutes: MAGIC_LINK_TTL_MINUTES,
  });

  return {
    adapter: createAuthAdapter({ users, tokens }),
    providers: [
      Resend({
        // Unused by the sendVerificationRequest below, which builds its own
        // message — set so the config reads truthfully and so a revert to
        // Auth.js's default sender does not silently use no-reply@authjs.dev,
        // which Resend rejects for an unverified domain.
        from: emailFrom,
        maxAge: MAGIC_LINK_TTL_MINUTES * 60,
        // The single choke point Auth.js calls for every entry path — the
        // Server Function and a direct POST to /api/auth/signin/resend alike —
        // which is why the throttle lives here and not in the action (§6).
        // Returning without sending leaves Auth.js's behaviour identical: it
        // still writes the token row and still redirects to the check-inbox
        // page, which is exactly the enumeration-neutral response (R-ENUM).
        // `url` is a bearer credential: never log it, never put it in an error.
        async sendVerificationRequest({ identifier, url }) {
          await sendMagicLink({ identifier, url });
        },
      }),
    ],
    // Explicit on purpose: `session.strategy` drives `useJwtSession` in
    // @auth/core/lib/actions/callback/handle-login.js, which keeps the
    // database-session branch (createSession/getSessionAndUser/deleteSession)
    // unreached. assertConfig's required-method set is chosen by `hasEmail`,
    // not by this setting (@auth/core/lib/utils/assert.js:92,133-142).
    session: { strategy: "jwt" },
    trustHost: true,
    pages: { signIn: "/login", error: "/login", verifyRequest: "/login/check-email" },
    callbacks: {
      jwt({ token, user }) {
        // `user` is present only on sign-in, and on this path it is the
        // *adapter* user, so user.id is users.id — the same value Auth.js has
        // already put on token.sub (callback/index.js:173-178). token.userId is
        // kept alongside it so no consumer and no e2e fixture changes (A9).
        if (!user?.id) return token;
        return enrichToken(token, user.id);
      },
      session({ session, token }) {
        return sessionFromToken(session, token);
      },
    },
  };
});
```

What left: the `Discord` import, `discordIdentityFromProfile`, and the `getAppDb()` + `upsertFromDiscord` round trip inside the `jwt` callback — the adapter has already created or found the user by the time `jwt` runs.

One cost to name: `getAppDb()` now runs in the config body, so it executes on every `auth()` call rather than only on sign-in. It is not I/O — `getCloudflareContext({ async: true })` returns the already-resolved request context and `drizzle(env.DB, { schema })` is a wrapper object, no connection is opened — so the cost is three small allocations per `auth()`. Building the adapter lazily per method would avoid them and cost a closure per call instead; not worth the indirection.

---

## 5. Pure helpers

### `src/domain/email-identity.ts`

```ts
/** Normalised to agree with Auth.js's defaultNormalizer, or null. See design.md D17. */
export function normalizeEmail(raw: unknown): string | null;

/** A5/D23: the local part, trimmed, ≤20 characters; "Player" when nothing is left. */
export const DISPLAY_NAME_MAX_LENGTH = 20;
export const DISPLAY_NAME_FALLBACK = "Player";
export function displayNameFromEmail(email: string): string;
```

### `src/domain/magic-link-email.ts`

```ts
export type MagicLinkEmail = { subject: string; text: string; html: string };

export function magicLinkEmail(input: {
  url: string;
  expiresInMinutes: number;
  siteName: string;
}): MagicLinkEmail;
```

`siteName` is a parameter, not an import, so this module stays free of `src/lib` and the test needs no fixture wiring. The composition root passes `SITE_NAME` from `src/lib/legal.ts`.

Content:

- **subject**: `Your sign-in link for ${siteName}`
- **text**:

  ```
  Sign in to {siteName}

  Open this link to sign in:
  {url}

  The link expires in {expiresInMinutes} minutes and works once.

  If you didn't ask for this, ignore this email — nothing happened.
  ```

- **html**: a minimal inline-styled fragment whose only link is `<a href="{escaped url}">Sign in</a>`, plus the same expiry sentence and the same "ignore this" sentence. Both parts are sent (multipart improves deliverability and some clients strip HTML — R3).

One non-obvious requirement: the URL carries `&`-separated query parameters, so the `href` must be HTML-escaped (`&` → `&amp;`, plus `<`, `>`, `"`). An unescaped ampersand in an attribute is tolerated by most clients and mangled by strict ones — a silently dead link. `magicLinkEmail` escapes it, the HTML part therefore contains the **escaped** form exactly once, and a test asserts that unescaping the `href` yields the original URL byte-for-byte.

### `src/app/login/auth-error.ts` — reworked

`messageForAuthError(code)` gains `Verification` and `EmailSignInError`, rewrites `AccessDenied` and `Configuration`, and rewrites the generic default to drop "Discord". Exact copy is the table in D20. It returns `null` for `undefined` as today, and knows nothing about `?invalid=email` (D18).

### `src/app/login/return-path.ts` — one addition

```ts
/**
 * `/login` with the invalid-email marker, carrying `from` only when it is
 * exactly what `safeReturnPath` would accept — so a hostile `from` is dropped
 * on the error round trip too, not only on the success one.
 */
export function invalidEmailLoginPath(from: unknown): string;
```

`safeReturnPath` and `withReturnPath` are unchanged; `return-path.test.ts` keeps every existing case (R7).

---

## 6. Login UX

### `/login` — `src/app/login/page.tsx` (thin root, untested, unchanged shape)

Still: `auth()` → `redirect("/account")` for a signed-in visitor (outside any `try`, per the Next docs row); `await props.searchParams`; `firstValue`; `from = safeReturnPath(candidate, "") || undefined`; `error = messageForAuthError(firstValue(rawError))`. Added: `emailError = firstValue(rawInvalid) === "email" ? INVALID_EMAIL_MESSAGE : undefined`, and `action={signInWithEmailAction}`.

`INVALID_EMAIL_MESSAGE` = **"Enter an email address like you@example.com."**

### `src/app/login/login-panel.tsx` — the testable body

Unchanged shell: wordmark, the `Badge tone="info"` eyebrow, the three-line headline, the subtitle, the legal line, the `role="alert"` error region, the hidden `from` field, one `<form action={action}>`. Changed:

```tsx
export type LoginPanelProps = {
  from?: string;
  error?: AuthErrorMessage | null;
  /** Field-level message for the email input; drives Input's error state (D18). */
  emailError?: string;
  action: (formData: FormData) => void | Promise<void>;
};
```

```tsx
<form action={action} className="flex flex-col gap-3.5">
  {from ? <input type="hidden" name="from" value={from} /> : null}
  <Input
    id="email"
    name="email"
    label="Email"
    type="email"
    inputMode="email"
    autoComplete="email"
    placeholder="you@example.com"
    required
    error={emailError}
  />
  <Button type="submit" variant="primary" size="lg" fullWidth>
    {error ? "Try again" : "Email me a sign-in link"}
  </Button>
  <p className="text-center text-body-sm text-text-muted">
    No password. We email you a link that signs you in.
  </p>
  <p className="text-center text-caption text-text-faint">
    By continuing, you agree to our <Link href="/terms">Terms of Service</Link> and{" "}
    <Link href="/privacy">Privacy Policy</Link>.
  </p>
</form>
```

Design-system compliance, point by point against the spec's "Design-System Compliance for Login Screens": the field is the shared `Input` primitive, so the error state is the shared one (`border-red-500` + `circle-alert` + `aria-invalid` + `aria-describedby`, `input.tsx:50-80`); the focus ring comes from the vendored `base.css` `:focus-visible` rule that `Input` does not override; the panel's existing `md:` restatement and `max-w-2xl` container are the one desktop restatement; no hardcoded colour or spacing is introduced. The `Input` stays uncontrolled with `name`/`required` and no `value`/`onChange`, per the primitive's D9 contract, and `type="email"` passes straight through to the native input.

### `src/app/login/actions.ts` — rewritten

Exactly the function in D18. `signInWithDiscordAction` is deleted. The file keeps its existing comment about `@/auth` being unimportable under Vitest, which is why it stays thin and why `normalizeEmail`, `safeReturnPath` and `invalidEmailLoginPath` — the three things with behaviour — are tested elsewhere.

### `/login/check-email` — `src/app/login/check-email/page.tsx` (new, one file)

A synchronous server component, `metadata: { title: "Check your inbox" }`, no `auth()`, no `searchParams` read (D19). Reuses the panel's type scale directly rather than adding a prop to `LoginPanel`, so `/login`'s state machine stays two-way.

Copy:

- headline **"Check your inbox."**
- body **"If that email can sign in here, a link is on its way. It expires in 15 minutes and works once."**
- a ghost **"Back to sign in"** link to `/login`

The body is true for a new address, an existing address and a throttled address alike — and because Auth.js does not put the submitted address in the verify-request redirect (`send-token.js:67-72`), generic copy is not a choice the page could avoid. What the page **can** show is therefore: the headline, the expiry and single-use facts, and the way back. What it cannot show: the address, or anything that differs by registration state.

The 15 in the copy and `MAGIC_LINK_TTL_MINUTES` in `src/auth.ts` are two literals for one fact. They are deliberately not shared: importing `@/auth` into a page is what makes a file untestable under Vitest, and a constant module for one number that appears in one sentence is more indirection than it buys. The static-render test asserts the sentence contains "15 minutes", so a change to one without the other is a visible failure rather than a silent lie.

---

## 7. Removal map

Every live occurrence of "discord", case-insensitive, with what replaces it. Counts are from `rg -ic discord` this pass.

| File | n | Lines | Replacement |
|---|---|---|---|
| `src/auth.ts` | 7 | 2, 5, 10, 20, 39, 45, 47 | §4 above, in full |
| `src/auth/callbacks.ts` | 9 | 5, 16-23 (doc), 24-28 (`discordProfileSchema`), 31-39 (`discordIdentityFromProfile`) | Both deleted with their doc comment and the `zod` import; `enrichToken`/`sessionFromToken` unchanged |
| `src/auth/callbacks.test.ts` | 13 | the whole `discordIdentityFromProfile` describe block (5-45) | Deleted. The `enrichToken` case's `sub: "discord-123"` becomes `sub: "user-1"`, which is now also what production puts there (A9) |
| `src/domain/ports/user-repository.ts` | 8 | 1-6 (`DiscordIdentity`), 8, 17-35 (doc + `upsertFromDiscord`) | §2 above |
| `src/adapters/db/user-repository.ts` | 7 | 5, 12, 21-52 | Rewritten around email |
| `src/adapters/db/user-repository.test.ts` | 20 | whole file | Rewritten: `createFromEmail`/`findByEmail`/`findById`/`markEmailVerified` |
| `src/adapters/db/riot-account-repository.test.ts` | 9 | 12, 13, 111, 112, 162, 253, 270, 289, 309 | `discordId: "d1"` → `email: "user-1@example.com"` (and `d2` → `user-2@example.com`) |
| `src/adapters/db/challenge-repository.test.ts` | 1 | 29 | same |
| `src/adapters/db/polling-repository.test.ts` | 1 | 27 | same |
| `src/db/schema.ts` | 2 | 14 (doc), 17 (`discordId`) | §1 above |
| `src/app/login/login-panel.tsx` | 5 | 11, 26, 30, 74, 77 | §6 above |
| `src/app/login/login-panel.test.tsx` | 5 | 25, 35, 71, 82, 86 | New assertions: the `type="email"`/`name="email"`/`required` field, the CTA label, the note line, the field-error branch |
| `src/app/login/page.tsx` | 2 | 4, 46 | `signInWithEmailAction`, `emailError` |
| `src/app/login/actions.ts` | 2 | 20, 23 | §6 above |
| `src/app/login/auth-error.ts` | 3 | 8, 27, 28 | D20's table |
| `src/app/login/auth-error.test.ts` | 5 | 12, 13, 27, 34, 41 | One case per D20 row plus the unknown-code default |
| `src/app/login/return-path.test.ts` | 1 | a comment | Reworded; every assertion carries over |
| `src/app/hero.tsx` | 1 | 43 | "No new account. We use your Discord sign-in." → **"No password. We email you a link that signs you in."** (same sentence as the login note, so the landing page and `/login` cannot drift) |
| `src/app/hero.test.tsx` | 1 | 27 | asserts the new sentence |
| `src/app/terms/page.tsx` | 1 | 27 | "You sign in with Discord." → "You sign in with your email address. We email you a single-use link; there is no password to lose." |
| `src/app/privacy/page.tsx` | 4 | 23-25, 67-69, 94 | "What is collected": the Discord bullet becomes **"Your email address**, which is how your account is identified. You give it to us when you sign in; we never receive a password." · "Who it is shared with": the Discord bullet becomes **"Resend**" — "our email provider. It receives your email address in order to deliver your sign-in link, and nothing else." · "Children": drop "Discord's", keep Riot's minimum age |
| `src/components/auth-status.tsx` | 3 | 9, 11-12, 42 | Comments only (D21); the `eslint-disable` justification becomes a general external-URL note |
| `e2e/fixtures/session.ts` | 2 | 20, 26 | `SessionUser` drops `discordId`; `token: { sub: user.id, name: user.name, userId: user.id }` |
| `e2e/fixtures/seed.sql` | 3 | 24-26 | `INSERT … (id, email, email_verified_at, display_name, avatar_url, created_at)` with `e2e-a@example.com` / `e2e-b@example.com` and `unixepoch() * 1000` for `email_verified_at` |
| `e2e/create-then-join.spec.ts` | 2 | 25, 26 | `USER_A`/`USER_B` drop `discordId` |
| `.dev.vars.example` | 4 | 7, 8, 10, 11 | `AUTH_DISCORD_ID`/`AUTH_DISCORD_SECRET` out; `AUTH_RESEND_KEY` and `EMAIL_FROM` in, each with a comment naming where to get it |
| `openspec/config.yaml` | 1 | 7 | "Auth.js (Discord, JWT sessions)" → "Auth.js (email magic link via Resend, JWT sessions)" |
| `.gitignore` | 1 | 40 | "never commit Discord OAuth credentials" → "never commit auth or API secrets" |

**Deliberately not edited**, so the success criterion's scope (`src/`, `e2e/`, `openspec/config.yaml`, `.dev.vars.example`) is the right scope:

- `drizzle/0000_initial_schema.sql` and `drizzle/meta/000{0,1}_snapshot.json` — migrations are append-only history. `0003` is how `discord_id` leaves; rewriting `0000` would desynchronise every snapshot and every applied-migration record.
- `odd/tasks/*.md`, `openspec/changes/archive/**` — records of what was decided then, not statements about now.
- `design/_ds/**` — the design export, owned by the design tool.

---

## Data Flow

**1 — Request a link**

```
/login ──native form POST──► signInWithEmailAction            src/app/login/actions.ts
                               │ normalizeEmail(formData.email)
                               │    null ─► redirect /login?invalid=email&from=…   (nothing sent)
                               │ safeReturnPath(formData.from)
                               ▼
                             signIn("resend", { email, redirectTo })   next-auth/lib/actions.js
                               │ POST /api/auth/signin/resend  (raw, skipCSRFCheck)
                               ▼
                             sendToken                     @auth/core .../signin/send-token.js
                               ├─ defaultNormalizer(email)
                               ├─ adapter.getUserByEmail ─► users.findByEmail ─► SELECT users
                               ├─ token = randomString(32)
                               ├─ url = /api/auth/callback/resend?callbackUrl&token&email
                               ├─ Promise.all:
                               │   ├─ sendVerificationRequest({ identifier, url })      src/auth.ts
                               │   │    └─ requestMagicLink              src/application/…
                               │   │         ├─ throttle.find    ─► SELECT auth_email_throttle
                               │   │         ├─ allowSend(state, now, policy)       (pure)
                               │   │         ├─ throttle.save    ─► INSERT…ON CONFLICT
                               │   │         └─ allowed? sender.send(magicLinkEmail(…))
                               │   │                        └─► POST https://api.resend.com/emails
                               │   └─ adapter.createVerificationToken ─► tokens.create
                               │        ├─ INSERT verification_tokens (identifier, sha256(token+secret), expires)
                               │        └─ DELETE verification_tokens WHERE identifier=? AND expires<now
                               ▼
                             302 /api/auth/verify-request?provider=resend&type=email
                               ▼  browser GET, served by src/app/api/auth/[...nextauth]/route.ts
                             302 /login/check-email?provider=resend&type=email   (pages.verifyRequest)
```

**2 — Click the link**

```
GET /api/auth/callback/resend?token&email&callbackUrl
  ├─ no `token`            ─► TypeError name="Configuration"  ─► 302 /login?error=Configuration
  ├─ adapter.useVerificationToken ─► tokens.consume
  │     └─ DELETE verification_tokens WHERE identifier=? AND token=? RETURNING *
  │          null | expires<now | identifier mismatch ─► Verification ─► 302 /login?error=Verification
  ├─ adapter.getUserByEmail ─► users.findByEmail
  ├─ handleLoginOrRegister
  │     ├─ session cookie present ─► adapter.getUser     ─► users.findById
  │     ├─ user found             ─► adapter.updateUser  ─► users.markEmailVerified ─► UPDATE users
  │     └─ user absent            ─► adapter.createUser  ─► users.createFromEmail   ─► INSERT users
  ├─ defaultToken = { name, email, picture, sub: user.id }
  ├─ callbacks.jwt ─► enrichToken(token, user.id)     →  token.userId === token.sub
  ├─ Set-Cookie authjs.session-token
  └─ 302 callbackUrl   (the validated `from`, else /account)
```

**3 — Every later request**

```
auth() ─► callbacks.session ─► sessionFromToken ─► session.user.id     (8 consumers, unchanged)
```

---

## File Changes

| File | Action | Slice | Description |
|---|---|---|---|
| `src/domain/email-identity.ts` (+test) | Create | S0 | `normalizeEmail`, `displayNameFromEmail` (D17, D23) |
| `src/domain/magic-link-email.ts` (+test) | Create | S0 | `magicLinkEmail` — subject, text, escaped-href html |
| `src/app/login/auth-error.ts` (+test) | Modify | S0 | D20's five cases plus the default; no Discord copy |
| `src/app/login/return-path.ts` (+test) | Modify | S0 | `invalidEmailLoginPath`; existing exports untouched |
| `drizzle/0002_auth_email_tables.sql` | Create | S1 | `verification_tokens`, `auth_email_throttle` (generated, unedited) |
| `src/db/schema.ts` | Modify | S1, S3b-i | S1 adds the two tables; S3b-i replaces `users` |
| `src/domain/ports/verification-token-repository.ts` | Create | S1 | `create`, `consume` |
| `src/domain/ports/email-throttle-repository.ts` | Create | S1 | `find`, `save` |
| `src/adapters/db/verification-token-repository.ts` (+test) | Create | S1 | `DELETE … RETURNING` (D6), insert-then-reap (D7) |
| `src/adapters/db/email-throttle-repository.ts` (+test) | Create | S1 | One-row read / insert-or-replace |
| `src/domain/send-throttle.ts` (+test) | Create | S2 | `allowSend`, `DEFAULT_SEND_POLICY` |
| `src/domain/ports/email-sender.ts` | Create | S2 | `EmailSender`, `OutgoingEmail` |
| `src/adapters/email/resend-email-sender.ts` (+test) | Create | S2 | HTTP POST to `api.resend.com`, injected `fetch`, named unconfigured error (D14) |
| `src/application/request-magic-link.ts` (+test) | Create | S2 | The throttle/send use case (D12) |
| `drizzle/0003_users_email_identity.sql` | Create | S3b-i | `users` recreate, one hand-edited statement (D3, D4) |
| `src/domain/ports/user-repository.ts` | Modify | S3b-i | Email methods in; `DiscordIdentity`/`upsertFromDiscord` out |
| `src/adapters/db/user-repository.ts` (+test) | Modify | S3b-i | Rewritten around email; test rewritten |
| `src/auth/callbacks.ts` (+test) | Modify | S3b-i | `discordIdentityFromProfile`/`discordProfileSchema` deleted |
| `src/adapters/db/{riot-account,challenge,polling}-repository.test.ts` | Modify | S3b-i | 11 seed sites: `discordId` → `email` |
| `src/adapters/auth/auth-adapter.ts` (+test) | Create | S3a | `createAuthAdapter`, `REQUIRED_ADAPTER_METHODS` (D1, D9, D10) |
| `src/app/login/login-panel.tsx` (+test) | Modify | S4 | Email field, `emailError`, new CTA and note copy |
| `src/app/login/page.tsx` | Modify | S4 | `?invalid=email`, new action |
| `src/app/login/actions.ts` | Modify | S4 | `signInWithEmailAction` replaces `signInWithDiscordAction` |
| `src/app/login/check-email/page.tsx` (+test) | Create | S4 | `pages.verifyRequest` target (D19) |
| `src/auth.ts` | Modify | S3b-i, S3b-ii | S3b-i simplifies the `jwt` callback; S3b-ii swaps the provider and adds the adapter |
| `.dev.vars.example` | Modify | S3b-ii | `AUTH_DISCORD_*` out; `AUTH_RESEND_KEY`, `EMAIL_FROM` in |
| `src/app/hero.tsx` (+test) | Modify | S6 | Sign-in note copy |
| `src/app/terms/page.tsx` | Modify | S6 | "Your account" section |
| `src/app/privacy/page.tsx` | Modify | S6 | Collected data + processors + children (A11) |
| `src/components/auth-status.tsx` | Modify | S6 | Comments and the eslint justification only (D21) |
| `openspec/config.yaml`, `.gitignore` | Modify | S6 | Context block; secrets comment |
| `e2e/fixtures/session.ts`, `e2e/fixtures/seed.sql`, `e2e/create-then-join.spec.ts` | Modify | S7 | `sub: user.id`; `SessionUser` drops `discordId`; seed uses emails |
| `openspec/changes/email-magic-link-auth/manual-verification.md` | Create | S7 | The eight-step plan (A10) |
| `src/adapters/db/test-db.ts` | Unchanged | — | Already replays `drizzle/*.sql` in order with the right breakpoint split (§1) |
| `src/app/api/auth/[...nextauth]/route.ts` | Unchanged | — | `{ GET, POST } = handlers` covers every new redirect |
| `src/types/next-auth.d.ts` | Unchanged | — | `session.user.id` and `JWT.userId` still the only augmentations needed |
| `src/app/account/**`, `src/app/challenges/**`, `src/components/site-header.tsx`, `src/app/page.tsx` | Unchanged | — | All key on `session.user.id` only |
| `package.json` | Unchanged | — | `next-auth/providers/resend` already present; **no new dependency** |
| `wrangler.jsonc`, `next.config.ts`, `worker.ts` | Unchanged | — | `process.env` needs no binding, so no `pnpm cf-typegen` change (D15) |

---

## Testing Strategy

Strict TDD throughout (`openspec/config.yaml` `rules.apply.tdd`): observed RED before implementation, then GREEN, then refactor. Vitest 5, `environment: "node"`, no DOM, no mocking library, no casts in tests.

| Layer | What to test | Approach |
|---|---|---|
| Domain — identity | `normalizeEmail`: case folding, NFKC (fullwidth `＠` rejected after normalisation turns it into a real `@` with a second `@`), leading/trailing whitespace and NBSP, quote rejection, zero/two/three `@` parts, empty local, empty domain, `domain,second` comma trimming, non-string and empty input. `displayNameFromEmail`: ordinary local part, exactly-20, 21-truncated, whitespace-only → `"Player"`, no plus-tag stripping | Pure Vitest, table-driven; the doc comment cites `send-token.js:74-104` as the pinned contract (D17) |
| Domain — email copy | `magicLinkEmail`: subject contains `siteName`; `text` contains the URL exactly once; `html` contains the **escaped** URL exactly once; unescaping the `href` yields the original URL; both parts state the expiry in minutes; neither contains the word "Discord" | Pure Vitest; `split(url).length === 2` for "exactly once" |
| Domain — throttle | `allowSend`: first-ever send; inside cooldown; exactly at the cooldown boundary; outside cooldown; cap reached; window rollover resets the count but keeps `lastSentAt`; rollover plus cooldown still refuses; backwards clock refuses; every path returns a `nextState` | Pure Vitest |
| App copy | `messageForAuthError`: one case per D20 row, plus `undefined` → `null`, plus an unknown code → the default; no returned string contains "Discord" | Pure Vitest |
| Routing helper | `invalidEmailLoginPath`: safe `from` carried; unsafe `from` (`//evil.com`, `\`, absolute URL, non-string) dropped; absent `from` emits no `from` parameter | Pure Vitest |
| Adapter contract | Every name in `REQUIRED_ADAPTER_METHODS` is present on `createAuthAdapter(...)` **and** `typeof === "function"`; removing one fails and names it; the tuple `satisfies readonly (keyof Adapter)[]` so a renamed Auth.js method fails `pnpm typecheck` | Vitest with hand-written in-memory fake ports — no DB, no HTTP (D10) |
| Adapter mapping | `getUserByEmail` normalises its argument; `createUser` ignores the incoming `id`, derives the display name, and persists `emailVerified` (D8); `updateUser` maps `emailVerified` and throws on an unsupported key and on a missing `emailVerified`; `getUser`/`getUserByEmail` map `null` to `null`; `toAdapterUser` maps `emailVerifiedAt`→`emailVerified`, `displayName`→`name`, `avatarUrl`→`image` | Same fakes |
| DB adapter — tokens | `create` then `consume` round trip; `consume` twice returns `null` the second time (single use); `consume` with a wrong token or wrong identifier returns `null`; an **expired** row is still returned by `consume` (Auth.js owns the comparison) and is reaped by the next `create` for that identifier; a live token for the same identifier survives that reap (A6) | `createTestDb()` — in-memory SQLite replaying `drizzle/*.sql`, which also proves both migrations replay cleanly including the recreate |
| DB adapter — users | `createFromEmail` then `findByEmail`/`findById`; the unique-email constraint rejects a duplicate; `markEmailVerified` sets the timestamp and preserves `id`, `createdAt`, `email` and `displayName`; `markEmailVerified` on an unknown id throws; a `riot_accounts` row survives `markEmailVerified` on its owner | `createTestDb()` |
| DB adapter — throttle | `find` on an unknown identifier → `null`; `save` then `find` round trip; `save` twice replaces rather than duplicating (single row per identifier) | `createTestDb()` |
| Adapter — Resend | A 2xx response resolves; a non-2xx rejects with a message containing the status; the rejection message contains neither the URL, the recipient, nor the html/text body; an empty `apiKey` rejects with the named unconfigured error **without performing a request**; the request body carries `from`, `to`, `subject`, `text` and `html` | Vitest with an injected `HttpFetch`, mirroring `src/adapters/riot/riot-api.ts:19-50`'s narrow structural response type — no mocking library |
| Application | `requestMagicLink`: allowed → saves state and sends once; throttled → saves state and does **not** send; the state is saved before the send (a rejecting sender still leaves the state written); a sender rejection propagates | Vitest with hand-written fake ports |
| Routes / actions | — | No unit specs: `@/auth` cannot be imported under Vitest, so `page.tsx`/`actions.ts` stay thin roots and the behaviour lives in the tested helpers they compose — the same split `create-form.tsx`/`actions.ts` already uses |
| Static render | `/login` main state (field present with `type="email"`, `name="email"`, `required`; hidden `from` present/absent; CTA label; note copy; no "Discord"), error state (one case per D20 title, `role="alert"` ordering, CTA relabelled), field-error state (`aria-invalid="true"`, the message, and that the panel is still in its main state), `/login/check-email` (headline, "15 minutes", "works once", the `/login` link, no address echoed) | `renderToStaticMarkup`, no jsdom — the established `login-panel.test.tsx` pattern |
| E2E | Mechanism unchanged: the fixture mints the cookie directly, which `challenge-participation` requires and which never calls `signIn()`. Only the token payload (`sub: user.id`), the `SessionUser` type and `seed.sql` change. **No e2e coverage of the real round trip** (A10) | Playwright, two viewports, against `next dev` |
| Manual (owner, real Resend key) | The eight steps below — the part no automated test can cover | Browser + inbox + `wrangler d1 execute --local` |

### Manual verification plan (recorded in S7 as `manual-verification.md`)

1. **First sign-in.** New address → `/login` → submit → `/login/check-email` renders → email arrives → subject and both parts correct → click → signed in, landed on `/account`. Then `SELECT id, email, email_verified_at, display_name FROM users WHERE email = ?`: one row, derived display name, **`email_verified_at` set** (this is the step that would catch a regression of D8).
2. **Repeat sign-in.** Same address again → the *same* `users.id` and `created_at`, `email_verified_at` refreshed, `display_name` unchanged. Do this while still signed in from step 1, so `adapter.getUser` is exercised — it is the one of the six methods the first-sign-in path never touches.
3. **Replay.** Click the same link twice → the second click shows the `Verification` copy. This is the step that proves `DELETE … RETURNING` works on real D1 (D6).
4. **Expiry.** Wait out the 15 minutes → the link shows the `Verification` copy.
5. **Throttle.** Submit twice inside 60 s → `/login/check-email` both times, exactly one email, and `SELECT * FROM auth_email_throttle WHERE identifier = ?` shows one row with `sent_in_window = 1`.
6. **Enumeration.** An address with no account → byte-identical response to step 1's first submit (R-ENUM).
7. **Return path.** `?from=/challenges/new` survives the full round trip; `?from=//evil.com` is dropped and lands on `/account`; a stripped `token` shows the merged `Configuration` copy.
8. **Riot linking.** Link an existing Riot ID after signing in; the `/account` flow is untouched and the linked row survives a second sign-in (step 2).

---

## Threat Matrix

This change adds routes, redirects, a Server Function and an outbound HTTP integration. The five standard rows concern shell, VCS and PR automation, which it does not touch. Eight rows are genuinely applicable; every applicable row's design response and RED tests carry into `tasks.md` unchanged.

| # | Boundary | Minimum adversarial cases | Applicability | Design response | Planned RED tests |
|---|---|---|---|---|---|
| — | Documentation-like paths | `requirements.txt`, executable Markdown, `README.sh` | **N/A** — no file is classified as executable and no user-supplied path is read | — | — |
| — | Git repository selection | `git -C`, relative/absolute paths | **N/A** — no git invocation in shipped or test code | — | — |
| — | Commit state | staged, `commit -a`, empty index | **N/A** — no VCS automation | — | — |
| — | Push state | tracking branch, first push, refspec | **N/A** — no push automation | — | — |
| — | PR commands | `--head`, env prefix, composed commands | **N/A** — no PR automation | — | — |
| — | Test-time subprocess | interpolated SQL, silent-no-op seed, missing wrangler | **N/A for new work** — `e2e/global-setup.ts` keeps its fixed `execFileSync` argv array and `--file` seed; only the SQL file's *contents* change, and nothing is interpolated into argv | — | — |
| T1 | **Server Function direct invocation** | POST `signInWithEmailAction` without the form: no `email`, `email` as an array of two values, 10 kB `email`, `email` with a quote or a homoglyph `@`, `from=//evil.com`, `from` as an absolute URL, `from` with a backslash. Same again straight to `POST /api/auth/signin/resend`, bypassing the action entirely | **Applicable** — Next docs: "Server Functions are reachable via direct POST requests"; the `required` and `type="email"` attributes are affordances, not enforcement | `normalizeEmail` is the only validator and runs server-side on `formData.get("email")`, rejecting non-strings (so an array yields `null`, not a crash), quotes and malformed shapes; `safeReturnPath` re-validates `from` server-side rather than trusting the hidden field; a direct POST to the Auth.js endpoint still passes through `defaultNormalizer` **and** the throttle, because the throttle sits in `sendVerificationRequest` — the one function Auth.js calls on every entry path (§4) | `normalizeEmail` rejects non-string, quoted, 0/2/3-`@`, empty-local, empty-domain; `invalidEmailLoginPath` and `safeReturnPath` drop `//`, `\`, absolute and non-string `from`; `requestMagicLink` refuses inside cooldown |
| T2 | **Open redirect** via `from` → `redirectTo` → `callbackUrl` | `//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:…`, a `from` that is valid on the success path but not on the error path | **Applicable** — the value round-trips through Auth.js and comes back as a redirect target | `safeReturnPath` validates in the Server Function on the success path and `invalidEmailLoginPath` re-validates on the error path (D18); the existing `return-path.test.ts` cases carry over unchanged. Auth.js's own default `redirect` callback additionally rejects a cross-origin `callbackUrl` — recorded as defence in depth, **not** relied on | Every existing `safeReturnPath` case, plus the same set through `invalidEmailLoginPath` |
| T3 | **Unauthenticated send-endpoint abuse** | 100 POSTs for one address in a second; 10 000 POSTs across 10 000 distinct addresses; the Auth.js endpoint hit directly to bypass the action | **Applicable** — the endpoint must be reachable by a stranger; that is what a magic link is | Per-address throttle at the choke point: 1/60 s and 5/rolling hour (A4). The per-address case is bounded. The **distinct-address** case is not: the hard ceiling is Resend's free-tier 100/day, which fails closed (nobody can sign in) rather than expensively. Closing it properly needs a Cloudflare rate-limiting rule, which needs a zone, which needs a custom domain the deployment does not have — F-WAF. Accepted residual at friends scale (R6) | `allowSend` cooldown and cap cases; `requestMagicLink` does not send when refused |
| T4 | **Bearer-credential leakage** | the link in a `console.log`, in a thrown error message, in Cloudflare observability, in a Resend error body echoed into an exception, in the HTML as both `href` and visible text | **Applicable** — the magic link *is* the account, and `wrangler.jsonc:33-35` sends every `console` call to Cloudflare's log stream | No dev-only URL logging in shipped code, and no env-guarded branch that could print it (D14); `EmailSenderNotConfiguredError` and the send-failure error are built from the HTTP status plus Resend's own `name`/`message` only, never from the request payload; `verification_tokens.token` stores Auth.js's SHA-256 hash, so the database never holds the raw credential either; the HTML renders the URL once, in an escaped `href`, never as visible text | Resend adapter: a rejection message contains neither the URL, the recipient, nor the body; `magicLinkEmail`: the URL appears exactly once per part |
| T5 | **Account enumeration** | the same address submitted twice, one registered and one not: compare status, `Location`, rendered bytes, `Set-Cookie`, and wall-clock time | **Applicable** — a differing response makes the endpoint an account-existence oracle | Identical work for both: one `findByEmail` that hits or misses, then an identical send and an identical `302 /login/check-email`. A throttled request returns from `sendVerificationRequest` **without throwing**, so Auth.js's behaviour is byte-identical (D13). `/login/check-email` cannot echo the address because Auth.js does not put it in the redirect, and its copy is conditional-free. **Named residual**: a throttled request skips an outbound HTTPS call and so returns measurably faster — that discloses the requester's own throttle state, not whether an address is registered, and the registered/unregistered pair remains timing-identical | `requestMagicLink` returns `{ kind: "throttled" }` and does not throw; `/login/check-email` static render contains no address and no conditional branch; manual step 6 |
| T6 | **Token replay and forgery** | the same link twice; two concurrent clicks on one link; a `token` for address A replayed with `email=B`; a hand-crafted `token`; an expired token | **Applicable** — single use is the security property of a magic link | `consume` is a single `DELETE … RETURNING` statement, so two concurrent clicks cannot both see the row (D6); Auth.js compares `invite.identifier !== paramIdentifier` and rejects a mismatch (`callback/index.js:152`); a forged token fails because the stored value is `SHA-256(token + AUTH_SECRET)` and the attacker does not have the secret; expiry is Auth.js's comparison against the stored `expires` | `consume` twice → `null`; wrong token → `null`; wrong identifier → `null`; expired row still returned (so Auth.js can say "expired") |
| T7 | **Misconfiguration surfaced to the visitor** | an adapter missing one of the six methods; `AUTH_RESEND_KEY` unset; `EMAIL_FROM` unset or unverified; a mangled link; a Resend outage | **Applicable** — the exploration recorded a bare-500 path that bypasses `pages.error` | Traced end to end in D11: every one of these lands on `/login?error=<code>` with styled copy, including the missing-statically-checked-method case, because `next-auth`'s `signIn()` falls back to redirecting to the signin **GET** URL where `pages.error` does apply. The `REQUIRED_ADAPTER_METHODS` contract test is therefore aimed at the real risk — shipping a sign-in that *always* shows the merged `Configuration` message — and the merged copy is worded to be true for all four situations that reach it (D20). A missing `EMAIL_FROM` deliberately does **not** throw at config time, so it cannot take down every page (D15) | Contract test fails when a method is removed; Resend adapter rejects with the named error on an empty key; `messageForAuthError("Configuration")` returns the merged copy |
| T8 | **Deliverability as a single point of failure** | an unverified sender domain; a spam-filtered message; a Resend outage; an HTML-stripping client | **Applicable, operational** — sign-in now depends entirely on an email arriving, with no fallback method by the owner's design decision | Owner prerequisite P2 (a verified sender) is non-negotiable and Resend rejects Auth.js's `no-reply@authjs.dev` default outright; both a plain-text and an HTML part are sent; the subject and copy are the product's, not Auth.js's defaults; the 15-minute TTL keeps a late link from being a silent failure. **Residual, accepted**: no second sign-in method exists (R3). The `EmailSender` port is the escape hatch — a different HTTP provider is one adapter file | `magicLinkEmail` produces both parts with the URL in each; Resend adapter sends `from`, `text` and `html`; manual step 1 on a real key |

---

## Slice Map

Strategy `auto-chain`, budget **400 changed lines** (`additions + deletions`, authored). Chained PRs onto `feat/email-magic-link-auth`, based on the existing chain tip. Strict-TDD slices in this repository have measured **2–3.5×** their forecast (Engram #101, three owner-accepted `size:exception`s), so the risk column is the budget risk *after* that factor, not the raw estimate.

The proposal's §8 identities are kept. Two changes to it, both argued below: **S3b is split** into S3b-i and S3b-ii, and **S3a moves after S3b-i** while **S5 is absorbed into S3b-ii**.

```
S0 ─────────────────────────────┬──► S4 ───────────┐
                                │                  │
S1 ──► S2 ──────────────────────┤                  ├──► S3b-ii ──► S6
  └──► S3b-i ──► S3a ───────────┘                  │
            └──► S7 ────────────────────────────────
```

The `Depends on` column is authoritative.

| # | Slice | Depends on | Creates / modifies | Est. | Risk | Verification |
|---|---|---|---|---|---|---|
| **S0** | Pure identity and copy helpers | — | + `src/domain/email-identity.ts`, + `src/domain/magic-link-email.ts`, ~ `src/app/login/auth-error.ts`, ~ `src/app/login/return-path.ts` (+4 test files) | 300–420 | **Medium-High** (contingent split S0a/S0b) | `pnpm test` RED→GREEN · typecheck / lint / build. Nothing is wired, so no rendered page changes |
| **S1** | Auth tables, token and throttle ports and adapters | — | + `drizzle/0002_auth_email_tables.sql`, ~ `src/db/schema.ts`, + 2 ports, + 2 D1 adapters (+2 tests) | 280–400 | **Medium-High** | `pnpm test` RED→GREEN (proves `0002` replays in `createTestDb()`) · typecheck / lint / build. Purely additive; nothing references either table |
| **S2** | Delivery, throttle policy and the use case | S0, S1 | + `src/domain/send-throttle.ts`, + `src/domain/ports/email-sender.ts`, + `src/adapters/email/resend-email-sender.ts`, + `src/application/request-magic-link.ts` (+4 tests) | 260–380 | Medium | `pnpm test` RED→GREEN · typecheck / lint / build. Still unwired, no network call in any test |
| **S3b-i** | Identity schema swap — **the atomic slice** | S1 | + `drizzle/0003_users_email_identity.sql`, ~ `src/db/schema.ts`, ~ `src/domain/ports/user-repository.ts`, ~ `src/adapters/db/user-repository.ts` (+rewritten test), ~ 11 seed sites in 3 adapter tests, ~ `src/auth/callbacks.ts` (+test), ~ `src/auth.ts` (`jwt` callback only) | 320–420 | **High** | `pnpm test` RED→GREEN · typecheck / lint / build · `pnpm db:migrate:local` then the full adapter suite (the FK-integrity regression test for R8) |
| **S3a** | Auth.js adapter | S1, S3b-i | + `src/adapters/auth/auth-adapter.ts` (+contract and mapping test) | 220–320 | Medium | `pnpm test` RED→GREEN · typecheck (the `satisfies` clause is part of the test) · lint / build. Unreferenced, exactly like S1's tables |
| **S4** | Login UX | S0 | ~ `src/app/login/{page.tsx,actions.ts,login-panel.tsx}` (+test), + `src/app/login/check-email/page.tsx` (+test) | 260–360 | Medium | `pnpm test` · typecheck / lint / build · manual: `/login` and `/login/check-email` at 390 px and ~1200 px, keyboard focus ring on the field, `?invalid=email` renders the field error |
| **S3b-ii** | `src/auth.ts` swap — the slice that makes it work | S2, S3a, S4 | ~ `src/auth.ts` (Resend provider, adapter, `verifyRequest`, `sendVerificationRequest`, env reads), ~ `.dev.vars.example` | 120–200 | Low-Medium | `pnpm test` · typecheck / lint / build · `pnpm exec opennextjs-cloudflare build` · **manual plan steps 1–8 on a real Resend key** |
| **S6** | Copy and config removal | S3b-ii | ~ `src/app/hero.tsx` (+test), ~ `src/app/terms/page.tsx`, ~ `src/app/privacy/page.tsx`, ~ `src/components/auth-status.tsx`, ~ `openspec/config.yaml`, ~ `.gitignore` | 200–300 | Medium | `pnpm test` · build · `rg -i discord src/ e2e/ openspec/config.yaml .dev.vars.example` returns nothing · `/`, `/terms`, `/privacy` read correctly at both viewports |
| **S7** | E2E fixtures and the manual plan | S3b-i | ~ `e2e/fixtures/{session.ts,seed.sql}`, ~ `e2e/create-then-join.spec.ts`, + `openspec/changes/email-magic-link-auth/manual-verification.md` | 150–250 | Low | `pnpm test:e2e` passes both projects (mobile 390 / desktop 1280) |

### Why S3b splits, and why the halves are honest

The proposal called S3b irreducible because the moment `discord_id` goes, `src/auth.ts` and six test files must already be ready. That is true of the *schema* half. What makes the split possible is a fact the proposal already established: **Discord sign-in does not work today and never has in any deployed environment** — `AUTH_DISCORD_*` are empty in the owner's real `.dev.vars`, nothing is deployed with working auth, and the blocker has stood since 2026-09-16 (Engram #27, #54, #100).

So S3b-i can land the schema, the repository, the test seeds and the deletion of `discordIdentityFromProfile`, and reduce the `jwt` callback to `if (!user?.id) return token; return enrichToken(token, user.id)` while still listing `providers: [Discord]` with no adapter. The tree is green on all four gates. The intermediate state's only degradation is that a Discord sign-in would set `session.user.id` to a Discord snowflake with no matching `users` row — and a Discord sign-in cannot happen, because there are no credentials and nothing is deployed. **The one precondition is that the owner does not attempt a Discord sign-in between the S3b-i and S3b-ii merges**, which is stated here so it is a known constraint rather than a surprise.

This is strictly better than the `size:exception` the proposal expected: two reviewable PRs of ~400 and ~160 lines instead of one of ~560.

### Why S3a moves after S3b-i, and why S4 moves before S3b-ii

`createAuthAdapter` maps onto the *new* `UserRepository` shape, which does not exist until S3b-i. Nothing can be peeled off to change that: the four email methods need the `email` column, and keeping `upsertFromDiscord` alongside them needs `discord_id`. So the adapter cannot precede the schema — the proposal's S3a → S3b order was the one edge it had backwards.

S4 before S3b-ii means `/login` posts an email that briefly goes nowhere: `signIn("resend", …)` with no `resend` provider configured hits `next-auth/lib/actions.js:32-37`, which redirects to `/api/auth/signin?callbackUrl=…`, which redirects back to `/login` with no `?error=`. Confusing for one merge, not broken. The alternative — S3b-ii before S4 — makes a *successful* send land on a `/login/check-email` route that 404s, which is worse, and leaves a Discord button whose action has no provider for the same one-merge window. Either way the chain merges in order; this ordering puts the degraded state on the path nobody can complete rather than on the path that otherwise works.

### Budget reconciliation

| Status | Slices |
|---|---|
| Under budget by median **and** upper bound | S2 (260–380), S4 (260–360), S3b-ii (120–200), S6 (200–300), S7 (150–250), S3a (220–320) |
| Under budget by median, upper bound **at or over** the line → carries a contingent split | S0 (median 360), S1 (median 340) |
| Over budget at the upper bound and **not splittable** | **S3b-i** (320–420, median 370) |

- **S0 (contingent)** — if the measured diff exceeds 400 authored lines, split into **S0a** (`email-identity.ts`, `auth-error.ts`, `return-path.ts` + 3 tests, 180–250) and **S0b** (`magic-link-email.ts` + test, 120–170). They share nothing; S0b has no dependency on S0a. Evaluated **before the first file of S0b is written**, not after the PR is open.
- **S1 (contingent)** — if measured over 400, split into **S1a** (`drizzle/0002`, `schema.ts`, the verification-token port and adapter + test, 170–240) and **S1b** (the throttle port and adapter + test, 110–160). S1a must go first: the migration creates both tables, and S1b's adapter needs `auth_email_throttle` to exist in `createTestDb()`.
- **S3b-i** — cannot be split. The migration, `schema.ts`, the port, the adapter, its rewritten test and the 11 seed sites all break together the instant `discord_id` goes. **Pre-authorised `size:exception`**, reason: *"the identity column, its port, its adapter, that adapter's test and every test seed that inserts a user are one typecheck unit; any cut leaves a red tree."* It is pre-authorised here, before apply, so the owner decides it in this document rather than during review (R10).

Advisory forecast for `sdd-tasks`, which owns the final guard lines: nine slices, ~2000–2850 authored lines total; one slice (`S3b-i`) carries a pre-authorised `size:exception`; two carry contingent splits. The owner decision needed before apply is S3b-i's exception, and it is the only one.

---

## Migration / Rollout

**Two forward migrations.** D1 migrations are forward-only (`wrangler d1 migrations apply`); there is no `down`.

| Step | Command | Precondition |
|---|---|---|
| 1 | `pnpm db:generate` after each `schema.ts` change | `drizzle/meta/_journal.json` and the snapshots are committed with the SQL |
| 2 | `pnpm db:migrate:local` | run in S1 and again in S3b-i; local `e2e-%`/`seed-%` rows are disposable and `e2e/global-setup.ts` re-seeds |
| 3 | `wrangler d1 execute DB --remote --command "SELECT count(*) FROM riot_accounts"` | **must be 0 before step 4** (D4). A non-zero count means the cascade hazard is live and the migration must be re-planned, not forced |
| 4 | `pnpm db:migrate` (owner prerequisite P3) | step 3 returned 0 |
| 5 | `wrangler secret put AUTH_RESEND_KEY`, `wrangler secret put EMAIL_FROM` (P1, P2) | the sender address is verified in Resend |
| 6 | delete `AUTH_DISCORD_ID`/`AUTH_DISCORD_SECRET` from the real `.dev.vars` and `.env.local` (P4) | — |

**Rollback.**

- **S0, S1, S2, S3a** — purely additive: new pure modules, two new tables, unreferenced adapters. Reverting any of them touches nothing the running app reads; the two tables can be left in place harmlessly.
- **S3b-i and later** — rollback is the full revert of S3b-i onward *plus* a new forward migration recreating `users` with `discord_id`. Cheap today only because there are zero production rows; it stops being cheap the moment one real user signs in. **That is the point of no return, and it lands with S3b-i** — one slice earlier than the proposal's S3b, because the split moved the schema into the first half.
- **If email delivery itself proves unworkable** (R3/T8) after S3b-ii, the fast path forward is not a revert but a second adapter behind the same `EmailSender` port — one file.
- **Nothing is deployed** until the owner runs step 4, so until then every rollback is a local branch operation with zero user impact.

**No feature flag.** A flag would mean keeping both providers and therefore both identity columns, both adapter branches (`getUserByAccount`/`linkAccount` and an `accounts` table) and a coexistence story the owner explicitly rejected in A1. The chain's per-slice revert is the rollout control.

---

## Open Questions

None blocks `sdd-tasks`. All three are the owner's to settle during or after apply.

- [ ] **Which name does the email use?** `src/lib/legal.ts` has `SITE_NAME = "LoL Challenges"`, which `/terms`, `/privacy` and the Riot disclaimer already use, while `/login`'s wordmark renders "Become a Legend" and the proposal's subject line says "Your sign-in link for Become a Legend". This design passes `SITE_NAME` so the email cannot become a *third* name, but the underlying product-naming inconsistency is the owner's call and predates this change. Changing the answer is a one-line change to the argument `src/auth.ts` passes.
- [ ] **Throttle numbers.** 1/60 s and 5/hour are A4's defaults and `DEFAULT_SEND_POLICY` is a single exported constant, so retuning is one line and no test rewrite (every `allowSend` test passes its policy explicitly). The *shape* — per-address only, no per-IP, no Turnstile — is the assumption; the numbers are not.
- [ ] **Does D1 honour `PRAGMA foreign_keys`?** Unresolved and deliberately made non-blocking (D4) by requiring zero child rows at apply time. Worth answering once, in the Migration step-3 check, and recording in Engram for whoever writes the next parent-table recreate — by which time there *will* be real rows.
