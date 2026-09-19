import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RuleBuilder } from "@/app/challenges/new/rule-builder";
import type { Rule } from "@/domain/rule";

/**
 * These tests exercise props-driven rendering only. Strict TDD's assertion-
 * quality rules ban asserting a literal Tailwind class, so every check below
 * targets a real DOM-observable signal (a `disabled` attribute, `aria-*`,
 * visible text, or the hidden field's value) instead.
 *
 * `RuleBuilder` is a client component (`useState`); clicking add/remove
 * cannot be exercised here — `renderToStaticMarkup` runs the render function
 * once against `initialRules` with no DOM and no event system, so only the
 * *initial* render given a prop combination is provable at this layer. The
 * S7 Playwright spec is the interaction coverage.
 */

/**
 * Extracts one `<button>` element's full markup — attributes included —
 * given a needle that appears anywhere inside it (an `aria-label` attribute
 * or visible text). Deliberately does not close the opening tag before
 * searching, so a needle inside the attribute list still matches.
 */
function buttonMarkup(html: string, needle: string): string {
  const pattern = new RegExp(`<button(?:(?!</button>).)*?${needle}(?:(?!</button>).)*?</button>`, "s");
  const match = html.match(pattern);
  if (!match) throw new Error(`no <button> containing "${needle}" found in:\n${html}`);
  return match[0];
}

/**
 * The real `disabled` HTML attribute, not Tailwind's `disabled:opacity-38`
 * class name — a plain `.toContain("disabled")` would false-positive on
 * every button's class list.
 */
function isDisabledButton(buttonHtml: string): boolean {
  return /\sdisabled=""/.test(buttonHtml);
}

const fiveRules: Rule[] = Array.from({ length: 5 }, () => ({ target: 1, criteria: [] }));
const oneRule: Rule[] = [{ target: 5, criteria: [] }];
const ruleWithFourCriteria: Rule[] = [
  {
    target: 10,
    criteria: [
      { kind: "won" },
      { kind: "champion", champion: "Ahri" },
      { kind: "role", role: "jungle" },
      { kind: "queue", queue: "ranked-solo" },
    ],
  },
];
const playTenGames: Rule[] = [{ target: 10, criteria: [] }];

describe("RuleBuilder", () => {
  it("disables the add-rule control once 5 rules are present", () => {
    const html = renderToStaticMarkup(<RuleBuilder initialRules={fiveRules} />);

    expect(isDisabledButton(buttonMarkup(html, "Add rule"))).toBe(true);
  });

  it("keeps the add-rule control enabled below 5 rules", () => {
    const html = renderToStaticMarkup(<RuleBuilder initialRules={oneRule} />);

    expect(isDisabledButton(buttonMarkup(html, "Add rule"))).toBe(false);
  });

  it("disables the remove-rule control when exactly 1 rule remains", () => {
    const html = renderToStaticMarkup(<RuleBuilder initialRules={oneRule} />);

    expect(isDisabledButton(buttonMarkup(html, 'aria-label="Remove rule 1"'))).toBe(true);
  });

  it("keeps the remove-rule control enabled when more than 1 rule remains", () => {
    const html = renderToStaticMarkup(<RuleBuilder initialRules={fiveRules} />);

    expect(isDisabledButton(buttonMarkup(html, 'aria-label="Remove rule 1"'))).toBe(false);
  });

  it("disables that rule's add-criterion control once it has 4 criteria", () => {
    const html = renderToStaticMarkup(<RuleBuilder initialRules={ruleWithFourCriteria} />);

    expect(isDisabledButton(buttonMarkup(html, "Add criterion"))).toBe(true);
  });

  it("keeps the add-criterion control enabled below 4 criteria", () => {
    const html = renderToStaticMarkup(<RuleBuilder initialRules={oneRule} />);

    expect(isDisabledButton(buttonMarkup(html, "Add criterion"))).toBe(false);
  });

  it("renders a rule with 0 criteria as a plain 'play N games' rule", () => {
    const html = renderToStaticMarkup(<RuleBuilder initialRules={playTenGames} />);

    // Real behavioural signal, not a smoke test: the sentence and the hidden
    // JSON payload both come from production logic (ruleToSentence /
    // JSON.stringify), not from static markup coincidentally matching.
    expect(html).toContain("Play 10 games");
    expect(html).toContain('&quot;criteria&quot;:[]');
  });

  it("renders exactly one hidden rulesJson input carrying JSON.stringify(initialRules)", () => {
    const html = renderToStaticMarkup(<RuleBuilder initialRules={ruleWithFourCriteria} />);
    const expected = JSON.stringify(ruleWithFourCriteria).replace(/"/g, "&quot;");

    const occurrences = html.split('name="rulesJson"').length - 1;
    expect(occurrences).toBe(1);
    expect(html).toContain('type="hidden"');
    expect(html).toContain(`value="${expected}"`);
  });

  it("marks the target Input of the named rule as invalid when invalidRule targets it", () => {
    const html = renderToStaticMarkup(
      <RuleBuilder initialRules={oneRule} invalidRule={{ ruleIndex: 0, field: "target" }} />,
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("target");
  });

  it("renders no aria-invalid on the target Input when invalidRule is absent", () => {
    const html = renderToStaticMarkup(<RuleBuilder initialRules={oneRule} />);

    expect(html).not.toContain("aria-invalid");
  });
});
