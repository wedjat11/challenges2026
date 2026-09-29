# Feature: public landing and session-gated navigation

Store: file (this document) + Engram mirror under topic `odd/public-landing-gated-nav/tasks`, project `challenges2026`.
Branch: `feat/public-landing-gated-nav` (based on `docs/challenge-ui-archive`, PR #36, the chain tip). TDD: strict, from the project's SDD testing configuration, runner `pnpm test` (Vitest, `environment: "node"`, static render through `react-dom/server`).

## Objective

Signed out, the product presents itself: `/` is the public landing built on the design's entry screen (`design/Login.dc.html`, state "01 Principal"), the header shows only the wordmark and a "Log in" button on the right that leads to `/login`, and the app navigation (Challenges, Create, Account) is not shown. Signed in, the same landing shows the app calls to action, and the header shows the navigation plus the account status.

## Problem and why

Today the header always renders Challenges, Create and Account, and the landing shows "Create a challenge" and "Browse challenges" to everyone, so a visitor sees an app before they have any reason to sign in. The owner wants the public face to sell the product with a single path in, and the app chrome to appear only after login.

## Scope

In:
- `SiteHeader` reads the session. Signed out: wordmark + one "Log in" control (link to `/login`, styled as the outline button). Signed in: the three navigation links + `AuthStatus` (avatar, name, sign out), as today.
- `/` has two states. Signed out: the marketing hero from the entry mockup (eyebrow, the three-line headline "Your friends. / Your rules. / Your legend.", the product subtitle, one primary "Log in" call to action to `/login`, the note "No new account. We use your Discord sign-in."). Signed in: the current hero with "Create a challenge" and "Browse challenges". The inline `AuthStatus` in the hero goes away; the header owns sign-in.
- The signed-out control label everywhere the header/landing renders it is "Log in"; the `/account` and `/challenges/new` sign-in panels keep their own copy and their `from` return path.

Out:
- Route access. `/challenges`, `/challenges/[id]`, `/terms`, `/privacy` stay readable signed out (shared URLs must work per the archived `challenge-view` and `challenge-discovery` specs); only the navigation is gated.
- Any change to `/login`, Auth.js config, or the account page.

## Constraints

- `@/auth` cannot be imported under Vitest, so the header and the landing keep thin server roots and put every branch that has behaviour into presentational components with static-render tests.
- Only existing primitives (`Button`, `buttonClassName`, `Badge`, `Icon`) and theme utility names from `src/app/globals.css`; no inline styles; UI copy in English.
- Behaviour-preserving for the signed-in state except for the removal of the hero's inline sign-in control.
- Review budget 400 authored lines per PR; split at commit boundaries if exceeded, or recommend `size:exception` for the owner.

## Tasks

- [x] N1 RED→GREEN `src/components/site-header-body.tsx` + test: `SiteHeaderBody({ signedIn, authSlot })` renders the wordmark link always; when `signedIn` is false it renders NO `nav` and no links to `/challenges`, `/challenges/new`, `/account`, and renders a "Log in" link to `/login` styled with `buttonClassName({ variant: "outline", size: "sm" })`; when `signedIn` is true it renders the three navigation links (icon-only below `sm:`, labels from `sm:`, `aria-label` on each) and the `authSlot`. `src/components/site-header.tsx` becomes the thin async root: `await auth()`, renders the body with `signedIn={Boolean(session?.user)}` and `authSlot={<AuthStatus />}`.
- [x] N2 RED→GREEN `src/app/hero.tsx` (or extend `hero-ctas.tsx`) + test: `Hero({ signedIn })`. Signed out: eyebrow, the three-line headline in the display type scale already used by `login-panel.tsx`, the subtitle "Create goal challenges with your friends and let match history update your progress automatically.", one primary `lg` "Log in" link to `/login`, and the note. Signed in: the headline "LoL Challenges" block as today with the two app calls to action. Assert by text and hrefs, never by class strings.
- [x] N3 `src/app/page.tsx`: thin root, `await auth()`, renders `Hero` with the session flag; remove the inline `<AuthStatus />` from the hero. `src/components/auth-status.tsx`: the signed-out branch label becomes "Log in" (it is still used by the `/account` and `/challenges/new` panels with their `from`); keep the signed-in branch as is.
- [x] N4 Verify: `pnpm test`, `pnpm typecheck && pnpm lint && pnpm build`; `pnpm test:e2e` still passes (the spec signs in by cookie and navigates by URL, but check any locator that relied on the header nav or the hero); smoke on the dev server: `GET /` signed out contains "Log in", the headline, no `href="/challenges/new"` and no `href="/account"` in the header; `GET /challenges` and `GET /challenges/<seeded id>` still 200 signed out; browser screenshots by the orchestrator.

## Acceptance criteria

- A visitor sees the marketing landing with a single "Log in" path and a header with only the wordmark and "Log in".
- A signed-in user sees the navigation and the app calls to action; nothing else about the signed-in experience changes.
- Shared challenge URLs and the public browse page still open signed out.
- Suite, typecheck, lint, build and e2e green.

## Progress and verification evidence

**N1 — `SiteHeaderBody` + thin `SiteHeader` root** (commit `7d33937`, also the tip of chained branch `feat/public-landing-gated-nav-i-header`)
- RED: `pnpm exec vitest run src/components/site-header-body.test.tsx` failed with `Cannot find package '@/components/site-header-body'` (component did not exist yet).
- GREEN: same command → `Test Files 1 passed (1)`, `Tests 6 passed (6)`, covering both branches (wordmark always, signed-out has no `nav`/app links and has "Log in" → `/login`, signed-out never renders `authSlot`, signed-in renders the three `aria-label`led links plus `authSlot`, signed-in never renders "Log in"). No triangulation gap: every scenario in the task already has a dedicated assertion.
- Safety net + regression: `pnpm test` → `Test Files 58 passed (58)`, `Tests 543 passed (543)` (537 baseline + 6 new).
- `pnpm exec tsc --noEmit` → no output (clean).
- Files: `src/components/site-header-body.tsx` (new, 83 lines), `src/components/site-header-body.test.tsx` (new, 81 lines), `src/components/site-header.tsx` (rewritten thin root, net −12 lines vs. before).

**N2 — `Hero` component** (commit `51b3453`)
- RED: `pnpm exec vitest run src/app/hero.test.tsx` failed with `Cannot find package '@/app/hero'`.
- GREEN: same command → `Test Files 1 passed (1)`, `Tests 5 passed (5)` (signed-out: headline/subtitle/note text, single "Log in" link to `/login`, never the app CTAs; signed-in: app CTAs present, never the marketing headline or a "Log in" link).
- Safety net + regression: `pnpm test` → `Test Files 59 passed (59)`, `Tests 548 passed (548)`.
- `pnpm exec tsc --noEmit` → clean.
- Files: `src/app/hero.tsx` (new, 68 lines, reuses `HeroCtas` unmodified), `src/app/hero.test.tsx` (new, 63 lines). Not yet wired into `page.tsx` at this commit.

**N3 — wire `Hero` into `page.tsx`; relabel `AuthStatus`** (commit `85d729e`)
- No new test: both touched files (`page.tsx`, `auth-status.tsx`) are thin roots/branches that import `@/auth`, which cannot be resolved under Vitest (constraint, confirmed by the absence of any pre-existing test for either file — same limitation already documented for `site-header.tsx` before this change).
- Safety net + regression: `pnpm test` → unchanged at `Test Files 59 passed (59)`, `Tests 548 passed (548)` (expected — no new testable surface).
- `pnpm exec tsc --noEmit` → clean.
- Files: `src/app/page.tsx` (rewritten thin root, net −15 lines), `src/components/auth-status.tsx` (1-line label change, "Sign in with Discord" → "Log in"; `/account` and `/challenges/new` panels use `login-panel.tsx`, untouched, and keep "Sign in with Discord").

**N4 — verification**
| Command | Result |
|---|---|
| `pnpm test` | `Test Files 59 passed (59)`, `Tests 548 passed (548)` |
| `pnpm typecheck` (`next typegen && cf-typegen && tsc --noEmit`) | Clean, no errors |
| `pnpm lint` | Clean, no output |
| `pnpm build` | `✓ Compiled successfully`; all 10 routes render as dynamic (`ƒ`), matching the app's existing all-dynamic layout |
| `curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/` (signed out, reused dev server) | `200`; body contains `Log in` (×4: header + hero CTA), `Your friends.`, and zero occurrences of `href="/challenges/new"` or `href="/account"` |
| `curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/challenges` (signed out) | `200` |
| `curl -s -o /dev/null -w "%{http_code}" http://localhost:3100/challenges/seed-challenge-join-live` (signed out) | `200` |
| `pnpm test:e2e` (after killing the port-3100 tooling PID; Playwright's own `pnpm dev` on port 3000; not restarted afterward, per environment facts) | `2 passed (13.6s)` — `create-then-join` on both the `mobile` and `desktop` Playwright projects. No locator in `e2e/create-then-join.spec.ts` depends on the header nav or the hero (it signs in by cookie and navigates by URL throughout, never visiting `/`), so the spec needed no changes. |

Note: the e2e run logs a pre-existing, unrelated React warning ("Cannot update a component (`CreateFormBody`) while rendering a different component (`RuleBuilder`)" at `rule-builder.tsx:119`) on both runs — present before this change, in a file this feature never touches; not investigated further as out of scope.

**Review budget**: `git diff --shortstat docs/challenge-ui-archive HEAD -- . ':!odd'` → `7 files changed, 320 insertions(+), 89 deletions(-)` = 409 authored lines, 9 over the 400-line budget. Split at the existing commit boundary into two chained branches rather than reshaping code to fit:
- `feat/public-landing-gated-nav-i-header` → commit `7d33937` (N1 only; 237 lines: header gating).
- `feat/public-landing-gated-nav-ii-landing` → commit `85d729e` (chains on top of `i-header`; adds N2+N3; 172 lines: landing hero + wiring), plus this docs commit.
- `feat/public-landing-gated-nav` (the originally checked-out branch) carries the same three commits plus this docs commit, kept in sync with `ii-landing`, in case the orchestrator prefers a single PR with a `size:exception` instead of the chain.

## Next step

Implementation complete (N1–N4), all checks green. Orchestrator: gate, take browser screenshots, run the native review (receipt-driven development is on) — decide between the two-PR chain (`-i-header` → `-ii-landing`) or a single PR against `docs/challenge-ui-archive` with `size:exception` for the 9-line overage — then push and open the PR(s). Do not restart the port-3100 dev server; it was stopped for `pnpm test:e2e` and left down per the environment facts.

## Native review (receipt-driven development)

Lineage `review-78502c43983f0cb0`, four lenses, candidate = the committed diff of `feat/public-landing-gated-nav` against `docs/challenge-ui-archive`. Outcome: **approved**, acknowledged and burned on 2026-09-28. The risk lens found no new data exposure, no authorization moved to the client, and no new redirect sink; hiding the navigation grants or removes no route access. One lens capture failed once on the provider side (the reviewer model's safeguards flagged the request) and succeeded on the single relaunch the bound status re-offered. Every finding below is advisory and non-blocking; the review contract treats them as separate later work.

## Follow-ups (not in this feature's PRs)

- [ ] G1 Session resolved up to three times per request: `SiteHeader` awaits `auth()` and still renders the async `AuthStatus`, which resolves it again; `/` adds a third read in `page.tsx`. Thread one resolved value through: let `AuthStatus` accept the session (or the user) as a prop, have the header pass it, and have the landing reuse the header's read or a request-scoped cached `auth()`. This also removes the "torn read" case where the hero and the header could disagree mid-render.
- [ ] G2 Tests assert less than they claim: the hero subtitle assertion is truncated, the "single Log in link" test does not count links, the moved signed-in copy is not asserted after the move, and the `AuthStatus` "Log in" relabel has no assertion at all (untestable root; cover it in the e2e spec or by extracting the label).
- [ ] G3 Readability: the header body test cites a rationale section that does not say what the comment claims; `hero.tsx`'s doc comment gives two different reasons for the split; the task document's line about the relabel contradicts itself; the two signed-out controls (header and `AuthStatus`) now share the same "Log in" copy, so a mixed state would be indistinguishable from a bug.
