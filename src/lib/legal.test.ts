import { describe, expect, it } from "vitest";

import { OPERATOR, RIOT_DISCLAIMER, unresolvedPlaceholders } from "@/lib/legal";

describe("Riot disclaimer", () => {
  // Riot's developer policy requires this wording to be visible on the product.
  // These assertions exist so a careless edit breaks the build rather than
  // silently breaking compliance and the production key application with it.
  it("states the product is not endorsed by Riot Games", () => {
    expect(RIOT_DISCLAIMER).toContain("isn't endorsed by Riot Games");
  });

  it("disclaims representing Riot's views", () => {
    expect(RIOT_DISCLAIMER).toContain(
      "doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties",
    );
  });

  it("acknowledges Riot's trademarks", () => {
    expect(RIOT_DISCLAIMER).toContain("trademarks or registered trademarks of Riot Games, Inc");
  });
});

describe("operator details", () => {
  it("reports every detail still left as a placeholder", () => {
    // Publishing a privacy policy with an invented contact address would be
    // worse than publishing none, so unset values are announced rather than
    // guessed. Riot reviews these pages before granting a production key.
    const pending = unresolvedPlaceholders();
    for (const field of pending) {
      expect(OPERATOR[field]).toContain("TO BE COMPLETED");
    }
  });

  it("finds nothing pending once the details are filled in", () => {
    expect(unresolvedPlaceholders({ ...OPERATOR, contactEmail: "hi@example.com" })).not.toContain(
      "contactEmail",
    );
  });
});
