import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button, buttonClassName } from "@/components/ui/button";

/** Pulls the rendered `class="..."` attribute out of a static-render html string. */
function classAttribute(html: string): string | undefined {
  return html.match(/class="([^"]*)"/)?.[1];
}

describe("Button", () => {
  it("forces disabled and aria-busy, and renders the loader glyph, when loading", () => {
    const html = renderToStaticMarkup(<Button loading>Submit</Button>);

    expect(html).toContain("disabled=\"\"");
    expect(html).toContain('aria-busy="true"');
    // loader-circle's own path data (paths.ts) — proves the spinner glyph, not
    // just any icon, is the one rendered while loading.
    expect(html).toContain('d="M21 12a9 9 0 1 1-6.219-8.56"');
  });

  it("does not force aria-busy or the loader glyph when not loading", () => {
    const html = renderToStaticMarkup(<Button>Submit</Button>);

    expect(html).not.toContain("aria-busy");
    expect(html).not.toContain('d="M21 12a9 9 0 1 1-6.219-8.56"');
  });

  it("renders the disabled attribute, non-interactive, when disabled is passed directly", () => {
    const html = renderToStaticMarkup(<Button disabled>Submit</Button>);

    expect(html).toContain("disabled=\"\"");
  });

  it("renders different markup for different variants", () => {
    const primary = renderToStaticMarkup(<Button variant="primary">Go</Button>);
    const outline = renderToStaticMarkup(<Button variant="outline">Go</Button>);

    expect(primary).not.toBe(outline);
  });

  it("renders different markup for different sizes", () => {
    const sm = renderToStaticMarkup(<Button size="sm">Go</Button>);
    const lg = renderToStaticMarkup(<Button size="lg">Go</Button>);

    expect(sm).not.toBe(lg);
  });

  it("renders the leading icon before children and the trailing icon after", () => {
    const html = renderToStaticMarkup(
      <Button icon="plus" iconAfter="arrow-right">
        Create
      </Button>,
    );
    const plusIndex = html.indexOf('d="M5 12h14"');
    const createIndex = html.indexOf("Create");
    const arrowIndex = html.lastIndexOf('d="M5 12h14"');

    expect(plusIndex).toBeGreaterThan(-1);
    expect(createIndex).toBeGreaterThan(plusIndex);
    // arrow-right's own second path ("m12 5 7 7-7 7") comes after the label.
    expect(html.indexOf('d="m12 5 7 7-7 7"')).toBeGreaterThan(createIndex);
    expect(arrowIndex).toBeGreaterThanOrEqual(plusIndex);
  });

  it("spreads DOM attributes such as type and name, and exposes no onClick prop in its type", () => {
    const html = renderToStaticMarkup(
      <Button type="submit" name="confirm">
        Confirm
      </Button>,
    );

    expect(html).toContain('type="submit"');
    expect(html).toContain('name="confirm"');
  });

  it("renders a full-width button differently from a default-width one", () => {
    const normal = renderToStaticMarkup(<Button>Go</Button>);
    const full = renderToStaticMarkup(<Button fullWidth>Go</Button>);

    expect(normal).not.toBe(full);
  });
});

describe("buttonClassName", () => {
  // These primitives ship without a `Link`-flavoured variant, but a caller
  // that needs an `<a>` styled identically to `Button` (e.g. the browse
  // page's empty-state CTA, which must not nest a `<button>` inside an
  // `<a>`) needs a class list that is provably identical to what `Button`
  // itself renders for the same variant/size/fullWidth — not a hand-copied
  // duplicate that can drift.
  it("matches Button's own rendered class list for the default variant and size", () => {
    const html = renderToStaticMarkup(<Button>Go</Button>);
    expect(buttonClassName()).toBe(classAttribute(html));
  });

  it("matches Button's own rendered class list for a non-default variant and size", () => {
    const html = renderToStaticMarkup(
      <Button variant="outline" size="lg">
        Go
      </Button>,
    );
    expect(buttonClassName({ variant: "outline", size: "lg" })).toBe(classAttribute(html));
  });

  it("matches Button's own rendered class list when fullWidth is set", () => {
    const html = renderToStaticMarkup(<Button fullWidth>Go</Button>);
    expect(buttonClassName({ fullWidth: true })).toBe(classAttribute(html));
  });

  it("appends a caller-supplied className, matching Button's own merge behaviour", () => {
    const html = renderToStaticMarkup(<Button className="mt-4">Go</Button>);
    expect(buttonClassName({ className: "mt-4" })).toBe(classAttribute(html));
  });
});
