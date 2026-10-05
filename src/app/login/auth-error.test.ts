import { describe, expect, it } from "vitest";

import { messageForAuthError } from "@/app/login/auth-error";

/**
 * Pins the D20 copy table for every Auth.js `?error=` code this flow can
 * receive, plus the unreachable `EmailSignInError` insurance case and the
 * generic fallback for anything else. None of this copy may mention
 * Discord — email is now the only identity, per the spec's "Login Error
 * State Copy" requirement.
 */
describe("messageForAuthError", () => {
  it("returns null when no code is given", () => {
    expect(messageForAuthError(undefined)).toBeNull();
  });

  it("maps Verification to the expired-or-used-link copy", () => {
    expect(messageForAuthError("Verification")).toEqual({
      title: "That link no longer works.",
      body: "This sign-in link has expired or was already used. Request a new one.",
    });
  });

  it("maps Configuration to the mangled-link/misconfiguration copy", () => {
    expect(messageForAuthError("Configuration")).toEqual({
      title: "We couldn't use that sign-in link.",
      body: "The link was incomplete, or sign-in is temporarily unavailable. Request a new link — if it keeps failing, that's on us, not on you.",
    });
  });

  it("maps AccessDenied to its email-specific title and body", () => {
    expect(messageForAuthError("AccessDenied")).toEqual({
      title: "We can't sign you in with that email.",
      body: "That address can't be used here. Nothing changed.",
    });
  });

  it("maps EmailSignInError to its own copy, even though @auth/core never throws it today", () => {
    expect(messageForAuthError("EmailSignInError")).toEqual({
      title: "We couldn't send your sign-in link.",
      body: "Something went wrong on our side before the email went out. Nothing changed on your account. Try again.",
    });
  });

  it("falls back to the generic message for an unrecognized code", () => {
    expect(messageForAuthError("SomeFutureAuthErrorCode")).toEqual({
      title: "We couldn't sign you in.",
      body: "Something went wrong while signing you in. Nothing changed on your account. Try again.",
    });
  });

  it("never returns copy mentioning Discord, for any known or unknown code", () => {
    const codes = ["Verification", "Configuration", "AccessDenied", "EmailSignInError", "Unknown"];

    for (const code of codes) {
      const message = messageForAuthError(code);
      expect(message?.title).not.toContain("Discord");
      expect(message?.body).not.toContain("Discord");
    }
  });
});
