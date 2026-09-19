import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GameTag } from "@/components/ui/game-tag";

describe("GameTag", () => {
  it("renders the full game name by default", () => {
    const html = renderToStaticMarkup(<GameTag />);

    expect(html).toContain("League of Legends");
  });

  it("renders the short game name when short is true", () => {
    const html = renderToStaticMarkup(<GameTag short />);

    expect(html).toContain("LoL");
    expect(html).not.toContain("League of Legends");
  });

  it("renders the queue value when supplied, typed from the domain Queue union", () => {
    const html = renderToStaticMarkup(<GameTag queue="ranked-solo" />);

    expect(html).toContain("ranked-solo");
  });

  it("renders no queue text when queue is omitted", () => {
    const html = renderToStaticMarkup(<GameTag />);

    expect(html).not.toContain("ranked");
  });
});
