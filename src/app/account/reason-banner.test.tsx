import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { messageForReason, ReasonBanner } from "@/app/account/reason-banner";

/**
 * challenge-participation: Sign-In and Linked Account Required to Join
 * (D18) — the `/account?reason=` banner. `messageForReason` is a pure
 * function over the closed `reason` union, tested directly with no render;
 * `ReasonBanner` is the presentational wrapper, static-render tested like
 * every other component in this codebase.
 */

describe("messageForReason", () => {
  it("maps 'sign-in-to-join' to its message", () => {
    expect(messageForReason("sign-in-to-join")).toBe("Sign in to join that challenge.");
  });

  it("maps 'link-account-to-join' to its message", () => {
    expect(messageForReason("link-account-to-join")).toBe(
      "Link a Riot account to join that challenge.",
    );
  });

  it("returns null for an unrecognised value", () => {
    expect(messageForReason("bogus")).toBeNull();
  });

  it("returns null when reason is undefined", () => {
    expect(messageForReason(undefined)).toBeNull();
  });
});

describe("ReasonBanner", () => {
  it("renders the mapped message for a recognised reason", () => {
    const html = renderToStaticMarkup(<ReasonBanner reason="sign-in-to-join" />);

    expect(html).toContain("Sign in to join that challenge.");
  });

  it("renders nothing for an unrecognised reason", () => {
    const html = renderToStaticMarkup(<ReasonBanner reason="bogus" />);

    expect(html).toBe("");
  });

  it("renders nothing when reason is undefined", () => {
    const html = renderToStaticMarkup(<ReasonBanner reason={undefined} />);

    expect(html).toBe("");
  });
});
