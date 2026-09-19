import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Card } from "@/components/ui/card";

describe("Card", () => {
  it("renders a <div> by default", () => {
    const html = renderToStaticMarkup(<Card>Body</Card>);

    expect(html).toContain("<div");
    expect(html).not.toContain("<article");
    expect(html).not.toContain("<li");
  });

  it("renders the element named by `as`", () => {
    const article = renderToStaticMarkup(<Card as="article">Body</Card>);
    const li = renderToStaticMarkup(<Card as="li">Body</Card>);

    expect(article).toContain("<article");
    expect(li).toContain("<li");
  });

  it("renders interactive cards with different markup than static ones", () => {
    const staticCard = renderToStaticMarkup(<Card>Body</Card>);
    const interactive = renderToStaticMarkup(<Card interactive>Body</Card>);

    expect(staticCard).not.toBe(interactive);
  });

  it("renders accent-edge cards with different markup than plain ones", () => {
    const plain = renderToStaticMarkup(<Card>Body</Card>);
    const accented = renderToStaticMarkup(<Card accentEdge>Body</Card>);

    expect(plain).not.toBe(accented);
  });

  it("renders its children", () => {
    const html = renderToStaticMarkup(<Card>Challenge summary</Card>);

    expect(html).toContain("Challenge summary");
  });
});
