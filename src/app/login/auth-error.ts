export type AuthErrorMessage = {
  title: string;
  body: string;
};

const GENERIC: AuthErrorMessage = {
  title: "We couldn't sign you in.",
  body: "Discord didn't complete the sign-in. Nothing changed on your account. Try again.",
};

/**
 * Maps an Auth.js `?error=` code (from either `pages.signIn` or
 * `pages.error` — both point at `/login`, see `src/auth.ts`) to a message
 * the error state of `LoginPanel` can render. `AccessDenied` and
 * `Configuration` get their own copy because they describe a different
 * situation than a generic failed round-trip; every other known or
 * future Auth.js code (`OAuthCallbackError`, `OAuthSignin`, `Callback`,
 * `Default`, ...) shares one generic retry message rather than exposing
 * Auth.js's internal taxonomy to the visitor.
 */
export function messageForAuthError(code: string | undefined): AuthErrorMessage | null {
  if (!code) return null;

  switch (code) {
    case "AccessDenied":
      return {
        title: "Discord denied the request.",
        body: "You cancelled the sign-in or your Discord account can't be used here. Nothing changed.",
      };
    case "Configuration":
      return {
        title: "Sign-in isn't configured.",
        body: "The server is missing its sign-in settings. This is on us, not on you.",
      };
    default:
      return GENERIC;
  }
}
