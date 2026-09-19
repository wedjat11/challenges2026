import { describe, expect, it } from "vitest";

import { messageForAuthError } from "@/app/login/auth-error";

describe("messageForAuthError", () => {
  it("returns null when no code is given", () => {
    expect(messageForAuthError(undefined)).toBeNull();
  });

  it("maps AccessDenied to its specific title and body", () => {
    expect(messageForAuthError("AccessDenied")).toEqual({
      title: "Discord denied the request.",
      body: "You cancelled the sign-in or your Discord account can't be used here. Nothing changed.",
    });
  });

  it("maps Configuration to its specific title and body", () => {
    expect(messageForAuthError("Configuration")).toEqual({
      title: "Sign-in isn't configured.",
      body: "The server is missing its sign-in settings. This is on us, not on you.",
    });
  });

  it("maps a known sign-in-page error code to the generic retry message", () => {
    expect(messageForAuthError("OAuthCallbackError")).toEqual({
      title: "We couldn't sign you in.",
      body: "Discord didn't complete the sign-in. Nothing changed on your account. Try again.",
    });
  });

  it("maps a different known code to the same generic retry message", () => {
    expect(messageForAuthError("Callback")).toEqual({
      title: "We couldn't sign you in.",
      body: "Discord didn't complete the sign-in. Nothing changed on your account. Try again.",
    });
  });

  it("falls back to the generic retry message for an unrecognized code", () => {
    expect(messageForAuthError("SomeFutureAuthErrorCode")).toEqual({
      title: "We couldn't sign you in.",
      body: "Discord didn't complete the sign-in. Nothing changed on your account. Try again.",
    });
  });
});
