import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Select } from "@/components/ui/select";

const OPTIONS = [
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted" },
];

describe("Select", () => {
  it("renders every option with its value and label", () => {
    const html = renderToStaticMarkup(
      <Select id="visibility" name="visibility" label="Visibility" options={OPTIONS} />,
    );

    expect(html).toContain('value="public"');
    expect(html).toContain(">Public<");
    expect(html).toContain('value="unlisted"');
    expect(html).toContain(">Unlisted<");
  });

  it("renders exactly as many <option> elements as were given", () => {
    const html = renderToStaticMarkup(
      <Select id="visibility" name="visibility" label="Visibility" options={OPTIONS} />,
    );
    const optionCount = (html.match(/<option/g) ?? []).length;

    expect(optionCount).toBe(2);
  });

  it("renders the chevron-down glyph", () => {
    const html = renderToStaticMarkup(
      <Select id="visibility" name="visibility" label="Visibility" options={OPTIONS} />,
    );

    // chevron-down's own path data
    expect(html).toContain('d="m6 9 6 6 6-6"');
  });

  it("wires aria-invalid and aria-describedby like Input when error is set", () => {
    const html = renderToStaticMarkup(
      <Select
        id="visibility"
        name="visibility"
        label="Visibility"
        options={OPTIONS}
        error="Pick a visibility."
      />,
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="visibility-error"');
    expect(html).toContain("Pick a visibility.");
  });

  it("renders a real <label htmlFor> linked to the select's id", () => {
    const html = renderToStaticMarkup(
      <Select id="visibility" name="visibility" label="Visibility" options={OPTIONS} />,
    );

    expect(html).toContain('<label for="visibility"');
  });
});
