export type AuthErrorMessage = {
  title: string;
  body: string;
};

const GENERIC: AuthErrorMessage = {
  title: "We couldn't sign you in.",
  body: "Something went wrong while signing you in. Nothing changed on your account. Try again.",
};

/**
 * Maps an Auth.js `?error=` code (from either `pages.signIn` or
 * `pages.error` — both point at `/login`, see `src/auth.ts`) to a message
 * the error state of `LoginPanel` can render. Design.md D20:
 *
 * - `Verification` — the magic link's TTL elapsed or it was already
 *   consumed (spec: "Expired or Already-Used Link Messaging").
 * - `Configuration` — the link was mangled/incomplete, or sign-in is
 *   temporarily unavailable (one shared message for both — spec:
 *   "Mangled Link and Server Misconfiguration Share One Message" — the
 *   widened "unavailable" copy also covers a failed send, which is an
 *   outage, not a misconfiguration).
 * - `AccessDenied` — that email address can't sign in here.
 * - `EmailSignInError` — kept as insurance even though it is unreachable
 *   in `@auth/core@0.41.3` (the class is only thrown by the WebAuthn
 *   provider; a thrown send failure becomes `Configuration` today) — see
 *   D20's rationale for why the arm stays.
 * - every other known or future code shares the generic retry message
 *   rather than exposing Auth.js's internal taxonomy to the visitor.
 */
export function messageForAuthError(code: string | undefined): AuthErrorMessage | null {
  if (!code) return null;

  switch (code) {
    case "Verification":
      return {
        title: "That link no longer works.",
        body: "This sign-in link has expired or was already used. Request a new one.",
      };
    case "Configuration":
      return {
        title: "We couldn't use that sign-in link.",
        body: "The link was incomplete, or sign-in is temporarily unavailable. Request a new link — if it keeps failing, that's on us, not on you.",
      };
    case "AccessDenied":
      return {
        title: "We can't sign you in with that email.",
        body: "That address can't be used here. Nothing changed.",
      };
    case "EmailSignInError":
      return {
        title: "We couldn't send your sign-in link.",
        body: "Something went wrong on our side before the email went out. Nothing changed on your account. Try again.",
      };
    default:
      return GENERIC;
  }
}
