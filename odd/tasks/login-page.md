# Feature: dedicated `/login` page

Store: file (this document) + Engram mirror under topic `odd/login-page/tasks`, project `challenges2026`.
Branch: `feat/login-page` (based on `feat/challenge-ui-s4b-iii-create-page`, PR #22; keeps the open PR chain linear). TDD: strict, from the project's SDD testing configuration (`sdd/challenges2026/testing-capabilities`), runner `pnpm test` (Vitest, `environment: "node"`, no jsdom).

## Objective

A dedicated sign-in page at `/login`, styled after the design export's `design/Login.dc.html` ("Maqueta 01 · Login", main state 01 and error state 04), with the existing Discord sign-in as the only call to action.

## Problem and why

Today sign-in is a bare "Sign in with Discord" button rendered inline in the header, on `/account`, and on `/challenges/new`. There is no page a link can point to, no place for the brand headline, and Auth.js errors land on its default `/api/auth/error` page, which is unstyled. The owner wants the login screen from the design, with Discord instead of Riot (RSO is gated behind a production key; proposal A9 of the `challenge-ui` change keeps the Riot login out of scope).

## Scope

In:
- `/login` route, server-rendered, reachable signed out. A signed-in visitor is redirected to `/account`.
- Return path: `/login?from=<relative path>`; after the Discord round-trip Auth.js returns to `from`, or to `/account` when absent or unsafe.
- Error state: Auth.js `pages.error` points at `/login`, so `/login?error=<AuthErrorType>` renders the mockup's error state (title, explanation, retry = the same button).
- The header, `/account` and `/challenges/new` sign-in controls become links to `/login` (`/account` and `/challenges/new` pass their own path as `from`; the header passes none).
- Copy in English, adapted to the actual product (goal challenges tracked from match history), not the mockup's 1v1 duel copy. Headline kept from the brand: "Your friends. / Your rules. / Your legend."

Out:
- Riot / RSO sign-in, the mockup's permissions, connecting and display-name states (Riot-specific).
- Any change to Auth.js session strategy, callbacks or providers.
- The landing `/` restyle (SDD slice S6).

## Constraints

- Server components by default; the only interactive element is a `<form>` whose action is a Server Function calling `signIn("discord", { redirectTo })`. No new client component is needed.
- `@/auth` cannot be imported under Vitest (next-auth pulls `next/server`), so the page and the action stay thin, and everything with behaviour lives in a presentational panel and a pure helper that are testable by static render and plain unit tests.
- Only S1 primitives (`Button`, `Badge`, `Icon`) and theme utilities from `src/app/globals.css`; no inline styles; all UI copy in English.
- Review budget 400 authored lines per PR; split at commit boundaries if exceeded, or recommend `size:exception` for the owner.

## Tasks

- [x] L1 RED→GREEN `src/app/login/return-path.ts` + `return-path.test.ts`: `safeReturnPath(raw: unknown, fallback = "/account"): string` — accepts only a string starting with a single `/` (rejects `//host`, `http:`, `javascript:`, empty, non-string, backslashes), strips nothing else, returns `fallback` otherwise; `withReturnPath("/login", from)` builds `/login?from=<encoded>` for the callers.
- [x] L2 RED→GREEN `src/app/login/auth-error.ts` + test: `messageForAuthError(code: string | undefined): { title: string; body: string } | null` — `null` when absent; `AccessDenied` → "Discord denied the request." / "You cancelled the sign-in or your Discord account can't be used here. Nothing changed."; `Configuration` → "Sign-in isn't configured." / "The server is missing its sign-in settings. This is on us, not on you."; any other known Auth.js code (`OAuthCallbackError`, `OAuthSignin`, `Callback`, `Default`, …) → "We couldn't sign you in." / "Discord didn't complete the sign-in. Nothing changed on your account. Try again."
- [x] L3 RED→GREEN `src/app/login/login-panel.tsx` + `login-panel.test.tsx` (static render): presentational `LoginPanel({ from, error, action })` — wordmark "Become a Legend", optional eyebrow `Badge`, the three-line `h1` in `font-display`, the product subtitle, a `<form action={action}>` with a hidden `from` field (present only when `from` is set) and one full-width `lg` primary `Button` "Sign in with Discord" (`type="submit"`), the note "No new account. We use your Discord sign-in.", and the legal line linking `/terms` and `/privacy`. With `error` set, the error title and body render above the button in a `role="alert"` region and the button reads "Try again". Responsive: mobile-first single column (390px), larger display type from `md:` (the mockup's 104px desktop headline).
- [x] L4 `src/app/login/actions.ts` (`"use server"`): `signInWithDiscordAction(formData)` → `signIn("discord", { redirectTo: safeReturnPath(formData.get("from")) })`. `src/app/login/page.tsx` (server): `auth()` → `redirect("/account")` when signed in; reads `searchParams` (`from`, `error`; Promises per Next 16), renders `LoginPanel`; `metadata.title` "Sign in". `src/auth.ts`: add `pages: { signIn: "/login", error: "/login" }` with a comment; no other change.
- [x] L5 Rewire entry points: `src/components/auth-status.tsx` signed-out branch becomes a `next/link` to `/login` (optional `from` prop → `withReturnPath`), styled as the existing outline control; `/account` and `/challenges/new` sign-in panels pass `from="/account"` / `from="/challenges/new"`. Header passes nothing (falls back to `/account`).
- [x] L6 Verify: `pnpm test`, `pnpm typecheck && pnpm lint && pnpm build` (route list gains `/login`); smoke under `next dev`: `GET /login` 200 with the headline and button, `GET /login?error=OAuthCallbackError` shows the error title, `GET /login?from=//evil.example` renders no hidden `from`; browser screenshot at 375px and desktop by the orchestrator.

## Acceptance criteria

- A signed-out visitor sees the styled page; clicking the button starts the Discord OAuth flow and returns to `from` or `/account`.
- A signed-in visitor at `/login` lands on `/account`.
- Auth.js errors render on `/login` with a readable message and a retry button; no unstyled `/api/auth/error` page is reachable from the normal flow.
- Every previous sign-in control still works, now as a link to `/login`.
- Suite, typecheck, lint and build green; no new client JS chunk.

## Progress and verification evidence

All six tasks are done. Strict TDD followed throughout: for L1–L3 each production file has a RED commit-worthy failure observed before GREEN (see the TDD Cycle Evidence table below); L4/L5 are the thin, untested roots the constraints section calls for (`@/auth` cannot be imported under Vitest — confirmed again here, same failure mode already documented in `create-form-body.tsx`).

| Command | Result |
|---|---|
| `pnpm exec vitest run src/app/login/return-path.test.ts` (RED, before `return-path.ts` existed) | `Error: Cannot find package '@/app/login/return-path'` — 0 tests, suite failed to load |
| `pnpm exec vitest run src/app/login/return-path.test.ts` (GREEN) | 11 passed |
| `pnpm exec vitest run src/app/login/auth-error.test.ts` (RED) | `Error: Cannot find package '@/app/login/auth-error'` — 0 tests |
| `pnpm exec vitest run src/app/login/auth-error.test.ts` (GREEN) | 6 passed |
| `pnpm exec vitest run src/app/login/login-panel.test.tsx` (RED) | `Error: Cannot find package '@/app/login/login-panel'` — 0 tests |
| `pnpm exec vitest run src/app/login/login-panel.test.tsx` (first GREEN attempt) | 1 failed — apostrophe fixture text (`"couldn't"`) is HTML-escaped (`&#x27;`) by `renderToStaticMarkup`, so the literal `indexOf` match failed. Fixed the test fixture to use quote-free error copy; not a production defect. |
| `pnpm exec vitest run src/app/login/login-panel.test.tsx` (GREEN) | 8 passed |
| `pnpm test` (after L4) | 474 passed (48 files) — safety net: equal to the pre-existing count, nothing broken |
| `pnpm test` (after L5) | 474 passed (48 files) |
| `pnpm exec tsc --noEmit` (after L4, `PageProps<"/login">` resolution) | clean, no errors |
| `pnpm typecheck` (`next typegen && pnpm cf-typegen && tsc --noEmit`) | exit 0, clean |
| `pnpm lint` | clean, no findings |
| `pnpm build` | succeeded; `Route (app)` list includes `ƒ /login` alongside `/`, `/account`, `/api/auth/[...nextauth]`, `/challenges/new`, `/privacy`, `/terms` |
| `GET http://localhost:3100/login` (shared dev server — see note below) | `200`; body contains `Your friends.` and `Sign in with Discord` |
| `GET http://localhost:3100/login?error=OAuthCallbackError` | `200`; body contains `role="alert"` and the generic retry title (`We couldn` — apostrophe-escaped) |
| `GET http://localhost:3100/login?from=//evil.example` | `200`; body contains zero occurrences of `name="from"` — the unsafe value renders no hidden field |
| `GET http://localhost:3100/` (header link) | contains `href="/login"` with no `?from=` |
| `GET http://localhost:3100/account` (signed out) | contains `href="/login?from=%2Faccount"` |
| `GET http://localhost:3100/challenges/new` (signed out) | contains `href="/login?from=%2Fchallenges%2Fnew"` |

**Dev-server note**: the brief called for `pnpm exec next dev --port 3101` for these smoke checks. Next 16 refuses a second `next dev` instance for the same project even on a different port ("Another next dev server is already running", PID of the orchestrator's port-3100 instance) — confirmed directly, the 3101 process exited on its own after printing that message. The orchestrator's already-running port-3100 dev server (predates this session's commits, live-reloads on save) was used instead for all smoke checks above; its responses reflect the current tree.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| L1 | `src/app/login/return-path.test.ts` | Unit | N/A (new) | ✅ Written | ✅ 11 passed | ✅ 8 cases (valid path, 3 non-string shapes, empty, `//host`, `http:`, `javascript:`, backslash, custom fallback) | ➖ None needed |
| L2 | `src/app/login/auth-error.test.ts` | Unit | N/A (new) | ✅ Written | ✅ 6 passed | ✅ 6 cases (absent, `AccessDenied`, `Configuration`, two distinct generic codes, one unrecognized code) | ➖ None needed |
| L3 | `src/app/login/login-panel.test.tsx` | Unit (static render, `renderToStaticMarkup`) | N/A (new) | ✅ Written | ✅ 8 passed (1 test-fixture fix along the way, documented above) | ✅ 8 cases across main/error states, `from` present/absent, legal links | ➖ None needed |
| L4 | `src/app/login/actions.ts`, `page.tsx`, `src/auth.ts` | N/A — untested thin roots (`@/auth` unresolvable under Vitest, matches `create-form.tsx`/`actions.ts`'s documented constraint) | N/A (new/modified) | N/A | N/A | N/A | N/A |
| L5 | `src/components/auth-status.tsx`, `src/app/account/page.tsx`, `src/app/challenges/new/page.tsx` | N/A — same `@/auth` constraint (`AuthStatus` has never had a test file) | ✅ `pnpm test` 474/474 before and after | N/A | N/A | N/A | N/A |

### Test Summary
- **Total tests written**: 25 (`return-path.test.ts` 11, `auth-error.test.ts` 6, `login-panel.test.tsx` 8)
- **Total tests passing**: 474/474 (whole suite, including the 25 new ones)
- **Layers used**: Unit (25 new; 449 pre-existing unaffected)
- **Approval tests** (refactoring): None — every L1–L3 file is new, not a refactor of existing behaviour
- **Pure functions created**: 3 (`safeReturnPath`, `withReturnPath`, `messageForAuthError`)

### What each test file covers, and what it does not

- **`return-path.test.ts`**: every `safeReturnPath` rejection path (non-string, empty, `//host`, `http:`, `javascript:`, backslash), the accept path, the custom-fallback path, and `withReturnPath`'s three shapes (with/without/empty `from`). Does not cover URL-encoded bypass attempts (e.g. `%5C` in place of a literal backslash) — out of scope: the spec names literal backslashes, and the value is never used as a raw URL by a browser, only read back by `formData.get`.
- **`auth-error.test.ts`**: the `null` case, both specifically-worded codes, two different codes that both fall to the generic message (proving the fallback is real dispatch, not luck), and one code not in Auth.js's current type union at all (future-proofing the `default` branch). Does not assert on `AuthErrorMessage`'s exported type shape beyond what the object-equality checks already imply.
- **`login-panel.test.tsx`**: main-state markup (wordmark, three-line headline, submit button, no alert region, no hidden field), the hidden-field-present case with its exact value, the legal links, and the full error-state swap (alert region ordering, button relabel, headline suppressed). Does not and cannot cover interaction (nothing is clickable in a static render — no DOM, no event system, matching `create-form-body.test.tsx`'s documented limitation) or the `Badge` eyebrow's exact copy (asserted indirectly via the "no role=alert" test, not by its text, since the eyebrow's wording was this writer's own call, not a spec literal).
- **`actions.ts`, `page.tsx`, `src/auth.ts`**: no dedicated test file, by the environment constraint documented in every doc comment. Coverage instead comes from: `pnpm build`'s successful static analysis of `PageProps<"/login">` and the Server Function boundary, the three live smoke checks above (200 status, exact rendered markup), and the manual link-rewiring checks against `/`, `/account`, `/challenges/new`.
- **`auth-status.tsx`, `/account`, `/challenges/new`**: same constraint; covered by the safety-net full-suite run (474/474 both before and after L5, proving nothing else broke) plus the live `href` smoke checks above.

## Branch layout (review-budget split)

`git diff --shortstat feat/challenge-ui-s4b-iii-create-page HEAD -- . ':!odd'` (excluding this doc, per the brief) measured **462 insertions(+), 18 deletions(-) across 12 files = 480 authored lines**, over the 400-line review budget. Per the brief's own example, split at the natural commit boundary between the tested helpers/panel and the untested route wiring — no code was restructured, no comment or test was shortened to make the number:

| Branch | Base | Tip commit | Commits included | Authored lines vs. base |
|---|---|---|---|---|
| `feat/login-page-i-helpers-panel` | `feat/challenge-ui-s4b-iii-create-page` | `4e808e1` | L1 (`9425fe9`), L2 (`1cf5417`), L3 (`4e808e1`) | 364 insertions, 0 deletions — **under budget** |
| `feat/login-page-ii-route-rewire` | `feat/login-page-i-helpers-panel` | `69bee19` | L4 (`e0bc514`), L5 (`69bee19`) | 98 insertions, 18 deletions = 116 authored lines relative to slice i — **under budget** |

Both branches exist locally (created from the existing linear commit history on `feat/login-page`, no rebase or rewrite). `feat/login-page` itself still points at `69bee19` (all five commits) and is left as-is, clean except the untracked `.claude/` directory this writer was told to leave alone. Nothing has been pushed; no PR was opened, per the brief.

Commit SHAs, in order:
1. `9425fe9` — `feat(login): add safe return-path validation and URL builder`
2. `1cf5417` — `feat(login): map Auth.js error codes to readable messages`
3. `4e808e1` — `feat(login): add the presentational LoginPanel`
4. `e0bc514` — `feat(login): wire the /login route and route Auth.js errors to it`
5. `69bee19` — `feat(login): rewire sign-in entry points to link to /login`

## Next step

Orchestrator: push `feat/login-page-i-helpers-panel`, open a PR against `feat/challenge-ui-s4b-iii-create-page`; then push `feat/login-page-ii-route-rewire`, open a chained PR against `feat/login-page-i-helpers-panel`. Take the browser screenshots at 375px and desktop (mobile-first `LoginPanel` layout, `md:` scale-up) before or alongside review — this writer did not open a browser. Gate on the verification table above; nothing here is outstanding or partial.
