# Delta for Challenge Authoring

`openspec/specs/challenge-authoring/` does not exist yet — every requirement below is new.

## ADDED Requirements

### Requirement: Sign-In Required to Create a Challenge

The system MUST require an authenticated session to access `/challenges/new`. A visitor without an authenticated session MUST be redirected or shown a sign-in prompt instead of the create form.

#### Scenario: Signed-out visitor cannot reach the create form

- GIVEN a visitor with no authenticated session
- WHEN they navigate to `/challenges/new`
- THEN they are redirected or shown a sign-in prompt, and the rule builder is not rendered

#### Scenario: Signed-in user reaches the create form

- GIVEN a visitor with an authenticated session
- WHEN they navigate to `/challenges/new`
- THEN the create form, including the rule builder, is rendered

### Requirement: Challenge Fields and Window Validation

The system MUST collect a title, a window start (`startsAt`), a window end (`endsAt`), a visibility (`public` or `unlisted`), and one or more rules. The title MUST be non-empty after trimming. The window MUST satisfy `endsAt > startsAt`.

#### Scenario: Valid submission creates the challenge

- GIVEN a signed-in user fills in a non-empty title, `startsAt` before `endsAt`, a visibility, and at least one valid rule
- WHEN they submit the form
- THEN the challenge is created and stored with exactly the submitted title, window, visibility, and rules

#### Scenario: End before or equal to start is rejected

- GIVEN a signed-in user sets `endsAt` equal to or earlier than `startsAt`
- WHEN they submit the form
- THEN the submission is rejected and an error naming the window is shown, and no challenge is created

#### Scenario: Empty title is rejected

- GIVEN a signed-in user submits a title that is empty or only whitespace
- WHEN they submit the form
- THEN the submission is rejected and an error naming the title is shown, and no challenge is created

### Requirement: Rule Builder Structure and Caps

The rule builder MUST let the user construct 1 to 5 rules, each with a target of at least 1 and 0 to 4 criteria of kind `won`, `champion`, `role`, or `queue`. An empty criteria list on a rule means "play N games," matching the domain's semantics in `src/domain/rule.ts`.

These caps are UI-only — `parseRules` places no upper bound on rule or criteria count — and are chosen as follows: 5 rules is enough to combine every preset in this change plus manual additions without overwhelming a 390px form; 4 criteria per rule covers the richest realistic combination available today (`won` + `champion` + `role` + `queue`), so the cap never blocks a legitimate rule, only a degenerate one.

#### Scenario: Rule count is bounded between 1 and 5

- GIVEN a user has 5 rules in the builder
- WHEN they attempt to add a 6th rule
- THEN the add-rule control is disabled or the attempt is blocked, and the rule count stays at 5

#### Scenario: At least one rule is always required

- GIVEN a user has exactly 1 rule in the builder
- WHEN they attempt to remove it
- THEN the removal is blocked and at least 1 rule remains

#### Scenario: Criteria count per rule is bounded between 0 and 4

- GIVEN a rule in the builder has 4 criteria
- WHEN the user attempts to add a 5th criterion to that rule
- THEN the add-criterion control is disabled or the attempt is blocked for that rule

#### Scenario: Empty criteria produces a "play N games" rule

- GIVEN a user sets a rule's target to N and adds no criteria
- WHEN they submit the form
- THEN the stored rule has `target: N` and an empty `criteria` array

### Requirement: Preset Starting Points

Step 1 of the create form MUST offer the following presets, each pre-filling an editable rule in the builder:

1. **Win the match** — target 1, criteria `[{ kind: "won" }]`.
2. **Win N games with champion X** — target N, criteria `[{ kind: "won" }, { kind: "champion", champion: X }]`.
3. **Play N games** — target N, criteria `[]`.
4. **Win N ranked games as role R** — target N, criteria `[{ kind: "won" }, { kind: "role", role: R }, { kind: "queue", queue: "ranked-solo" }]`.

Presets are convenience only: selecting one pre-fills the builder with editable fields, and the resulting rule is validated by `parseRules` identically to a manually built rule. No separate stored shape exists for a preset-originated rule.

#### Scenario: Selecting a preset pre-fills an editable rule

- GIVEN a signed-in user on the create form
- WHEN they select the "win N games with champion X" preset
- THEN a rule appears in the builder pre-filled with `won` and `champion` criteria and an editable target and champion field

#### Scenario: Editing a preset-originated rule before submit

- GIVEN a user has selected a preset and then edits its target and champion fields
- WHEN they submit the form
- THEN the stored rule reflects the edited values, not the preset's original defaults

### Requirement: Creator's Optional Self-Join

The create form MUST let the creator choose whether to join their own challenge, using one of their linked Riot accounts. If the creator has more than one linked Riot account, the form MUST let them pick which one. If the creator has no linked Riot account, the self-join control MUST be unavailable, with an explanation, and challenge creation MUST still succeed without it.

#### Scenario: Creator with a linked account opts in

- GIVEN a signed-in creator with one linked Riot account who checks "join this challenge"
- WHEN they submit the form
- THEN the challenge is created and the creator appears as a participant using that Riot account

#### Scenario: Creator opts out

- GIVEN a signed-in creator with a linked Riot account who leaves "join this challenge" unchecked
- WHEN they submit the form
- THEN the challenge is created with zero participants

#### Scenario: Creator with multiple linked accounts picks one

- GIVEN a signed-in creator with two linked Riot accounts who opts in
- WHEN they select one of the two accounts and submit
- THEN the challenge is created and only the selected account appears as a participant

#### Scenario: Creator with no linked account cannot self-join

- GIVEN a signed-in creator with no linked Riot account
- WHEN they view the create form
- THEN the self-join control is unavailable with an explanation, and submitting the form without it still creates the challenge

### Requirement: Server-Side Rule Validation via parseRules

The system MUST validate the submitted rules server-side by calling `parseRules` on the serialized rules payload, and MUST NOT implement a second, parallel validation schema in the UI layer. When validation fails, the error MUST name the offending rule (for example, by its position in the list).

#### Scenario: Malformed rules payload is rejected with a named rule

- GIVEN a submission whose rules payload fails `parseRules` on its second rule (for example, a non-positive target)
- WHEN the server action processes it
- THEN the submission is rejected, no challenge is created, and the error identifies the second rule as invalid

#### Scenario: Zero rules is rejected

- GIVEN a submission with an empty rules list
- WHEN the server action processes it
- THEN the submission is rejected because `parseRules` requires at least one rule, and no challenge is created

### Requirement: Redirect to the Created Challenge

On successful creation, the system MUST redirect the user to the created challenge's page at `/challenges/[id]`.

#### Scenario: Successful creation redirects to the challenge page

- GIVEN a valid submission
- WHEN the challenge is created
- THEN the user is redirected to `/challenges/{id}` for the newly created challenge's id
