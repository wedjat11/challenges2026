/**
 * Normalises a raw sign-in input into the email identifier Auth.js's own
 * magic-link flow will issue a token for, or `null` when the input cannot
 * be normalised. Mirrors `defaultNormalizer`
 * (`@auth/core/lib/actions/signin/send-token.js:74-104`, pinned to
 * `next-auth@5.0.0-beta.32`) step for step so a stored email and an
 * incoming identifier can never disagree — design.md D17.
 *
 * Unlike `defaultNormalizer`, this never throws: returning `null` lets the
 * `/login` Server Function render a field-level error with no `try/catch`
 * (D18).
 */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;

  // NFKC first: a homoglyph of "@" (e.g. the fullwidth "＠") canonicalizes
  // to a real "@" here, so an address that only looks single-"@" before
  // normalization is correctly rejected below once it has two.
  const normalized = raw.normalize("NFKC").toLowerCase().trim();
  if (normalized.length === 0) return null;

  if (normalized.includes('"')) return null;

  const parts = normalized.split("@");
  if (parts.length !== 2) return null;

  const [local, rawDomain] = parts;
  if (!local || !rawDomain) return null;

  // The local part may legitimately contain "," (RFC 5321 quoted strings
  // notwithstanding, defaultNormalizer only cares about the domain here);
  // the domain is trimmed to its first comma-separated segment.
  const domain = rawDomain.split(",")[0];
  if (!domain) return null;

  return `${local}@${domain}`;
}

/** A5/D23: the local part, trimmed, ≤20 characters; "Player" when nothing is left. */
export const DISPLAY_NAME_MAX_LENGTH = 20;
export const DISPLAY_NAME_FALLBACK = "Player";

/**
 * Derives a first-sign-in `display_name` from the raw local part of an
 * email address — spec: "Display Name Derivation at First Sign-In".
 * Design.md D23: no prettification (no title-casing, no plus-tag
 * stripping, no dot-to-space); the raw local part is at least a string
 * the visitor typed.
 */
export function displayNameFromEmail(email: string): string {
  const [localPart = ""] = email.split("@");
  const trimmed = localPart.trim();

  if (trimmed.length === 0) return DISPLAY_NAME_FALLBACK;

  return trimmed.slice(0, DISPLAY_NAME_MAX_LENGTH);
}
