import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Checkbox } from "@/components/ui/checkbox";

describe("Checkbox", () => {
  it("renders a real <label htmlFor> linked to the input's id", () => {
    const html = renderToStaticMarkup(
      <Checkbox id="join" name="join" label="Join this challenge" />,
    );

    expect(html).toContain('<label for="join"');
    expect(html).toContain('id="join"');
    expect(html).toContain('type="checkbox"');
  });

  it("renders the label text", () => {
    const html = renderToStaticMarkup(
      <Checkbox id="join" name="join" label="Join this challenge" />,
    );

    expect(html).toContain("Join this challenge");
  });

  it("renders description text only when supplied", () => {
    const withDescription = renderToStaticMarkup(
      <Checkbox id="join" name="join" label="Join" description="Optional." />,
    );
    const withoutDescription = renderToStaticMarkup(
      <Checkbox id="join" name="join" label="Join" />,
    );

    expect(withDescription).toContain("Optional.");
    expect(withoutDescription).not.toContain("Optional.");
  });
});
