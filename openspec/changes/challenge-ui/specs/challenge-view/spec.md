# Delta for Challenge View

`openspec/specs/challenge-view/` does not exist yet — every requirement below is new.

## ADDED Requirements

### Requirement: Unauthenticated Read Access, Including Unlisted

The system MUST make `/challenges/[id]` readable without an authenticated session, for both `public` and `unlisted` challenges reachable by their exact URL (A2). Unlisted-challenge security relies solely on the opacity of the challenge's UUID; the system MUST NOT expose an unlisted challenge through discovery or listing.

#### Scenario: Signed-out visitor reads a public challenge

- GIVEN a public challenge id
- WHEN a visitor with no authenticated session navigates to `/challenges/{id}`
- THEN the challenge page renders

#### Scenario: Signed-out visitor reads an unlisted challenge by its exact URL

- GIVEN an unlisted challenge id
- WHEN a visitor with no authenticated session navigates directly to `/challenges/{id}`
- THEN the challenge page renders

### Requirement: Challenge Summary and Computed State

The system MUST display the challenge's title and window (`startsAt`–`endsAt`), and MUST compute and display one state label: "Upcoming" when `now < startsAt`, "Live" when `startsAt <= now <= endsAt`, or "Ended" when `now > endsAt`.

#### Scenario: Upcoming challenge shows "Upcoming"

- GIVEN a challenge with `startsAt > now`
- WHEN the challenge page renders
- THEN the state label reads "Upcoming"

#### Scenario: Live challenge shows "Live"

- GIVEN a challenge with `startsAt <= now <= endsAt`
- WHEN the challenge page renders
- THEN the state label reads "Live"

#### Scenario: Ended challenge shows "Ended"

- GIVEN a challenge with `endsAt < now`
- WHEN the challenge page renders
- THEN the state label reads "Ended"

### Requirement: Rules Rendered in Words

The system MUST render every rule as a human-readable sentence composed from its target and criteria (for example, "Win 3 games as Ahri"), never as raw JSON or internal `kind` literals. A rule with no criteria MUST render as a plain play-count sentence (for example, "Play 20 games").

#### Scenario: Rule with won and champion criteria renders a combined sentence

- GIVEN a rule with `target: 3` and criteria `[{ kind: "won" }, { kind: "champion", champion: "Ahri" }]`
- WHEN the challenge page renders that rule
- THEN it displays as a sentence equivalent to "Win 3 games as Ahri"

#### Scenario: Rule with empty criteria renders as a play-count sentence

- GIVEN a rule with `target: 20` and an empty criteria list
- WHEN the challenge page renders that rule
- THEN it displays as a sentence equivalent to "Play 20 games"

### Requirement: Every Participant's Progress from Stored Rows

The system MUST display every participant of the challenge, not only the viewer, each with their per-rule progress (current, target, completed), sourced only from stored `progress` rows via the repository (A2). The view MUST NOT call `evaluate` or otherwise compute progress from raw match data in the UI layer; evaluation stays the polling pipeline's responsibility.

#### Scenario: Multiple participants each show their own progress

- GIVEN a challenge with two participants who each have stored progress rows
- WHEN the challenge page renders
- THEN both participants are listed, each with their own per-rule current/target/completed values, and neither is filtered to only the viewer

#### Scenario: Participant with no progress rows shows zero progress

- GIVEN a participant who has joined but has no stored progress rows yet
- WHEN the challenge page renders
- THEN that participant is listed with `current: 0` against each rule's target, not omitted and not shown as an error

### Requirement: Per-Participant Freshness Signal

The system MUST display a freshness label per participant reading "account last checked," sourced from `poll_state.last_polled_at` for that participant's Riot account puuid. This label MUST NOT be presented as a per-rule evaluation timestamp; it is per Riot account, not per rule (A12).

#### Scenario: Participant with a poll state shows the last-checked time

- GIVEN a participant whose Riot account has a `poll_state` row with a non-null `last_polled_at`
- WHEN the challenge page renders
- THEN that participant's row shows "account last checked" with that timestamp

#### Scenario: Participant never polled shows an explicit not-yet-checked state

- GIVEN a participant whose Riot account has no `poll_state` row, or one with a null `last_polled_at`
- WHEN the challenge page renders
- THEN that participant's row shows an explicit "not checked yet" state, not a blank field or an error

### Requirement: Share URL Affordance

The system MUST present the challenge's exact URL, or a control that copies or reveals it, so the page can be shared regardless of the visitor's authentication state.

#### Scenario: Share control exposes the exact challenge URL

- GIVEN any challenge page
- WHEN the visitor uses the share control
- THEN the exact `/challenges/{id}` URL is copied or revealed

### Requirement: Unknown Challenge Id Renders Not Found

The system MUST render a not-found response when the requested id does not resolve to a stored challenge.

#### Scenario: Unknown id renders not found

- GIVEN an id that does not correspond to any stored challenge
- WHEN a visitor navigates to `/challenges/{id}`
- THEN a not-found response is rendered, not a crash and not a blank page

### Requirement: No Gamification Rendering on the View Page

The challenge page MUST NOT render coin balances or wagers, tier badges, XP bars, a ranking or leaderboard module, friends, or notifications.

#### Scenario: No gamification element is present on the view page

- GIVEN any challenge page with one or more participants
- WHEN the page is inspected
- THEN no coin, tier, XP, ranking, friends, or notification element is present
