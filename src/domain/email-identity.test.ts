import { describe, expect, it } from "vitest";

import { displayNameFromEmail, normalizeEmail } from "@/domain/email-identity";

/**
 * `normalizeEmail` must agree with Auth.js's own `defaultNormalizer`
 * (`@auth/core/lib/actions/signin/send-token.js`, cited in design.md D17)
 * byte-for-byte, because a stored email that disagrees with the identifier
 * Auth.js hands back makes every magic link unredeemable. Each case here
 * pins one step of that function's case table.
 */
describe("normalizeEmail", () => {
  it("lowercases and keeps an already-normalized address unchanged", () => {
    expect(normalizeEmail("alice@example.com")).toBe("alice@example.com");
  });

  it("folds case to lowercase", () => {
    expect(normalizeEmail("Alice@Example.COM")).toBe("alice@example.com");
  });

  it("trims leading and trailing ASCII whitespace", () => {
    expect(normalizeEmail("  alice@example.com  ")).toBe("alice@example.com");
  });

  it("trims leading and trailing NBSP", () => {
    expect(normalizeEmail(" alice@example.com ")).toBe("alice@example.com");
  });

  it("applies NFKC so a fullwidth @ next to a real @ is rejected, not silently accepted", () => {
    // Before NFKC the string has exactly one ASCII "@"; after NFKC the
    // fullwidth "＠" also canonicalizes to "@", producing two real "@"
    // characters, which fails the exactly-one-"@" check below.
    expect(normalizeEmail("alice@example＠com")).toBeNull();
  });

  it("rejects an address containing a double quote", () => {
    expect(normalizeEmail('"attacker@evil.com"@victim.com')).toBeNull();
  });

  it("rejects an address with zero @ characters", () => {
    expect(normalizeEmail("alice.example.com")).toBeNull();
  });

  it("rejects an address with two @ characters", () => {
    expect(normalizeEmail("alice@middle@example.com")).toBeNull();
  });

  it("rejects an address with three @ characters", () => {
    expect(normalizeEmail("a@b@c@example.com")).toBeNull();
  });

  it("rejects an empty local part", () => {
    expect(normalizeEmail("@example.com")).toBeNull();
  });

  it("rejects an empty domain part", () => {
    expect(normalizeEmail("alice@")).toBeNull();
  });

  it("drops everything after a comma in the domain, keeping the first segment", () => {
    expect(normalizeEmail("alice@example.com,second.example.com")).toBe("alice@example.com");
  });

  it("rejects when the comma-trimmed domain becomes empty", () => {
    expect(normalizeEmail("alice@,second.example.com")).toBeNull();
  });

  it("rejects a non-string input", () => {
    expect(normalizeEmail(42)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(normalizeEmail("")).toBeNull();
  });

  it("never throws, even for the rejection cases above", () => {
    expect(() => normalizeEmail("not an email")).not.toThrow();
  });
});

/**
 * `displayNameFromEmail` derives a first-sign-in display name from the raw
 * local part — spec: "Display Name Derivation at First Sign-In" — design.md
 * D23: no prettification, no plus-tag stripping, nothing cleverer than
 * trim + truncate + a "Player" fallback.
 */
describe("displayNameFromEmail", () => {
  it("uses the local part of an ordinary email unchanged", () => {
    expect(displayNameFromEmail("diego.rivera@example.com")).toBe("diego.rivera");
  });

  it("keeps a local part that is exactly 20 characters", () => {
    const localPart = "a".repeat(20);
    expect(displayNameFromEmail(`${localPart}@example.com`)).toBe(localPart);
    expect(displayNameFromEmail(`${localPart}@example.com`)).toHaveLength(20);
  });

  it("truncates a 21-character local part to 20 characters", () => {
    const localPart = "a".repeat(21);
    expect(displayNameFromEmail(`${localPart}@example.com`)).toBe("a".repeat(20));
  });

  it("falls back to Player when the local part is whitespace-only", () => {
    expect(displayNameFromEmail("   @example.com")).toBe("Player");
  });

  it("does not strip a plus-tag from the local part", () => {
    expect(displayNameFromEmail("alice+newsletter@example.com")).toBe("alice+newsletter");
  });
});
