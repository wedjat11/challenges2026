import { describe, expect, it } from "vitest";

import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins truthy class names with a single space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy entries so conditional classes compose cleanly", () => {
    expect(cn("a", false, undefined, null, "", "b")).toBe("a b");
  });
});
