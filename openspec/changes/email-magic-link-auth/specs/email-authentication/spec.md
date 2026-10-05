# Email Authentication Specification

## Purpose

Passwordless email magic-link sign-in: email is the sole identity of record, replacing Discord OAuth. Covers email normalisation and identity, magic-link issue/consume semantics and TTL, enumeration-neutral request handling, per-address send throttling, unchanged JWT session identity, display-name derivation at first sign-in, the `/login` + `/login/check-email` + error-state surface, delivery content, Discord-removal completeness, the Auth.js adapter contract, and testing/rollback guarantees. No auth capability spec exists prior to this change (Discord auth predates SDD adoption in this project); this is a full new spec, not a delta.

## Requirements

### Requirement: Email as the Unique Account Identifier

The system MUST key each user account by a normalised email address that is unique across all users. Normalisation MUST apply NFKC normalization, trim leading/trailing whitespace, and lowercase the result, identically to the normalisation Auth.js's own token-issuance path applies to the identifier, so a stored email and an incoming identifier can never disagree. The system MUST NOT retain or read a `discord_id` column or any other Discord-derived identifier.

#### Scenario: Two case/whitespace variants of the same address resolve to one account

- GIVEN a user previously signed in with `Alice@Example.com`
- WHEN a sign-in request arrives for ` alice@example.com `
- THEN the system resolves it to the same stored account, not a second one

#### Scenario: No Discord identifier exists anywhere in the identity model

- GIVEN the current user schema and repository
- WHEN the identity model is inspected
- THEN no `discord_id` column, Discord identity type, or Discord-upsert method is present

### Requirement: Display Name Derivation at First Sign-In

On a user's first successful sign-in, the system MUST create the account with a `display_name` derived from the email's local part (the portion before `@`), truncated to at most 20 characters. If the derived value is empty or otherwise unusable, the system MUST fall back to `"Player"`. The system MUST NOT prompt the user for a display name at or around first sign-in in this change.

#### Scenario: Display name derived from a normal local part

- GIVEN an email address `diego.rivera@example.com` signing in for the first time
- WHEN the account is created
- THEN `display_name` is derived from `diego.rivera`, truncated to at most 20 characters

#### Scenario: Degenerate local part falls back to "Player"

- GIVEN an email address whose local part yields no usable display text after derivation
- WHEN the account is created
- THEN `display_name` is set to `"Player"`

#### Scenario: Second sign-in with the same address reuses the existing account

- GIVEN an email address that already has an account with a stored `display_name`
- WHEN that address signs in again
- THEN no second account is created, the same account's `id` and `created_at` are preserved, and `display_name` is not re-derived or changed

### Requirement: Magic-Link Request Enumeration Neutrality

For any syntactically valid email address submitted at the sign-in form, the system MUST respond identically — same redirect target, same page, same copy — regardless of whether that address is registered, unregistered, or currently throttled. The response MUST NOT reveal, through timing, copy, or redirect differences, whether a given address has an account.

#### Scenario: Registered and unregistered addresses produce the same response

- GIVEN two syntactically valid email addresses, one registered and one never seen before
- WHEN each is submitted to the sign-in form in turn
- THEN both requests redirect to the same check-your-inbox page with identical copy

#### Scenario: A throttled address also produces the same response

- GIVEN an address that has already hit its send throttle
- WHEN that address is submitted again
- THEN the response is the same check-your-inbox redirect and copy as a non-throttled request, with no indication that sending was skipped

### Requirement: Magic-Link Token Single-Use and TTL

Each issued magic-link token MUST be valid for exactly 15 minutes from issuance and MUST be redeemable exactly once. Consuming a token MUST atomically invalidate it so that a second consumption attempt with the same token fails.

#### Scenario: A link consumed within the TTL signs the user in

- GIVEN a magic-link token issued less than 15 minutes ago that has not yet been consumed
- WHEN the link is opened
- THEN the user is signed in and lands on `/account`

#### Scenario: A link consumed twice fails the second time

- GIVEN a magic-link token that has already been successfully consumed once
- WHEN the same link is opened again
- THEN the second attempt is rejected and does not sign the user in

#### Scenario: A link opened after 15 minutes is rejected

- GIVEN a magic-link token issued more than 15 minutes ago that was never consumed
- WHEN the link is opened
- THEN the attempt is rejected and does not sign the user in

### Requirement: Concurrent Link Requests Do Not Invalidate Each Other

Requesting a second magic link for the same address MUST NOT invalidate a still-valid, previously issued link for that same address. Each issued token remains valid independently until its own expiry or its own consumption.

#### Scenario: The first link still works after a second request

- GIVEN an address that requested a magic link and then requested a second magic link before using the first
- WHEN the first link (still within its TTL and unconsumed) is opened
- THEN the user is signed in successfully

### Requirement: Expired or Already-Used Link Messaging

Opening an expired or already-consumed magic link MUST land the visitor on `/login` with messaging stating the link has expired or was already used, and inviting them to request a new one. This MUST NOT be presented as a generic or unrelated error.

#### Scenario: Expired link shows the expired/used message

- GIVEN a magic link whose TTL has elapsed
- WHEN the visitor opens it
- THEN `/login` renders a message stating the link expired or was already used, with a way to request a new one

#### Scenario: Already-used link shows the same expired/used message

- GIVEN a magic link that was already successfully consumed once
- WHEN the visitor opens it again
- THEN `/login` renders the same expired-or-already-used message as the TTL-expiry case

### Requirement: Mangled Link and Server Misconfiguration Share One Message

A magic link opened with its token missing or malformed, and a sign-in attempt failing due to server-side sign-in misconfiguration, MUST render the same single message on `/login`, because the system has no reliable signal to distinguish the two cases. The message MUST invite the visitor to request a new link and MUST state that a persistent failure is not the visitor's fault.

#### Scenario: A link with a stripped token renders the shared message

- GIVEN a magic link URL with its token query parameter removed or corrupted
- WHEN the visitor opens it
- THEN `/login` renders the shared configuration/mangled-link message, not a bare error and not a different message than the misconfiguration case

#### Scenario: A server-side sign-in misconfiguration renders the same shared message

- GIVEN a sign-in attempt that fails due to a server-side sign-in configuration problem
- WHEN the visitor is routed to `/login`
- THEN the rendered message is the same as the mangled-link case

### Requirement: Magic-Link Email Delivery Content and Channel

The system MUST send the magic-link email through the configured HTTP email provider, using the configured sender address as the `From` header. The email MUST include both a plain-text and an HTML part, each containing the sign-in link exactly once and stating the link's expiry duration in minutes.

#### Scenario: A sign-in request sends an email from the configured sender

- GIVEN a valid, non-throttled sign-in request for a syntactically valid address
- WHEN the request is processed
- THEN an email is sent via the configured HTTP provider with the `From` header set to the configured sender address

#### Scenario: Email contains both text and HTML parts with the link and expiry

- GIVEN a sent magic-link email
- WHEN its content is inspected
- THEN both the plain-text and HTML parts contain the sign-in URL exactly once and state the link's expiry in minutes

### Requirement: No Token Leakage in Logs

The system MUST NOT write the magic-link URL or its token to any log, error message, or shipped console output, under any configuration state including a missing or invalid provider API key.

#### Scenario: A misconfigured provider does not log the link

- GIVEN the email provider is unconfigured or misconfigured
- WHEN a sign-in request is processed and the send fails
- THEN no log entry, error message, or console output contains the magic-link URL or token

#### Scenario: A successful send does not log the link

- GIVEN a successful sign-in request and email send
- WHEN the request completes
- THEN no log entry or console output contains the magic-link URL or token

### Requirement: Per-Address Send Throttling

The system MUST limit magic-link sends to at most one per email address per 60 seconds, and at most five per email address per rolling hour. When a request for an address would exceed either limit, the system MUST skip sending the email and MUST persist the throttle state, while still returning the enumeration-neutral success response to the requester.

#### Scenario: A second request within 60 seconds is throttled

- GIVEN an address that successfully triggered a send less than 60 seconds ago
- WHEN that address submits another sign-in request
- THEN no second email is sent, the throttle state is updated, and the visible response is unchanged from a successful request

#### Scenario: A sixth request within a rolling hour is throttled

- GIVEN an address that has already triggered five sends within the current rolling hour, each spaced more than 60 seconds apart
- WHEN that address submits a sixth sign-in request within the same rolling hour
- THEN no sixth email is sent, and the visible response is unchanged from a successful request

#### Scenario: Exactly one email is sent for two rapid submissions

- GIVEN an address with no prior sends
- WHEN that address submits two sign-in requests within 60 seconds of each other
- THEN exactly one email is sent in total

#### Scenario: Throttle state survives across requests

- GIVEN an address that has been throttled
- WHEN a new request for the same address is evaluated
- THEN the throttle decision is based on persisted state from the prior request, not reset to a fresh state

### Requirement: Session Identity Unchanged

The system MUST continue to use JWT-strategy sessions with no session persistence table. `session.user.id` MUST carry the internal user id, and the signed JWT's `sub` claim MUST also carry that same internal user id. No existing session consumer's contract changes as a result of this capability.

#### Scenario: session.user.id is the internal user id after email sign-in

- GIVEN a user who signed in via a magic link
- WHEN their session is read by any consumer
- THEN `session.user.id` equals that user's internal `users.id`

#### Scenario: JWT sub claim matches the internal user id

- GIVEN a signed-in user's JWT
- WHEN the token's `sub` claim is inspected
- THEN it equals the same internal `users.id` as `session.user.id`

### Requirement: Return Path Honoured Through safeReturnPath

The sign-in flow MUST re-validate any client-supplied return path server-side using the existing same-origin relative-path validation before using it as a post-sign-in redirect target. A validated return path MUST be honoured after successful sign-in; an invalid or hostile return path MUST be dropped in favor of the default destination.

#### Scenario: A valid return path survives the full round trip

- GIVEN a sign-in request initiated with `?from=/challenges/new`
- WHEN sign-in completes successfully
- THEN the user is redirected to `/challenges/new`

#### Scenario: A hostile return path is dropped

- GIVEN a sign-in request initiated with a non-same-origin or malformed `from` value such as `//evil.com`
- WHEN sign-in completes successfully
- THEN the user is not redirected to that value; the default destination is used instead

### Requirement: Signed-In Visitor Redirected Away From /login

A visitor who already has an authenticated session MUST be redirected to `/account` when they navigate to `/login`, rather than being shown the sign-in form again.

#### Scenario: Signed-in visitor hitting /login is redirected

- GIVEN a visitor with an authenticated session
- WHEN they navigate to `/login`
- THEN they are redirected to `/account` and the sign-in form is not rendered

### Requirement: /login Email Sign-In Form

`/login` MUST render an email sign-in form consisting of an uncontrolled `email` input with `type="email"`, a hidden field carrying the validated return path, and a primary call-to-action that requests a sign-in link. The form MUST NOT reference Discord or any OAuth provider.

#### Scenario: The email form renders with the required fields

- GIVEN a signed-out visitor navigating to `/login`
- WHEN the page renders
- THEN an input with `type="email"` and `name="email"` is present, a hidden field carrying the return path is present, and the primary call-to-action requests a sign-in link

#### Scenario: Submitting a valid email redirects to the check-inbox page

- GIVEN the `/login` email form
- WHEN a visitor submits a syntactically valid email address
- THEN they are taken to the check-your-inbox page

### Requirement: /login/check-email Generic Confirmation Page

The system MUST provide a dedicated `/login/check-email` route rendered after any sign-in request, with generic copy that does not state or imply whether the submitted address is registered, and with a link back to `/login`.

#### Scenario: The check-email page renders generic copy

- GIVEN a visitor who just submitted a sign-in request
- WHEN `/login/check-email` renders
- THEN its copy does not name or confirm the submitted address and does not indicate whether the address is registered

#### Scenario: The check-email page links back to /login

- GIVEN the `/login/check-email` page
- WHEN the visitor looks for a way back
- THEN a link back to `/login` is present

### Requirement: Login Error State Copy

`/login` MUST render distinct, provider-neutral error copy for each of: an expired-or-used link, a failed email send, a mangled link or server misconfiguration (merged, per the dedicated requirement above), an access-denied address, and an unrecognised error code falling back to a generic message. No error copy MUST mention Discord.

#### Scenario: Each known error code renders its own copy

- GIVEN each of the known error codes in turn
- WHEN `/login` renders with that error code
- THEN the rendered title and body match that code's designated copy, and none of them mention Discord

#### Scenario: An unrecognised error code renders the generic fallback

- GIVEN an error code not in the known set
- WHEN `/login` renders with that code
- THEN the generic fallback message is shown instead of a crash or a blank error state

### Requirement: Design-System Compliance for Login Screens

`/login` and `/login/check-email` MUST render correctly at a 390px viewport as the primary breakpoint and MUST restate their layout exactly once at a desktop breakpoint of approximately 1200px, using only design-system token utilities (no hardcoded colors or spacing), with a visible focus ring on the email field and the shared `Input` error-state styling used for field-level errors.

#### Scenario: 390px renders without overlap or horizontal scroll

- GIVEN `/login` or `/login/check-email`
- WHEN the viewport is set to 390px wide
- THEN all content is reachable without horizontal scrolling and no interactive element is clipped or overlapped

#### Scenario: Desktop restatement at ~1200px

- GIVEN `/login` or `/login/check-email`
- WHEN the viewport is set to a desktop width of approximately 1200px
- THEN the layout restates using the desktop variant, with no intermediate tablet-specific layout applied

#### Scenario: Email field shows a visible focus ring

- GIVEN the `/login` email form
- WHEN the email field is reached via keyboard navigation
- THEN a visible, token-defined focus ring is rendered on it

### Requirement: Discord Removal Completeness

No Discord provider, Discord environment variable, Discord-referencing copy, or Discord-specific identity code MUST remain anywhere in the shipped application code, tests, environment examples, or project configuration after this change.

#### Scenario: No Discord reference remains in source or config

- GIVEN the complete shipped codebase after this change
- WHEN it is searched case-insensitively for the string "discord"
- THEN no match is found in application source, tests, end-to-end fixtures, environment examples, or project configuration

### Requirement: Legal Pages State Email Identity and Email Processor

`/terms` and `/privacy` MUST state that email address is the account identifier collected at sign-in, and MUST name the configured email-sending provider as the processor that receives that address to deliver sign-in links. Neither page MUST reference Discord.

#### Scenario: Privacy page names email as the collected identifier

- GIVEN `/privacy`
- WHEN the page renders
- THEN it states that an email address is collected as the account identifier and names the email provider as a processor of that address

#### Scenario: Terms page contains no Discord reference

- GIVEN `/terms`
- WHEN the page renders
- THEN it does not reference Discord and is consistent with email being the sign-in identifier

### Requirement: Auth.js Adapter Contract — Exactly Six Methods

The custom Auth.js adapter MUST expose exactly the six adapter methods the email-plus-JWT sign-in path calls: `createVerificationToken`, `useVerificationToken`, `getUserByEmail`, `createUser`, `updateUser`, and `getUser`. A unit test MUST assert that all six are present on the adapter object and are functions, independent of any database or HTTP dependency.

#### Scenario: The adapter contract test passes with all six methods present

- GIVEN the adapter object as constructed in production configuration
- WHEN the adapter contract test runs
- THEN it passes, confirming all six required methods exist and are callable

#### Scenario: Removing a required method fails the contract test

- GIVEN the adapter object with one of the six required methods removed
- WHEN the adapter contract test runs
- THEN it fails, naming the missing method

### Requirement: No Test-Only Sign-In Bypass

The shipped production code MUST NOT contain a test-only authentication provider or a test-only sign-in bypass route. End-to-end tests MUST continue to authenticate by injecting a session cookie directly in the test fixture, never by exercising a production bypass.

#### Scenario: No bypass route exists in shipped code

- GIVEN the complete shipped application routes and providers
- WHEN they are inspected
- THEN no test-only authentication provider or bypass route is present

#### Scenario: End-to-end tests authenticate via fixture cookie injection

- GIVEN the end-to-end test suite
- WHEN a test needs an authenticated session
- THEN it mints the session cookie directly in the fixture rather than invoking any production sign-in bypass

### Requirement: Manual Verification Plan Recorded

Because the real magic-link round trip requires a live inbox and this project forbids a test-only sign-in bypass, a written manual verification plan covering the end-to-end sign-in flow, repeat sign-in, link reuse, link expiry, throttling, enumeration neutrality, and return-path handling MUST be recorded in the change folder.

#### Scenario: The manual verification plan is recorded and covers the required cases

- GIVEN the change folder for this capability
- WHEN the manual verification plan document is inspected
- THEN it includes steps covering a first sign-in, a repeat sign-in, a reused link, an expired link, send throttling, enumeration neutrality for an unregistered address, and return-path handling

### Requirement: Rollback Is Free Until the Identity Schema Migration Merges

Reverting any part of this capability MUST remain a zero-impact operation — no data loss, no stranded state — for as long as the `users` table identity-column migration (dropping the legacy identifier column and introducing the email columns) has not yet been applied to a database with real user rows. Once that migration has been applied against real user data, this guarantee no longer holds and rollback requires a forward migration instead.

#### Scenario: Rollback before the identity migration is lossless

- GIVEN none of the identity-column migration has been applied to a database containing real user rows
- WHEN any slice of this capability is reverted
- THEN no existing data is lost and no user-visible state is stranded

#### Scenario: Rollback after the identity migration requires a forward migration

- GIVEN the identity-column migration has been applied to a database containing real user rows
- WHEN a rollback of the identity change is needed
- THEN it is performed via a new forward migration, not a destructive revert, because the applied migration cannot be undone in place
