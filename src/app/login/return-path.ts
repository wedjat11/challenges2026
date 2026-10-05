const DEFAULT_FALLBACK = "/account";

/**
 * Validates a `?from=` value before it is trusted as a post-sign-in
 * destination. Only a same-origin relative path is accepted: a single
 * leading `/`, never `//host` (a protocol-relative URL a browser resolves
 * against a different origin), never an absolute URL (`http:`, `https:`,
 * `javascript:`, ...), and never a backslash (some browsers treat `\` as
 * `/` in a URL, which is how `/\evil.example` becomes `//evil.example`).
 * Anything else falls back to `fallback` — `/account` unless the caller
 * overrides it.
 */
export function safeReturnPath(raw: unknown, fallback: string = DEFAULT_FALLBACK): string {
  if (typeof raw !== "string") return fallback;
  if (raw.length === 0) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;

  return raw;
}

/**
 * Builds the `/login` URL a sign-in-required page links to, carrying `from`
 * so the round-trip returns the visitor where they started. Omits the query
 * entirely when there is nothing to carry, rather than emitting `?from=`.
 */
export function withReturnPath(path: string, from: string | undefined | null): string {
  if (!from) return path;

  return `${path}?from=${encodeURIComponent(from)}`;
}

/**
 * Builds the `/login` redirect target for the `?invalid=email` field-level
 * error (D18): the typed email failed `normalizeEmail`, so the sign-in
 * Server Function redirects back here instead of calling `signIn`. Re-runs
 * `safeReturnPath(from, "")` so a hostile `from` is dropped on this error
 * round trip too, not only on the success one.
 */
export function invalidEmailLoginPath(from: unknown): string {
  const safeFrom = safeReturnPath(from, "");
  if (!safeFrom) return "/login?invalid=email";

  return `/login?invalid=email&from=${encodeURIComponent(safeFrom)}`;
}
