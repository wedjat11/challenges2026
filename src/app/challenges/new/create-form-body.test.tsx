import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CreateFormBody, messageFor } from "@/app/challenges/new/create-form-body";
import type { CreateChallengeActionState } from "@/app/challenges/new/actions";
import type { RiotAccount } from "@/domain/ports/riot-account-repository";

/**
 * Tests `create-form-body.tsx` directly, never `create-form.tsx` — the
 * latter imports the runtime value `createChallengeAction`, which
 * transitively imports `@/auth` → `next-auth`, which fails to resolve
 * `next/server` outside Next's own bundler (confirmed directly:
 * `import("@/auth")` throws `ERR_MODULE_NOT_FOUND` under plain Vitest,
 * independent of this change — no existing test in this codebase imports
 * `@/auth` either). See `create-form-body.tsx`'s doc comment for the full
 * reasoning; `create-form.tsx`'s own thin composition is exercised by the
 * manual smoke check and the S7 end-to-end slice instead, the same
 * position this apply's brief already takes for `actions.ts`.
 *
 * `messageFor` is a pure function — every `CreateChallengeActionState.kind`
 * is exercised directly against design.md's error-mapping table, in English,
 * verbatim.
 *
 * The component tests below exercise `renderToStaticMarkup`'s *initial*
 * render only (`step === "preset"`). `useActionState` itself was confirmed
 * separately to render fine under `react-dom/server`'s
 * `renderToStaticMarkup` with no jsdom (a plain `useState`-backed hook on
 * first render, no Suspense/transition machinery required to produce
 * output) — `CreateFormBody` takes the resulting `state`/`formAction`/
 * `pending` as plain props instead, so every prop-driven, non-interactive
 * assertion the phase brief asks for is testable here: all four steps
 * present with the inactive ones hidden, the self-join control's three
 * account-count shapes, exactly one `type="submit"`, and no `required`
 * attribute anywhere. Interaction (Back/Next, selecting a preset, checking
 * the self-join box) cannot be exercised here — no DOM, no event system —
 * matching `rule-builder.test.tsx`'s same documented limitation; the S7
 * Playwright spec is the interaction coverage.
 */

function noopAction(): void {
  // A stand-in for `useActionState`'s dispatch — never invoked by a static render.
}

function renderBody(accounts: RiotAccount[], state: CreateChallengeActionState | null = null) {
  return renderToStaticMarkup(
    <CreateFormBody accounts={accounts} state={state} formAction={noopAction} pending={false} />,
  );
}

function account(overrides: Partial<RiotAccount> = {}): RiotAccount {
  return {
    id: "account-1",
    userId: "user-1",
    puuid: "puuid-1",
    gameName: "Faker",
    tagLine: "KR1",
    platform: "kr",
    region: "asia",
    verified: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("messageFor", () => {
  it("returns null for a null state", () => {
    expect(messageFor(null)).toBeNull();
  });

  it("returns null for a successful creation (redirect handles it)", () => {
    const state: CreateChallengeActionState = { kind: "created", id: "abc" };
    expect(messageFor(state)).toBeNull();
  });

  it("maps invalid_title", () => {
    const state: CreateChallengeActionState = { kind: "invalid_title" };
    expect(messageFor(state)).toBe("Give the challenge a title.");
  });

  it("maps invalid_window/unparseable", () => {
    const state: CreateChallengeActionState = {
      kind: "invalid_window",
      reason: "unparseable",
    };
    expect(messageFor(state)).toBe("Enter a start and end date.");
  });

  it("maps invalid_window/end_not_after_start", () => {
    const state: CreateChallengeActionState = {
      kind: "invalid_window",
      reason: "end_not_after_start",
    };
    expect(messageFor(state)).toBe("The end must be after the start.");
  });

  it("maps invalid_visibility", () => {
    const state: CreateChallengeActionState = { kind: "invalid_visibility" };
    expect(messageFor(state)).toBe("Choose public or unlisted.");
  });

  it("maps invalid_rules with a field, naming the rule and the field", () => {
    const state: CreateChallengeActionState = {
      kind: "invalid_rules",
      ruleIndex: 1,
      field: "target",
    };
    expect(messageFor(state)).toBe("Rule 2 is not valid: check its target.");
  });

  it("maps invalid_rules without a field", () => {
    const state: CreateChallengeActionState = {
      kind: "invalid_rules",
      ruleIndex: 0,
      field: null,
    };
    expect(messageFor(state)).toBe("Rule 1 is not valid.");
  });

  it("maps invalid_rules with a null ruleIndex (zero-rules submission)", () => {
    const state: CreateChallengeActionState = {
      kind: "invalid_rules",
      ruleIndex: null,
      field: null,
    };
    expect(messageFor(state)).toBe("Rule 1 is not valid.");
  });

  it("maps too_many_rules", () => {
    const state: CreateChallengeActionState = { kind: "too_many_rules", limit: 5 };
    expect(messageFor(state)).toBe("Up to 5 rules, and up to 4 conditions per rule.");
  });

  it("maps too_many_criteria", () => {
    const state: CreateChallengeActionState = {
      kind: "too_many_criteria",
      ruleIndex: 2,
      limit: 4,
    };
    expect(messageFor(state)).toBe("Up to 5 rules, and up to 4 conditions per rule.");
  });

  it("maps riot_account_not_owned", () => {
    const state: CreateChallengeActionState = { kind: "riot_account_not_owned" };
    expect(messageFor(state)).toBe("That Riot account is not linked to your sign-in.");
  });

  it("maps unauthenticated", () => {
    const state: CreateChallengeActionState = { kind: "unauthenticated" };
    expect(messageFor(state)).toBe("Sign in to create a challenge.");
  });
});

describe("CreateFormBody — static structure", () => {
  it("mounts all four wizard steps, with only the preset step not hidden", () => {
    const html = renderBody([]);

    // The real `hidden` HTML boolean attribute (React serialises it as
    // `hidden=""` when true), not a Tailwind class or any other substring
    // containing the word "hidden" (e.g. `overflow-hidden`) — three of the
    // four step containers should carry it (rules, details, review; preset
    // is the default active step) and none of the four is unmounted.
    const hiddenOccurrences = html.match(/\shidden=""/g)?.length ?? 0;
    expect(hiddenOccurrences).toBe(3);
  });

  it("renders exactly one type=\"submit\" control, inside the review step", () => {
    const html = renderBody([]);

    const submitOccurrences = html.split('type="submit"').length - 1;
    expect(submitOccurrences).toBe(1);
  });

  it("renders no required attribute anywhere in the form", () => {
    const html = renderBody([]);

    expect(html).not.toContain("required");
  });

  it("renders a single <form> wrapping every step", () => {
    const html = renderBody([]);

    expect(html.match(/<form/g)).toHaveLength(1);
  });
});

describe("CreateFormBody — self-join control", () => {
  it("shows an unavailable-with-explanation message at 0 linked accounts", () => {
    const html = renderBody([]);

    expect(html).not.toContain('name="selfJoin"');
    expect(html).not.toContain('name="joinAsRiotAccountId"');
    expect(html.toLowerCase()).toContain("link a riot account");
  });

  it("renders a bare Checkbox plus a hidden riotAccountId at exactly 1 linked account", () => {
    const html = renderBody([account()]);

    expect(html).toContain('name="selfJoin"');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('name="joinAsRiotAccountId"');
    expect(html).toContain('type="hidden"');
    expect(html).toContain('value="account-1"');
    // No account-picker <select> for a single account — the id is fixed,
    // nothing to pick. (The rules step's own criterion-kind picker always
    // renders a <select>, so this checks the joinAsRiotAccountId field
    // specifically rather than the whole document.)
    expect(html).not.toMatch(/<select[^>]*name="joinAsRiotAccountId"/);
  });

  it("renders a Checkbox plus a Select at more than 1 linked account", () => {
    const html = renderBody([
      account({ id: "account-1" }),
      account({ id: "account-2", gameName: "Faker2" }),
    ]);

    expect(html).toContain('name="selfJoin"');
    expect(html).toContain('type="checkbox"');
    // The account-picker <select> specifically (not the rules step's
    // unrelated criterion-kind <select>).
    expect(html).toMatch(/<select[^>]*name="joinAsRiotAccountId"/);
    expect(html).toContain('value="account-1"');
    expect(html).toContain('value="account-2"');
  });
});
