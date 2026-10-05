# Apply progress: email-magic-link-auth

Change: `email-magic-link-auth` · Store: hybrid (this file + Engram topic `sdd/email-magic-link-auth/apply-progress`, project `challenges2026`)

## Status

**Phase S0 complete — 11/11 tasks (0.1–0.11).** Phases S1–S7 (tasks 1.x onward) are **not started**; this apply pass was scoped to S0 only. The pre-planned contingent split triggered: the combined S0 diff measured 434 authored lines against `feat/public-landing-gated-nav` (over the 400-line budget), so S0 landed as two chained PR slices per tasks.md's own pre-authorised split:

- **S0a** (`feat/email-magic-link-auth-s0a`, targets `feat/public-landing-gated-nav`): `email-identity.ts`+test, `auth-error.ts`+test, `return-path.ts`+test (tasks 0.1–0.4, 0.7–0.10). Measured **314 authored lines** (284 insertions + 30 deletions). Three work-unit commits: `f6eea14`, `5d2bc97`, `c8f5b2b`.
- **S0b** (`feat/email-magic-link-auth-s0b`, based on S0a): `magic-link-email.ts`+test (tasks 0.5, 0.6) plus the final tasks.md checkbox state and task 0.11's verify record. Measured **123 authored lines** (123 insertions, 0 deletions) against S0a. One work-unit commit: `8a0aa82`.

No `size:exception` was needed — both slices land under the 400-line budget per the pre-planned split. The original branch `feat/email-magic-link-auth-s0` (created by the orchestrator from the tracker `feat/email-magic-link-auth`) was renamed in place to `feat/email-magic-link-auth-s0a` once the split was confirmed necessary, so no commits were discarded.

## Completed: Phase S0 — Pure identity and copy helpers

- [x] 0.1 RED: `src/domain/email-identity.test.ts` — 16 cases: case folding, NFKC (fullwidth `＠` rejected after normalization because it canonicalizes to a second real `@`), leading/trailing whitespace and NBSP, quote rejection, 0/2/3 `@`-parts, empty local, empty domain, `domain,second` comma-trim (and comma-trim-to-empty), non-string/undefined/null, empty string, never-throws.
- [x] 0.2 GREEN: created `src/domain/email-identity.ts` — `normalizeEmail(raw: unknown): string | null`, implemented step-for-step from `@auth/core@0.41.3`'s `defaultNormalizer` (`node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/lib/actions/signin/send-token.js:74-104`, read directly to confirm the exact case table): NFKC → lowercase → trim → reject quotes → split on `@` requiring exactly 2 parts → comma-trim the domain → reject empty parts. Returns `null` instead of throwing (D17).
- [x] 0.3 RED: added to `email-identity.test.ts` — 5 cases: ordinary local part, exactly-20-char local part, 21-char truncation, whitespace-only local part → `"Player"`, no plus-tag stripping.
- [x] 0.4 GREEN: added `displayNameFromEmail`, `DISPLAY_NAME_MAX_LENGTH = 20`, `DISPLAY_NAME_FALLBACK = "Player"` to `email-identity.ts` (D23) — raw local part, trimmed, truncated; no prettification.
- [x] 0.5 RED: `src/domain/magic-link-email.test.ts` — 6 cases: subject contains `siteName`; text contains the URL exactly once; html contains the HTML-escaped URL exactly once; unescaping the html `href` round-trips to the original URL byte-for-byte; both parts state the expiry in minutes; neither part mentions Discord.
- [x] 0.6 GREEN: created `src/domain/magic-link-email.ts` — `magicLinkEmail({ url, expiresInMinutes, siteName })` returning `{ subject, text, html }` per design.md §5's exact content; `escapeHtmlAttribute` escapes `&`, `<`, `>`, `"` so a query-string `&` in the URL cannot mangle the link in strict mail clients.
- [x] 0.7 RED: rewrote `src/app/login/auth-error.test.ts` in full (the existing file asserted Discord-era copy for every known code, which design.md D20 changes for `AccessDenied`/`Configuration`/default and adds `Verification`/`EmailSignInError` for — a direct add would have left stale assertions asserting the old copy alongside new ones asserting the new copy for the same codes) — one case per D20 row plus the unknown-code fallback, plus one test asserting no known/unknown code's copy contains "Discord".
- [x] 0.8 GREEN: rewrote `messageForAuthError` in `src/app/login/auth-error.ts` per D20's table exactly (the `Configuration` body says "temporarily unavailable", not "misconfigured" — D20's rationale: it now covers a failed Resend send too, which is an outage, not a misconfiguration).
- [x] 0.9 RED: added to `src/app/login/return-path.test.ts` — 6 cases: safe `from` carried with the correct `&from=` joiner (not `?from=`, since `?invalid=email` is already present); unsafe `from` (`//evil.com`, backslash, absolute URL, non-string) all drop to the bare `/login?invalid=email`; absent `from` emits no `from` parameter.
- [x] 0.10 GREEN: added `invalidEmailLoginPath(from: unknown): string` to `return-path.ts`, re-running `safeReturnPath(from, "")` (D18). **Deviation note**: could not reuse `withReturnPath` as a literal joiner here — `withReturnPath` always prefixes `?from=`, but `invalidEmailLoginPath`'s target already carries `?invalid=email`, so the second parameter must join with `&`. Implemented as its own small function instead; `safeReturnPath` and `withReturnPath` themselves, and every existing test for both, are byte-for-byte unchanged (verified: all 11 pre-existing `return-path.test.ts` cases still pass).
- [x] 0.11 Verify: `pnpm test` → 582/582 passed (61 test files). `pnpm typecheck && pnpm lint && pnpm build` → all exit 0. Nothing is wired yet (no `auth.ts`, `login-panel.tsx`, or `page.tsx` changes), so no rendered page changed, matching the task's own note.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 0.1/0.2 | `src/domain/email-identity.test.ts` (normalizeEmail) | Unit | N/A (new file) | ✅ Written — `pnpm exec vitest run` failed with `Cannot find package '@/domain/email-identity'` | ✅ 16/16 passed | ✅ 16 cases (case fold, NFKC homoglyph, whitespace/NBSP, quote, 0/2/3 `@`, empty local/domain, comma-trim ×2, non-string ×3, empty, never-throws) | ✅ none needed — already minimal, pure, named constants |
| 0.3/0.4 | `email-identity.test.ts` (displayNameFromEmail) | Unit | ✅ 16/16 (prior cases in same file) | ✅ Written — 5 new tests failed with `displayNameFromEmail is not a function` | ✅ 21/21 passed | ✅ 5 cases (ordinary, exactly-20, 21-truncate, whitespace-only, plus-tag kept) | ➖ none needed |
| 0.5/0.6 | `src/domain/magic-link-email.test.ts` | Unit | N/A (new file) | ✅ Written — module-not-found failure | ✅ 6/6 passed | ✅ 6 cases (subject, text-once, html-escaped-once, round-trip-unescape, expiry-in-both-parts, no-Discord) | ✅ extracted `escapeHtmlAttribute` as a named pure helper during GREEN rather than inlining `.replaceAll` chains at the call site |
| 0.7/0.8 | `src/app/login/auth-error.test.ts` | Unit | ✅ ran pre-existing file first — 6/6 passed on old copy, confirming baseline before rewrite | ✅ Written — rewritten file failed 6/7 against the unmodified implementation (only "returns null" passed) | ✅ 7/7 passed | ✅ 6 distinct codes + 1 cross-cutting "no Discord in any code" case covering 5 codes in a loop | ➖ none needed — single switch, already minimal |
| 0.9/0.10 | `src/app/login/return-path.test.ts` | Unit | ✅ ran pre-existing file first — 11/11 passed, confirming `safeReturnPath`/`withReturnPath` baseline before adding | ✅ Written — 6 new tests failed with `invalidEmailLoginPath is not a function` | ✅ 17/17 passed (11 pre-existing + 6 new) | ✅ 6 cases (safe-from, 3 distinct unsafe-from shapes, non-string, absent) | ✅ one correction during GREEN: first draft reused `withReturnPath`'s `?from=` joiner, which produced a double `?` against `/login?invalid=email`; replaced with a dedicated `&from=` join once the first assertion caught it |

### Test Summary
- **Total tests in the four files this phase touched/created**: 51 — `email-identity.test.ts` 21 (new file), `magic-link-email.test.ts` 6 (new file), `auth-error.test.ts` 7 (file rewritten: 6 new cases + 1 case, "returns null", whose assertion was already correct and carried through unchanged), `return-path.test.ts` 17 (11 pre-existing cases carried unchanged + 6 new cases)
- **Total tests passing**: 582/582 (full suite, up from the pre-S0 baseline of 548)
- **Layers used**: Unit (51 new/changed tests), Integration (0), E2E (0) — S0 is pure-function/copy-table scope only, per design.md D16
- **Approval tests** (refactoring): `auth-error.test.ts` and `return-path.test.ts` each had their pre-existing suite run green *before* any edit, to confirm the safety net described in strict-tdd.md's "Approval Testing" section, before the copy/addition changes were made
- **Pure functions created**: 5 (`normalizeEmail`, `displayNameFromEmail`, `magicLinkEmail`, `escapeHtmlAttribute`, `invalidEmailLoginPath`) — `messageForAuthError` was modified, not created

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/domain/email-identity.test.ts src/domain/magic-link-email.test.ts src/app/login/auth-error.test.ts src/app/login/return-path.test.ts` → all 4 files pass (21 + 6 + 7 + 17 = 51 tests); full `pnpm test` → `Test Files 61 passed (61)`, `Tests 582 passed (582)` (baseline was 59 files / 548 tests before this phase) |
| Runtime harness command/scenario and exact result | **N/A** — nothing imports any of the four new/changed files yet (`src/auth.ts`, `login-panel.tsx`, and `page.tsx` are untouched; they are S3b-ii/S4 scope). No route, Server Function, or adapter references `normalizeEmail`, `displayNameFromEmail`, `magicLinkEmail`, or the new `invalidEmailLoginPath` export. `pnpm build` was run as part of 0.11 and confirms the existing 10 routes (including `/login`) still compile and render unchanged — this is the closest runtime signal available, and it is unaffected because nothing new is wired |
| Rollback boundary | Revert the 4 production files (`src/domain/email-identity.ts`, `src/domain/magic-link-email.ts`, `src/app/login/auth-error.ts`, `src/app/login/return-path.ts`) and their test files, or `git revert` the 4 commits (`f6eea14`, `5d2bc97`, `c8f5b2b`, `8a0aa82`) in reverse order. `auth-error.ts`/`return-path.ts` revert to their pre-S0 Discord-era content; nothing downstream references the new exports, so no other file needs touching |

## Verification (S0, task 0.11)

| Command | Result |
|---|---|
| `pnpm test` | exit 0 — `Test Files 61 passed (61)`, `Tests 582 passed (582)` (up from the pre-S0 baseline of 59 files / 548 tests) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean. One fix needed during this step: `src/domain/magic-link-email.test.ts` originally used `match![1]` (non-null-asserting the match but not the capture group), which `tsc --noEmit` rejected under `noUncheckedIndexedAccess` as `error TS2532: Object is possibly 'undefined'`; replaced with `match?.[1]` plus an explicit `expect(href).toBeDefined()` assertion, which is both type-safe and a stronger test (it now fails loudly if the regex ever stops matching, instead of only on `.replaceAll` throwing) |
| `pnpm lint` | exit 0 — `eslint` clean on first run, no changes needed |
| `pnpm build` | exit 0 — `next build` compiled successfully; all 10 existing routes (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/challenges`, `/challenges/[id]`, `/challenges/new`, `/login`, `/privacy`, `/terms`) still generated, none changed shape (S0 wires nothing) |

## Review budget measurement

| Slice | Branch | Base | Measured (additions+deletions) | Budget | Split needed? |
|---|---|---|---|---|---|
| S0 combined (pre-split) | — | `feat/public-landing-gated-nav` | 434 (404 + 30) | 400 | **Yes** — triggered the pre-planned contingent split from tasks.md |
| S0a | `feat/email-magic-link-auth-s0a` | `feat/public-landing-gated-nav` | 314 (284 + 30) | 400 | No — under budget as planned (design.md estimated 180–250; measured came in higher because the full D20 table and the NFKC/comma-trim test matrix are both larger than the median estimate, but still comfortably under 400) |
| S0b | `feat/email-magic-link-auth-s0b` | `feat/email-magic-link-auth-s0a` | 123 (123 + 0) | 400 | No — under budget, within the 120–170 estimate |

No `size:exception` was requested or needed. `pnpm-lock.yaml` was not touched by this phase (no new dependency was added).

## Deviations from design

1. **`invalidEmailLoginPath` could not literally "re-run" `withReturnPath`** the way D18's prose reads at first glance — `withReturnPath` always joins with `?from=`, which collides with the already-present `?invalid=email`. Implemented `invalidEmailLoginPath` as its own small function that calls `safeReturnPath(from, "")` (exactly as D18 specifies) and then joins with `&from=` when the result is non-empty. `safeReturnPath` and `withReturnPath` themselves are untouched, matching D18's actual constraint ("`safeReturnPath`/`withReturnPath` are unchanged").
2. **`auth-error.test.ts` was rewritten wholesale rather than incrementally extended.** The task description says "add to" the file, but every pre-existing case (`AccessDenied`, `Configuration`, the generic fallback) asserts copy that D20 explicitly changes, so an incremental add would have left the file self-contradictory (old and new expectations for the same codes). Ran the pre-existing 6 cases green first as an approval-test safety net, then replaced the file in one RED step covering all 5 D20 rows plus the fallback and the cross-cutting Discord-absence check.
3. **One typecheck-only fix** in `magic-link-email.test.ts` (`match![1]` → `match?.[1]` plus an explicit `toBeDefined()` assertion) — not a design deviation, a strict-mode TypeScript correction caught by 0.11's `pnpm typecheck` gate, applied before this apply pass returned.

No other deviations. No pre-existing test (`login-panel.test.tsx`, `src/components/auth-status.tsx` tests, `hero.test.tsx`) needed an assertion update — the full `pnpm test` run after each change stayed at the expected count increase with zero regressions, confirming none of those files call `messageForAuthError` with a code this phase's copy changes affected in a way their fixtures exercise.

## Issues found

None.

## Remaining tasks (not in scope for this apply pass)

- [ ] Phase S1: Auth tables, token and throttle ports and adapters (tasks 1.x)
- [ ] Phase S2: Delivery, throttle policy, and the send use case
- [ ] Phase S3b-i: Identity schema swap
- [ ] Phase S3a: Auth.js adapter
- [ ] Phase S4: Login UX
- [ ] Phase S3b-ii: `src/auth.ts` swap
- [ ] Phase S6: Discord copy and config removal
- [ ] Phase S7: E2E fixtures and manual verification plan

## Workload / PR boundary

- Mode: chained PR (feature-branch-chain), contingent split triggered
- Current work unit: Phase S0, delivered as two slices — S0a (`feat/email-magic-link-auth-s0a`) and S0b (`feat/email-magic-link-auth-s0b`, based on S0a)
- Boundary: starts from `feat/public-landing-gated-nav` (S0a's base) and ends with S0b's tip (`8a0aa82`); next slice (S1) targets `feat/email-magic-link-auth-s0b` per the linear chain order
- Estimated review budget impact: both slices land under the 400-line budget (314 and 123 respectively); no exception requested

## Status

11/11 S0 tasks complete. Ready for the next apply batch (Phase S1) or for `sdd-archive` if the orchestrator chooses to pause the chain here — per session pace (`interactive`), this apply pass stops after S0 as instructed and returns control to the orchestrator.
