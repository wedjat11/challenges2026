# Archive Report: challenge-ui

**Change**: `challenge-ui` · **Archive Date**: 2026-09-28 · **Status**: Complete and archived  
**Store**: hybrid (artifacts in openspec/changes/archive/2026-09-28-challenge-ui/ + Engram observations)

## Summary

The `challenge-ui` change (T12, "Challenge UI on the Become a Legend design system") is fully implemented, verified, and archived. All 73 tasks across 8 stages (S0–S7) are checked complete in tasks.md. Delivery: 31 chained PRs (feature-branch-chain strategy), all open on GitHub. Verification: pnpm test (537 tests / 57 files passing), pnpm test:e2e (2 specs passing: mobile + desktop), pnpm typecheck/lint/build (all exit 0).

### Artifacts Persisted to Archive

#### Change Folder Contents
- **proposal.md** (present) — Archived; Engram observation #48
- **design.md** (present) — Archived; Engram observation #50  
- **tasks.md** (present, 73/73 tasks checked) — Archived; Engram observation #51
- **apply-progress.md** (present, 11/11 slices complete) — Archived; Engram observation #52
- **specs/** (5 delta specs, all synced to main specs)
  - challenge-authoring/spec.md → openspec/specs/challenge-authoring/spec.md
  - challenge-discovery/spec.md → openspec/specs/challenge-discovery/spec.md
  - challenge-participation/spec.md → openspec/specs/challenge-participation/spec.md
  - challenge-view/spec.md → openspec/specs/challenge-view/spec.md
  - design-system/spec.md → openspec/specs/design-system/spec.md
- **exploration.md** (present, reference) — Archived
- **research.md** (present, reference) — Archived
- **state.yaml** (present) — Archived

### Specs Synced to Main Specifications

Five new capability specifications were created in `openspec/specs/` from the delta specs (all `## ADDED Requirements`, no modifications or removals):

| Domain | Requirements | Action | Details |
|--------|---|--------|---------|
| design-system | 6 | Created | Design tokens, self-hosted fonts, vendored icons, dark-first theming, mobile-first responsive, UI primitives, header navigation, no gamification |
| challenge-authoring | 9 | Created | Sign-in required, challenge fields/window validation, rule builder (1–5 rules, 0–4 criteria per rule), preset starting points, optional self-join, server-side validation, redirect to created challenge |
| challenge-discovery | 5 | Created | Public read access, active public challenges only (window-gated listing), soonest-ending-first ordering, empty state, no gamification chrome |
| challenge-participation | 5 | Created | Sign-in + linked account required, account selection for multiple accounts, idempotent duplicate-free join, window-gated join, inline result reporting, automated e2e coverage (create-then-join), no test-only bypass routes |
| challenge-view | 8 | Created | Unauthenticated read access (including unlisted challenges), challenge summary + computed state (Upcoming/Live/Ended), rules rendered in words, per-participant progress from stored rows, freshness signal (last_polled_at), share URL affordance, not-found handling, no gamification |

**Total**: 34 new requirements across 5 new capability specs; 0 requirements modified or removed (all delta specs contained only ADDED sections).

### Delivery Status

**Chain Strategy**: Feature-branch-chain (each slice targets the previous PR; only first slice targets `feat/challenge-ui`)  
**PR Count**: 31 open PRs on GitHub (wedjat11/challenges2026)  
**Architecture**: S0 (design tokens + fonts + shell) → S1 (UI primitives) ↝ S2 (data layer) → S3a/S3b (domain logic) → S4a (rule builder) → S4b (create page) → S5a (browse) → S5b (view + join) → S6 (restyle) → S7 (e2e)  
**PR Tracker**: #5, #6 (S0), #7–#10 (S1), #11 (S2), #12–#14 (S3a), #15–#17 (S3b), #18–#19 (S4a), #20–#22 (S4b), #23–#24 (login, organic feature-chain insertion), #25–#26 (S5a), #27–#33 (S5b), #34 (S6), #35 (S7)  
**Size Exceptions Approved**: #16 (553 lines), #19 (454 lines), #21 (633 lines) · All under owner-accepted size:exception; whole-S5b exception was anticipated but not needed  
**Status**: All slices delivered; all PRs remain open (feature-branch-chain not yet merged to main)

### Verification at Close

**Test Execution** (verified at chain tip, commit feat/challenge-ui-s7-e2e):
- `pnpm test`: 537 tests across 57 files, all passing
- `pnpm test:e2e`: 2 specs passing (mobile viewport project + desktop viewport project, both `workers: 1` per Playwright config)
- `pnpm typecheck`: exit 0
- `pnpm lint`: exit 0
- `pnpm build`: exit 0 (10 routes compiled)

**Database State**:
- Local D1 seeded with test data (prefixed `seed-` for type fixture, `e2e-` for e2e harness)
- No production-code authentication bypass routes; Playwright fixture injects session cookies only

**Code Quality**:
- Dark theme enforced: `rg "dark:" src/` returns empty (no light-mode class selector in shipped code)
- Split components verified: `create-form.tsx` / `create-form-body.tsx` split (and same pattern for join + login) to work around Vitest `@/auth` import boundary
- `Button` / `IconButton`: no `onClick` prop (D8 design decision; interactive client components use plain buttons)
- `PlayerRow` divider prop and `StatTile` `<data value>` added for structural testability
- `deriveChallengeState` exported in `src/domain/challenge-state.ts`
- Two a11y fixes in S7: preset button accessible name + rule-target Input id

**Deviations Recorded** (factual, not scope-creep):
- S1 header glyphs resolved within S1d (no scope expansion; subslice completed)
- `buttonClassName` additive export from S3b's Button abstraction

### Deferred Work and Follow-Ups (NOT part of this change)

Per explicit final-state facts in archive launch prompt:
- **RuleBuilder concurrent-setState error**: `RuleBuilder` calls `onChange` inside its `useState` initialiser, producing React parent-setState-during-render warning on `/challenges/new`. Diagnosed but deferred as a React antipattern requiring refactoring beyond scope.
- **Unstyled not-found page**: `src/app/not-found.tsx` exists but is unstyled; will be styled in a separate change.
- **GameTag queue labels**: Component exists but labels are hardcoded placeholders (e.g., "Ranked Solo").
- **Login page follow-ups (F1–F4)**: Tracked in `odd/tasks/login-page.md`; outside `challenge-ui` scope.
- **Cascading FK audit (F2 finding)**: `progress` table cascading foreign key constraints flagged in earlier audit; separate deferred investigation.

**None of the above block archive or delivery. All were captured as documented design decisions or follow-up work, not missed requirements.**

### Observation IDs for Traceability

The following Engram observations were read and are recorded for full audit trail:

- **#48** — sdd/challenge-ui/proposal (Engram mirror of proposal.md)
- **#49** — sdd/challenge-ui/spec (Engram mirror of 5 delta specs, structured breakdown)
- **#50** — sdd/challenge-ui/design (Design rationale, D1–D18, Slice Map S0–S7, file changes)
- **#51** — sdd/challenge-ui/tasks (Task list mirror, 73 tasks)
- **#52** — sdd/challenge-ui/apply-progress (Slice-by-slice progress snapshot, 11/11 slices complete)

**No verify-report observation exists** (per native status: "verify-report locator: <unresolved>"). Archive records actual implementation and verification results per Final-State Authority hierarchy; intermediate snapshots are preserved for reference.

### Archive Structure

```
openspec/changes/archive/2026-09-28-challenge-ui/
├── proposal.md
├── design.md
├── tasks.md
├── apply-progress.md
├── exploration.md
├── research.md
├── state.yaml
├── specs/
│   ├── challenge-authoring/spec.md
│   ├── challenge-discovery/spec.md
│   ├── challenge-participation/spec.md
│   ├── challenge-view/spec.md
│   └── design-system/spec.md
└── archive-report.md (this file)
```

### Mechanical Verification Evidence

**Spec Sync**: All 5 delta specs copied to openspec/specs/{domain}/ with `cp -R` and verified byte-identical via diff -q ✓  
**Archive Move**: Source directory openspec/changes/challenge-ui moved via `git mv` to openspec/changes/archive/2026-09-28-challenge-ui, verified with recursive diff -r against pre-move snapshot ✓  
**Diff Output**: No differences between source snapshot and archived folder (empty diff is the only passing evidence per Mechanical Copy Contract) ✓

### Cycle Closed

- **Implementation**: All 73 tasks complete; 31 chained PRs delivered.
- **Verification**: 537 unit tests passing, 2 e2e specs passing, all build/lint/typecheck successful.
- **Specs**: 34 new requirements synced to main specifications.
- **Archive**: Mechanical integrity verified via diff -r; no bytes altered or truncated.
- **Future Reference**: Observers should consult this report and openspec/specs/ for final state; earlier snapshots (apply-progress.md, etc.) describe intermediate progress only and are preserved as historical record.

---

**Archived by**: sdd-archive executor (Haiku 4.5)  
**Archive date**: 2026-09-28  
**Repository**: /Users/jesusalfonsomontielperez/IdeaProjects/challenges (git remote: wedjat11/challenges2026)  
**Final commit**: docs/challenge-ui-archive (awaiting execution below)

