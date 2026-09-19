import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders a real <label htmlFor> linked to the input's id", () => {
    const html = renderToStaticMarkup(<Input id="title" name="title" label="Title" />);

    expect(html).toContain('<label for="title"');
    expect(html).toContain('id="title"');
  });

  it("renders the hint text when no error is present", () => {
    const html = renderToStaticMarkup(
      <Input id="title" name="title" label="Title" hint="Keep it short." />,
    );

    expect(html).toContain("Keep it short.");
  });

  it("wires aria-invalid, aria-describedby, the error message and the alert glyph when error is set", () => {
    const html = renderToStaticMarkup(
      <Input id="title" name="title" label="Title" error="Title is required." />,
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="title-error"');
    expect(html).toContain('id="title-error"');
    expect(html).toContain("Title is required.");
    // circle-alert's own path data
    expect(html).toContain('cx="12" cy="12" r="10"');
  });

  it("renders no aria-invalid and no error id when there is no error", () => {
    const html = renderToStaticMarkup(<Input id="title" name="title" label="Title" />);

    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain('id="title-error"');
  });

  it("derives the describedby id from name when id is absent", () => {
    const html = renderToStaticMarkup(<Input name="title" label="Title" error="Required" />);

    expect(html).toContain('aria-describedby="title-error"');
  });
});
