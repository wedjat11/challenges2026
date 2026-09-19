"use client";

import { useState } from "react";

import { Icon } from "@/components/icons/icon";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { QUEUE_LABELS, QUEUES, ROLE_LABELS, ROLES, type Queue, type Role } from "@/domain/match";
import type { Criterion, Rule } from "@/domain/rule";
import { ruleToSentence } from "@/domain/rule-text";

/**
 * challenge-authoring: Rule Builder Structure and Caps.
 *
 * This is the first client component in the change (D8 keeps every S1
 * primitive server-renderable; this file is the boundary that actually needs
 * `useState`). Draft state, not form state: the draft lives in
 * `useState<Rule[]>`, seeded once from `initialRules`, and the only channel
 * back to the server is the hidden `rulesJson` field (D13) — no other input
 * in this subtree carries a `name` attribute.
 *
 * Composition contract for S4b: `create-form.tsx`'s `preset` step builds a
 * rule via `RULE_PRESETS[i].build(args)`, wraps it in an array, and passes
 * that array as `initialRules` here — the wizard step description in
 * design.md calls this "one rule appended to the draft". Because this
 * component only ever *reads* `initialRules` on mount, the caller MUST
 * remount it (e.g. `<RuleBuilder key={selectedPresetId} initialRules={...} />`)
 * whenever the preset selection changes; without a `key` change, React
 * reuses the existing instance and the new `initialRules` is silently
 * ignored, per `useState`'s documented "only used on the first render"
 * behaviour.
 *
 * `Button`/`IconButton` are deliberately not used for add/remove here: D8
 * drops their `onClick` prop entirely because every other consumer drives
 * them through a form submission or a server action, not client state. The
 * add/remove controls below mutate local state, not a form, so they are
 * plain `<button>` elements styled with the same theme utility vocabulary
 * (no arbitrary values, no inline styles) rather than reopening D8 for one
 * client subtree.
 */

const MAX_RULES = 5;
const MIN_RULES = 1;
const MAX_CRITERIA = 4;
const CRITERION_KINDS = ["won", "champion", "role", "queue"] as const;

const SECONDARY_BUTTON_CLASSES = cn(
  "inline-flex h-10 items-center justify-center gap-2 rounded-control px-4 font-body text-body font-medium",
  "bg-action-secondary text-action-secondary-fg transition-colors hover:bg-action-secondary-hover",
  "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-38",
);

const GHOST_ICON_BUTTON_CLASSES = cn(
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control transition-colors",
  "bg-transparent text-action-ghost-fg hover:bg-surface-2",
  "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-38",
);

const CRITERION_KIND_LABELS: Record<Criterion["kind"], string> = {
  won: "Won",
  champion: "Champion",
  role: "Role",
  queue: "Queue",
};

export type InvalidRule = { ruleIndex: number; field: string | null };

export type RuleBuilderProps = {
  /** Seeds the draft on mount only — see the composition contract above. */
  initialRules: Rule[];
  /** Marks one rule's target `Input` as invalid, per D14's server error naming. */
  invalidRule?: InvalidRule | null;
};

function criterionLabel(criterion: Criterion): string {
  switch (criterion.kind) {
    case "won":
      return "Won";
    case "champion":
      return criterion.champion;
    case "role":
      return ROLE_LABELS[criterion.role];
    case "queue":
      return QUEUE_LABELS[criterion.queue];
  }
}

function buildCriterion(kind: Criterion["kind"], champion: string, role: Role, queue: Queue): Criterion {
  switch (kind) {
    case "won":
      return { kind: "won" };
    case "champion":
      return { kind: "champion", champion };
    case "role":
      return { kind: "role", role };
    case "queue":
      return { kind: "queue", queue };
  }
}

export function RuleBuilder({ initialRules, invalidRule = null }: RuleBuilderProps) {
  const [rules, setRules] = useState<Rule[]>(initialRules);

  function addRule() {
    setRules((current) =>
      current.length >= MAX_RULES ? current : [...current, { target: 1, criteria: [] }],
    );
  }

  function removeRule(ruleIndex: number) {
    setRules((current) =>
      current.length <= MIN_RULES ? current : current.filter((_, index) => index !== ruleIndex),
    );
  }

  function updateTarget(ruleIndex: number, target: number) {
    setRules((current) =>
      current.map((rule, index) => (index === ruleIndex ? { ...rule, target } : rule)),
    );
  }

  function addCriterion(ruleIndex: number, criterion: Criterion) {
    setRules((current) =>
      current.map((rule, index) => {
        if (index !== ruleIndex) return rule;
        if (rule.criteria.length >= MAX_CRITERIA) return rule;
        // A rule cannot have two criteria of the same kind — two "champion"
        // criteria would ask a match to have been played on two different
        // champions at once, which no match ever satisfies.
        if (rule.criteria.some((existing) => existing.kind === criterion.kind)) return rule;
        return { ...rule, criteria: [...rule.criteria, criterion] };
      }),
    );
  }

  function removeCriterion(ruleIndex: number, criterionIndex: number) {
    setRules((current) =>
      current.map((rule, index) =>
        index === ruleIndex
          ? { ...rule, criteria: rule.criteria.filter((_, ci) => ci !== criterionIndex) }
          : rule,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="rulesJson" value={JSON.stringify(rules)} />
      {rules.map((rule, ruleIndex) => (
        <RuleEditor
          key={ruleIndex}
          rule={rule}
          ruleIndex={ruleIndex}
          canRemove={rules.length > MIN_RULES}
          invalidField={invalidRule?.ruleIndex === ruleIndex ? invalidRule.field : undefined}
          isInvalid={invalidRule?.ruleIndex === ruleIndex}
          onTargetChange={(target) => updateTarget(ruleIndex, target)}
          onAddCriterion={(criterion) => addCriterion(ruleIndex, criterion)}
          onRemoveCriterion={(criterionIndex) => removeCriterion(ruleIndex, criterionIndex)}
          onRemoveRule={() => removeRule(ruleIndex)}
        />
      ))}
      <button
        type="button"
        className={SECONDARY_BUTTON_CLASSES}
        onClick={addRule}
        disabled={rules.length >= MAX_RULES}
      >
        <Icon name="plus" />
        Add rule
      </button>
    </div>
  );
}

function RuleEditor({
  rule,
  ruleIndex,
  canRemove,
  invalidField,
  isInvalid,
  onTargetChange,
  onAddCriterion,
  onRemoveCriterion,
  onRemoveRule,
}: {
  rule: Rule;
  ruleIndex: number;
  canRemove: boolean;
  invalidField: string | null | undefined;
  isInvalid: boolean | undefined;
  onTargetChange: (target: number) => void;
  onAddCriterion: (criterion: Criterion) => void;
  onRemoveCriterion: (criterionIndex: number) => void;
  onRemoveRule: () => void;
}) {
  const errorMessage = isInvalid
    ? invalidField
      ? `Check its ${invalidField}.`
      : "This rule is not valid."
    : undefined;

  return (
    <Card as="article" padding="md" className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <Input
          label={`Rule ${ruleIndex + 1} target`}
          type="number"
          min={1}
          defaultValue={rule.target}
          onChange={(event) => onTargetChange(Number(event.target.value))}
          error={errorMessage}
        />
        <button
          type="button"
          aria-label={`Remove rule ${ruleIndex + 1}`}
          className={GHOST_ICON_BUTTON_CLASSES}
          onClick={onRemoveRule}
          disabled={!canRemove}
        >
          <Icon name="x" />
        </button>
      </div>
      <p className="text-body-sm text-text-secondary">{ruleToSentence(rule)}</p>
      <div className="flex flex-wrap gap-1.5">
        {rule.criteria.map((criterion, criterionIndex) => (
          <Tag key={criterionIndex} removable onRemove={() => onRemoveCriterion(criterionIndex)}>
            {criterionLabel(criterion)}
          </Tag>
        ))}
      </div>
      <CriterionPicker
        ruleIndex={ruleIndex}
        criteria={rule.criteria}
        onAdd={onAddCriterion}
      />
    </Card>
  );
}

/**
 * One control for adding a criterion: pick a kind, supply that kind's value
 * (champion: text; role/queue: Select; won: no extra value — "Add" toggles it
 * straight in), then add. Kept as a single add-criterion control, not four
 * separate ones, so "disabled at 4 criteria" (challenge-authoring: Rule
 * Builder Structure and Caps) names one unambiguous element; already-present
 * kinds are dropped from the picker so a duplicate kind is never offered.
 */
function CriterionPicker({
  ruleIndex,
  criteria,
  onAdd,
}: {
  ruleIndex: number;
  criteria: Criterion[];
  onAdd: (criterion: Criterion) => void;
}) {
  const [champion, setChampion] = useState("");
  const [role, setRole] = useState<Role>(ROLES[0]);
  const [queue, setQueue] = useState<Queue>(QUEUES[0]);

  const existingKinds = new Set(criteria.map((criterion) => criterion.kind));
  const availableKinds = CRITERION_KINDS.filter((kind) => !existingKinds.has(kind));
  const atCap = criteria.length >= MAX_CRITERIA;
  const [kind, setKind] = useState<Criterion["kind"]>(availableKinds[0] ?? "won");
  const selectedKind = availableKinds.includes(kind) ? kind : (availableKinds[0] ?? kind);
  const disabled = atCap || availableKinds.length === 0;

  function handleAdd() {
    if (disabled) return;
    const trimmedChampion = champion.trim();
    if (selectedKind === "champion" && trimmedChampion.length === 0) return;
    onAdd(buildCriterion(selectedKind, trimmedChampion, role, queue));
    setChampion("");
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        label="Criterion"
        id={`rule-${ruleIndex}-criterion-kind`}
        value={selectedKind}
        onChange={(event) => setKind(event.target.value as Criterion["kind"])}
        options={availableKinds.map((availableKind) => ({
          value: availableKind,
          label: CRITERION_KIND_LABELS[availableKind],
        }))}
        disabled={disabled}
      />
      {selectedKind === "champion" ? (
        <Input
          label="Champion"
          id={`rule-${ruleIndex}-criterion-champion`}
          value={champion}
          onChange={(event) => setChampion(event.target.value)}
          disabled={disabled}
        />
      ) : selectedKind === "role" ? (
        <Select
          label="Role"
          id={`rule-${ruleIndex}-criterion-role`}
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          options={ROLES.map((availableRole) => ({ value: availableRole, label: ROLE_LABELS[availableRole] }))}
          disabled={disabled}
        />
      ) : selectedKind === "queue" ? (
        <Select
          label="Queue"
          id={`rule-${ruleIndex}-criterion-queue`}
          value={queue}
          onChange={(event) => setQueue(event.target.value as Queue)}
          options={QUEUES.map((availableQueue) => ({ value: availableQueue, label: QUEUE_LABELS[availableQueue] }))}
          disabled={disabled}
        />
      ) : null}
      <button type="button" className={SECONDARY_BUTTON_CLASSES} onClick={handleAdd} disabled={disabled}>
        <Icon name="plus" />
        Add criterion
      </button>
    </div>
  );
}
