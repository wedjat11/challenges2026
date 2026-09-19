# Delta for Challenge Discovery

`openspec/specs/challenge-discovery/` does not exist yet — every requirement below is new.

## ADDED Requirements

### Requirement: Public Read Access

The system MUST make `/challenges` readable without an authenticated session.

#### Scenario: Signed-out visitor can browse

- GIVEN a visitor with no authenticated session
- WHEN they navigate to `/challenges`
- THEN the list of active public challenges renders without requiring sign-in

### Requirement: Listing Scope — Active Public Challenges Only

The system MUST list only challenges whose `visibility` is `public` and whose window `[startsAt, endsAt]` contains the current time (A7). The system MUST exclude every `unlisted` challenge unconditionally, and MUST exclude a `public` challenge whose window has not yet started or has already ended.

#### Scenario: Active public challenge appears

- GIVEN a public challenge with `startsAt <= now <= endsAt`
- WHEN `/challenges` is rendered
- THEN that challenge appears in the list

#### Scenario: Unlisted challenge never appears

- GIVEN an unlisted challenge with `startsAt <= now <= endsAt`
- WHEN `/challenges` is rendered
- THEN that challenge does not appear in the list, regardless of its window

#### Scenario: Ended public challenge does not appear

- GIVEN a public challenge with `endsAt < now`
- WHEN `/challenges` is rendered
- THEN that challenge does not appear in the list

#### Scenario: Not-yet-started public challenge does not appear

- GIVEN a public challenge with `startsAt > now`
- WHEN `/challenges` is rendered
- THEN that challenge does not appear in the list

### Requirement: Ordering — Soonest-Ending First

The system MUST order the listed challenges by `endsAt` ascending, so the challenge with the least time remaining appears first. Ties on `endsAt` MUST break deterministically by challenge `id` ascending.

This ordering is chosen because the list's purpose is surfacing challenges a visitor can still join and complete; soonest-ending-first surfaces the most time-sensitive opportunities first. Newest-first would instead bury a nearly-finished challenge under a freshly created one with a long window.

#### Scenario: Two active challenges are ordered by remaining time

- GIVEN two active public challenges, A ending sooner than B
- WHEN `/challenges` is rendered
- THEN A appears before B in the list

#### Scenario: Tied end times break by id

- GIVEN two active public challenges with the same `endsAt`
- WHEN `/challenges` is rendered
- THEN they appear in ascending order of their `id`

### Requirement: Empty State

When there are zero active public challenges, the system MUST render the designed empty state instead of an error or a blank list, including a call to action linking to `/challenges/new`.

#### Scenario: No active challenges shows the empty state

- GIVEN there are no public challenges whose window contains now
- WHEN `/challenges` is rendered
- THEN the empty state is shown with a link to `/challenges/new`, and no error is shown

### Requirement: No Gamification Chrome on the Browse List

The browse list MUST NOT render a coin or XP header chip, streak or coin stat tiles, a "ranking entre amigos" module, or a sender/recipient tab split (`Para mí` / `Enviados` / `Historial`). The list is a flat set of active public challenges.

#### Scenario: No gamification chrome is present

- GIVEN `/challenges` is rendered with one or more active public challenges
- WHEN the page is inspected
- THEN no coin, XP, streak, ranking, or tab-split element is present
