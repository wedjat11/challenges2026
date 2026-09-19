import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Tag } from "@/components/ui/tag";

describe("Tag", () => {
  it("renders its children text", () => {
    const html = renderToStaticMarkup(<Tag>Jungle</Tag>);

    expect(html).toContain("Jungle");
  });

  it("renders a remove control only when removable is true", () => {
    const removable = renderToStaticMarkup(<Tag removable>Jungle</Tag>);
    const plain = renderToStaticMarkup(<Tag>Jungle</Tag>);

    expect(removable).toContain("<button");
    expect(plain).not.toContain("<button");
  });

  it("renders with no error and no onRemove call site required when removable is false", () => {
    // A server component may render Tag without onRemove — proves the prop
    // is genuinely optional, not just typed optional.
    expect(() => renderToStaticMarkup(<Tag>Jungle</Tag>)).not.toThrow();
  });

  it("renders selected and unselected tags with different markup", () => {
    const selected = renderToStaticMarkup(<Tag selected>Jungle</Tag>);
    const unselected = renderToStaticMarkup(<Tag>Jungle</Tag>);

    expect(selected).not.toBe(unselected);
  });

  it("renders the remove control with an accessible name", () => {
    const html = renderToStaticMarkup(<Tag removable onRemove={() => {}}>Jungle</Tag>);

    expect(html).toContain("aria-label");
  });
});
