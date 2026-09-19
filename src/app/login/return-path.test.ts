import { describe, expect, it } from "vitest";

import { safeReturnPath, withReturnPath } from "@/app/login/return-path";

/**
 * `safeReturnPath` is the one gate between an attacker-controlled `?from=`
 * query value and the hidden field the login form re-submits after the
 * Discord round-trip. Every rejection case here maps to an open-redirect or
 * protocol-injection vector; "starts with a single `/`" is deliberately
 * stricter than "is a relative path" so `//host` (a browser-parsed
 * protocol-relative URL) never slips through.
 */
describe("safeReturnPath", () => {
  it("accepts a plain relative path unchanged", () => {
    expect(safeReturnPath("/challenges/new")).toBe("/challenges/new");
  });

  it("falls back to /account by default when given a non-string", () => {
    expect(safeReturnPath(undefined)).toBe("/account");
    expect(safeReturnPath(null)).toBe("/account");
    expect(safeReturnPath(42)).toBe("/account");
  });

  it("falls back for an empty string", () => {
    expect(safeReturnPath("")).toBe("/account");
  });

  it("falls back for a protocol-relative //host value", () => {
    expect(safeReturnPath("//evil.example")).toBe("/account");
  });

  it("falls back for an absolute http: URL", () => {
    expect(safeReturnPath("http://evil.example")).toBe("/account");
  });

  it("falls back for a javascript: URL", () => {
    expect(safeReturnPath("javascript:alert(1)")).toBe("/account");
  });

  it("falls back for a value containing a backslash", () => {
    expect(safeReturnPath("/\\evil.example")).toBe("/account");
  });

  it("uses the caller-supplied fallback instead of /account when given", () => {
    expect(safeReturnPath("not-a-path", "/challenges")).toBe("/challenges");
  });
});

describe("withReturnPath", () => {
  it("appends an encoded ?from= when a return path is given", () => {
    expect(withReturnPath("/login", "/challenges/new")).toBe(
      "/login?from=%2Fchallenges%2Fnew",
    );
  });

  it("returns the bare path when from is absent", () => {
    expect(withReturnPath("/login", undefined)).toBe("/login");
  });

  it("returns the bare path when from is an empty string", () => {
    expect(withReturnPath("/login", "")).toBe("/login");
  });
});
