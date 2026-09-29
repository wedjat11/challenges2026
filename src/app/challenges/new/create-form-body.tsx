"use client";

import { useState } from "react";

import type { CreateChallengeActionState } from "@/app/challenges/new/actions";
import { RuleBuilder, type InvalidRule } from "@/app/challenges/new/rule-builder";
import { Icon } from "@/components/icons/icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { RULE_PRESETS } from "@/domain/rule-presets";
import type { Rule } from "@/domain/rule";
import { rulesToSentences } from "@/domain/rule-text";
import type { RiotAccount } from "@/domain/ports/riot-account-repository";

/**
 * `/challenges/new`'s wizard body — everything structural and testable,
 * split out of `create-form.tsx` (which stays the file design.md's File
 * Changes table names) for exactly one reason: `create-form.tsx` imports
 * the runtime value `createChallengeAction` from `./actions`, and ES module
 * imports evaluate eagerly at load time regardless of what a caller
 * actually uses. `./actions` transitively imports `@/auth`, and `@/auth`
 * transitively imports `next-auth`, which fails to resolve `next/server`
 * under plain Vitest (confirmed directly — `import("@/auth")` throws
 * `ERR_MODULE_NOT_FOUND` outside Next's own bundler, independent of this
 * change; no existing test in this codebase imports `@/auth` either).
 * Splitting the *value* import into its own thin file is the only way to
 * make the structural/self-join/`messageFor` logic importable by a test at
 * all — same-file "isolated exports" cannot work here, since importing
 * *any* named export from `create-form.tsx` would still execute its
 * top-level `import { createChallengeAction } ...` statement.
 *
 * challenge-authoring: Challenge Fields and Window Validation, Preset
 * Starting Points, Creator's Optional Self-Join, Server-Side Rule
 * Validation via parseRules. See design.md §8's wizard state machine table
 * and "One form, all steps mounted".
 *
 * **One `<form action={formAction}>`, all four steps mounted.** Inactive
 * steps carry the `hidden` attribute rather than being unmounted, so
 * `FormData` always carries every field on submit and Back never loses
 * input (D9's uncontrolled-primitives principle holds: no field is
 * `required`, the server action is the only validator). No `type="submit"`
 * exists outside the `review` step.
 *
 * **Fields other than the rule builder stay uncontrolled in the primitive
 * sense** (no `value`/`checked` prop is ever passed back down — only
 * `defaultValue`/`defaultChecked`), matching D9. This component adds a
 * lightweight `onChange` *listener* on each field purely to mirror its
 * current value into local state for the `review` step's read-back
 * preview; that mirror never gates or re-validates submission — the raw
 * DOM `name`s are still what `FormData` carries, and `createChallengeAction`
 * remains the only validator. This is the "simplest correct approach"
 * documented for previewing an otherwise-unreadable uncontrolled draft (see
 * `rule-builder.tsx`'s S4b addition doc comment for the rules half of this
 * same problem).
 */

type Step = "preset" | "rules" | "details" | "review";
const STEPS: Step[] = ["preset", "rules", "details", "review"];

const SCRATCH_PRESET_ID = "scratch";
const SCRATCH_DEFAULT_TARGET = 1;

const SECONDARY_BUTTON_CLASSES = cn(
  "inline-flex h-10 items-center justify-center gap-2 rounded-control px-4 font-body text-body font-medium",
  "bg-action-secondary text-action-secondary-fg transition-colors hover:bg-action-secondary-hover",
  "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-38",
);

const PRIMARY_BUTTON_CLASSES = cn(
  "inline-flex h-10 items-center justify-center gap-2 rounded-control px-4 font-body text-body font-medium",
  "bg-action-primary text-action-primary-fg transition-colors hover:bg-action-primary-hover active:bg-action-primary-active",
  "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-38",
);

/**
 * A human message per action-state `kind`, in English, verbatim from
 * design.md's error-mapping table. `null` state (nothing submitted yet) and
 * `created` (the action redirects before this ever renders) both yield
 * `null` — there is nothing to show.
 */
export function messageFor(state: CreateChallengeActionState | null): string | null {
  if (!state) return null;

  switch (state.kind) {
    case "created":
      return null;
    case "invalid_title":
      return "Give the challenge a title.";
    case "invalid_window":
      return state.reason === "unparseable"
        ? "Enter a start and end date."
        : "The end must be after the start.";
    case "invalid_visibility":
      return "Choose public or unlisted.";
    case "invalid_rules":
      return `Rule ${(state.ruleIndex ?? 0) + 1} is not valid${
        state.field ? `: check its ${state.field}` : ""
      }.`;
    case "too_many_rules":
    case "too_many_criteria":
      return "Up to 5 rules, and up to 4 conditions per rule.";
    case "riot_account_not_owned":
      return "That Riot account is not linked to your sign-in.";
    case "unauthenticated":
      return "Sign in to create a challenge.";
  }
}

/** The one rule a preset (or "start from scratch") seeds the builder with. */
function rulesForPreset(presetId: string): Rule[] {
  const preset = RULE_PRESETS.find((candidate) => candidate.id === presetId);
  return preset ? [preset.build({})] : [{ target: SCRATCH_DEFAULT_TARGET, criteria: [] }];
}

type Details = {
  title: string;
  startsAt: string;
  endsAt: string;
  visibility: "public" | "unlisted";
  selfJoin: boolean;
  joinAsRiotAccountId: string;
};

function initialDetails(accounts: RiotAccount[]): Details {
  return {
    title: "",
    startsAt: "",
    endsAt: "",
    visibility: "public",
    selfJoin: false,
    joinAsRiotAccountId: accounts[0]?.id ?? "",
  };
}

export type CreateFormBodyProps = {
  accounts: RiotAccount[];
  state: CreateChallengeActionState | null;
  formAction: (formData: FormData) => void;
  pending: boolean;
};

export function CreateFormBody({ accounts, state, formAction, pending }: CreateFormBodyProps) {
  const [step, setStep] = useState<Step>("preset");
  const [presetId, setPresetId] = useState<string>(SCRATCH_PRESET_ID);
  const [rulesDraft, setRulesDraft] = useState<Rule[]>(() => rulesForPreset(SCRATCH_PRESET_ID));
  const [details, setDetails] = useState<Details>(() => initialDetails(accounts));
  // Tracks the action `state` this component last reacted to, so a fresh
  // `invalid_rules` result can jump the step machine back to `rules`
  // *during render* (React's documented "adjusting state when a prop
  // changes" pattern — https://react.dev/learn/you-might-not-need-an-effect)
  // rather than in a `useEffect`, which the lint rule
  // `react-hooks/set-state-in-effect` flags because calling `setStep`
  // synchronously inside an effect body causes an extra cascading render.
  const [reactedToState, setReactedToState] = useState<CreateChallengeActionState | null>(state);

  const stepIndex = STEPS.indexOf(step);
  const message = messageFor(state);

  const invalidRule: InvalidRule | null =
    state?.kind === "invalid_rules" && state.ruleIndex !== null
      ? { ruleIndex: state.ruleIndex, field: state.field }
      : null;

  if (state !== reactedToState) {
    setReactedToState(state);
    // The review step has no target `Input` to mark invalid, so only a
    // rules-shaped rejection needs to jump the step machine back.
    if (state?.kind === "invalid_rules") setStep("rules");
  }

  function goBack() {
    setStep(STEPS[Math.max(stepIndex - 1, 0)] ?? step);
  }

  function goNext() {
    setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)] ?? step);
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {message ? (
        <p role="status" className="text-body-sm text-red-500">
          {message}
        </p>
      ) : null}

      <div hidden={step !== "preset"} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {RULE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="text-left"
              onClick={() => setPresetId(preset.id)}
            >
              <Card padding="md" interactive accentEdge={presetId === preset.id}>
                <p className="text-body font-medium text-text-primary">{preset.label}</p>
                <p className="mt-1 text-body-sm text-text-secondary">{preset.description}</p>
              </Card>
            </button>
          ))}
          <button
            type="button"
            className="text-left"
            onClick={() => setPresetId(SCRATCH_PRESET_ID)}
          >
            <Card padding="md" interactive accentEdge={presetId === SCRATCH_PRESET_ID}>
              <p className="text-body font-medium text-text-primary">Start from scratch</p>
              <p className="mt-1 text-body-sm text-text-secondary">
                Build a custom rule with no starting point.
              </p>
            </Card>
          </button>
        </div>
        <div className="flex items-center justify-end">
          <button type="button" className={PRIMARY_BUTTON_CLASSES} onClick={goNext}>
            Next
            <Icon name="arrow-right" />
          </button>
        </div>
      </div>

      <div hidden={step !== "rules"} className="flex flex-col gap-4">
        <RuleBuilder
          key={presetId}
          initialRules={rulesForPreset(presetId)}
          invalidRule={invalidRule}
          onChange={setRulesDraft}
        />
        <div className="flex items-center justify-between gap-3">
          <button type="button" className={SECONDARY_BUTTON_CLASSES} onClick={goBack}>
            <Icon name="arrow-left" />
            Back
          </button>
          <button type="button" className={PRIMARY_BUTTON_CLASSES} onClick={goNext}>
            Next
            <Icon name="arrow-right" />
          </button>
        </div>
      </div>

      <div hidden={step !== "details"} className="flex flex-col gap-4">
        <Input
          label="Title"
          name="title"
          defaultValue={details.title}
          onChange={(event) => setDetails((current) => ({ ...current, title: event.target.value }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Starts"
            type="datetime-local"
            name="startsAt"
            defaultValue={details.startsAt}
            onChange={(event) =>
              setDetails((current) => ({ ...current, startsAt: event.target.value }))
            }
          />
          <Input
            label="Ends"
            type="datetime-local"
            name="endsAt"
            defaultValue={details.endsAt}
            onChange={(event) =>
              setDetails((current) => ({ ...current, endsAt: event.target.value }))
            }
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-sm font-medium text-text-secondary">Visibility</legend>
          <Radio
            label="Public"
            name="visibility"
            value="public"
            defaultChecked
            onChange={() => setDetails((current) => ({ ...current, visibility: "public" }))}
          />
          <Radio
            label="Unlisted"
            name="visibility"
            value="unlisted"
            onChange={() => setDetails((current) => ({ ...current, visibility: "unlisted" }))}
          />
        </fieldset>
        <SelfJoinControl
          accounts={accounts}
          onToggle={(selfJoin) => setDetails((current) => ({ ...current, selfJoin }))}
          onAccountChange={(joinAsRiotAccountId) =>
            setDetails((current) => ({ ...current, joinAsRiotAccountId }))
          }
        />
        <div className="flex items-center justify-between gap-3">
          <button type="button" className={SECONDARY_BUTTON_CLASSES} onClick={goBack}>
            <Icon name="arrow-left" />
            Back
          </button>
          <button type="button" className={PRIMARY_BUTTON_CLASSES} onClick={goNext}>
            Next
            <Icon name="arrow-right" />
          </button>
        </div>
      </div>

      <div hidden={step !== "review"} className="flex flex-col gap-4">
        <div>
          <h2 className="text-body font-medium text-text-primary">Rules</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {rulesToSentences(rulesDraft).map((sentence, index) => (
              <li key={index} className="text-body-sm text-text-secondary">
                {sentence}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-1 text-body-sm text-text-secondary">
          <p>Starts: {details.startsAt || "not set"}</p>
          <p>Ends: {details.endsAt || "not set"}</p>
          <p>Visibility: {details.visibility === "public" ? "Public" : "Unlisted"}</p>
          <p>
            {details.selfJoin
              ? "You will join this challenge."
              : "You will not join this challenge."}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" className={SECONDARY_BUTTON_CLASSES} onClick={goBack}>
            <Icon name="arrow-left" />
            Back
          </button>
          <Button type="submit" loading={pending}>
            Create challenge
          </Button>
        </div>
      </div>
    </form>
  );
}

/**
 * The self-join control's three shapes (A5 + challenge-authoring: Creator's
 * Optional Self-Join): unavailable with an explanation at 0 linked
 * accounts; a bare `Checkbox` plus a hidden `riotAccountId` at exactly 1;
 * a `Checkbox` plus a `Select` at more than 1.
 */
function SelfJoinControl({
  accounts,
  onToggle,
  onAccountChange,
}: {
  accounts: RiotAccount[];
  onToggle: (selfJoin: boolean) => void;
  onAccountChange: (riotAccountId: string) => void;
}) {
  if (accounts.length === 0) {
    return (
      <p className="text-body-sm text-text-muted">
        Link a Riot account on your account page to join your own challenge.
      </p>
    );
  }

  // `accounts[0]` is possibly `undefined` under `noUncheckedIndexedAccess`
  // even though both `length` checks above already guarantee an element —
  // TypeScript cannot narrow a plain array's index type from `.length`.
  const firstAccount = accounts[0];

  if (accounts.length === 1 && firstAccount) {
    return (
      <div className="flex flex-col gap-2">
        <Checkbox
          label="Join this challenge"
          name="selfJoin"
          onChange={(event) => onToggle(event.target.checked)}
        />
        <input type="hidden" name="joinAsRiotAccountId" value={firstAccount.id} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        label="Join this challenge"
        name="selfJoin"
        onChange={(event) => onToggle(event.target.checked)}
      />
      <Select
        label="Join as"
        name="joinAsRiotAccountId"
        defaultValue={firstAccount?.id}
        onChange={(event) => onAccountChange(event.target.value)}
        options={accounts.map((account) => ({
          value: account.id,
          label: `${account.gameName}#${account.tagLine}`,
        }))}
      />
    </div>
  );
}
