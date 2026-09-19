import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Radio } from "@/components/ui/radio";

describe("Radio", () => {
  it("renders a real <label htmlFor> linked to the input's id", () => {
    const html = renderToStaticMarkup(
      <Radio id="visibility-public" name="visibility" value="public" label="Public" />,
    );

    expect(html).toContain('<label for="visibility-public"');
    expect(html).toContain('id="visibility-public"');
    expect(html).toContain('type="radio"');
  });

  it("renders the label text", () => {
    const html = renderToStaticMarkup(
      <Radio id="visibility-public" name="visibility" value="public" label="Public" />,
    );

    expect(html).toContain("Public");
  });

  it("renders description text only when supplied", () => {
    const withDescription = renderToStaticMarkup(
      <Radio
        id="visibility-unlisted"
        name="visibility"
        value="unlisted"
        label="Unlisted"
        description="Only people with the link can find it."
      />,
    );
    const withoutDescription = renderToStaticMarkup(
      <Radio id="visibility-unlisted" name="visibility" value="unlisted" label="Unlisted" />,
    );

    expect(withDescription).toContain("Only people with the link can find it.");
    expect(withoutDescription).not.toContain("Only people with the link can find it.");
  });
});
