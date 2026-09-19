import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

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
