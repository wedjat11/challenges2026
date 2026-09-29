# Delta for Challenge Participation

`openspec/specs/challenge-participation/` does not exist yet — every requirement below is new.

## ADDED Requirements

### Requirement: Sign-In and Linked Account Required to Join

Joining a challenge MUST require an authenticated session and at least one Riot account linked to that session's user. A user who attempts to join without an authenticated session, or without a linked Riot account, MUST be redirected to `/account` with the reason stated (A4). No inline link-account form is offered on the challenge page.

#### Scenario: Signed-out join attempt redirects with reason

- GIVEN a visitor with no authenticated session on a challenge page
- WHEN they attempt to join
- THEN they are redirected to `/account` and shown that signing in is required to join

#### Scenario: Signed-in user with no linked account redirects with reason

- GIVEN a signed-in user with zero linked Riot accounts on a challenge page
- WHEN they attempt to join
- THEN they are redirected to `/account` and shown that a Riot account must be linked to join

#### Scenario: Signed-in user with a linked account joins

- GIVEN a signed-in user with at least one linked Riot account on a joinable challenge page
- WHEN they submit the join action
- THEN they are recorded as a participant using a Riot account they own

### Requirement: Account Selection When Multiple Linked Accounts Exist

When the signed-in user has more than one linked Riot account, the join action MUST let them select which account joins, and MUST record the join under the selected account's id. When the user has exactly one linked Riot account, the join action MUST use that account without requiring an additional selection step. The system MUST verify that the chosen `riotAccountId` belongs to the signed-in user before recording the join; a request naming an account owned by a different user MUST be refused.

#### Scenario: Single linked account joins without a picker

- GIVEN a signed-in user with exactly one linked Riot account
- WHEN they submit the join action
- THEN they are recorded as a participant using that account, with no account-selection step required

#### Scenario: Multiple linked accounts require an explicit selection

- GIVEN a signed-in user with two linked Riot accounts
- WHEN they select one of the two and submit the join action
- THEN only the selected account is recorded as a participant

#### Scenario: Joining with an account owned by another user is refused

- GIVEN a join request naming a `riotAccountId` that belongs to a different user than the authenticated session
- WHEN the join action processes it
- THEN the join is refused and no participant row is created or changed

### Requirement: Idempotent, Duplicate-Free Join

Joining the same challenge with the same Riot account more than once MUST NOT create a duplicate participant row or otherwise change stored state; the second and later attempts MUST report an "already joined" outcome rather than an error.

#### Scenario: Joining twice leaves exactly one participant row

- GIVEN a Riot account that has already joined a challenge
- WHEN the same account submits the join action for that challenge again
- THEN exactly one participant row for that account and challenge exists, and the response reports "already joined"

### Requirement: Window-Gated Join

Joining a challenge whose window has ended (`now > endsAt`) MUST be refused, with the reason stated. Joining an upcoming or live challenge (`now <= endsAt`) MUST be allowed.

#### Scenario: Joining an ended challenge is refused

- GIVEN a challenge with `endsAt < now`
- WHEN a signed-in user with a linked Riot account attempts to join
- THEN the join is refused, the reason states the challenge has ended, and no participant row is created

#### Scenario: Joining an upcoming or live challenge succeeds

- GIVEN a challenge with `now <= endsAt`
- WHEN a signed-in user with a linked Riot account attempts to join
- THEN the join succeeds and a participant row is created

### Requirement: Inline Result Reporting

The result of a join attempt (success, already-joined, refused-ended, or a redirect reason) MUST be rendered inline on the page via the `useActionState` action-result pattern already used on `/account`, not via a toast, dialog, or tooltip (A13).

#### Scenario: Successful join shows an inline confirmation

- GIVEN a successful join action
- WHEN the page re-renders with the action's result
- THEN a confirmation message is shown inline on the page, with no toast or dialog

#### Scenario: Refused join shows an inline reason

- GIVEN a join action refused because the challenge has ended
- WHEN the page re-renders with the action's result
- THEN an inline message naming the reason is shown, with no toast or dialog

### Requirement: Automated End-to-End Coverage of Create-Then-Join

The create-then-join flow (a signed-in user creates a challenge, a second signed-in user joins it) MUST have automated end-to-end test coverage, exercised against `next dev`. Test authentication MUST use session-cookie injection in the Playwright fixture only; the shipped production code MUST NOT contain a test-only authentication provider or a test sign-in bypass route (A14).

#### Scenario: Create-then-join is covered by an automated test

- GIVEN the Playwright suite configured against `next dev`
- WHEN `pnpm test:e2e` runs the create-then-join spec
- THEN one session-cookie-injected user creates a challenge and a second session-cookie-injected user joins it, and the spec passes without any production authentication bypass route being invoked
