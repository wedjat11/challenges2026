/**
 * design-system: UI Primitives and Their States, No Gamification or Social
 * Surface. Reduced from the design export (D10) — `{ label, value, hint? }`
 * only, no delta/deltaTone/icon props.
 *
 * `value` renders inside a semantic `<data value>` element rather than a
 * plain `<span>`: it is the structural signal a test can assert on for the
 * "`value` in `font-mono tabular-nums`" requirement without pinning the
 * literal `tabular-nums` class string (strict-tdd's Implementation Detail
 * Coupling Rule).
 */

export type StatTileProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <p className="text-caption text-text-muted">{label}</p>
      <data value={String(value)} className="font-mono tabular-nums text-body font-medium text-text-primary">
        {value}
      </data>
      {hint ? <p className="text-caption text-text-faint">{hint}</p> : null}
    </div>
  );
}
