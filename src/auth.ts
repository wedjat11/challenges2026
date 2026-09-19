import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

import { createUserRepository } from "@/adapters/db/user-repository";
import { discordIdentityFromProfile, enrichToken, sessionFromToken } from "@/auth/callbacks";
import { getAppDb } from "@/lib/db";

/**
 * Session strategy is JWT, with no Auth.js adapter. `users` is already a
 * custom table keyed by `discord_id`; Auth.js's four adapter tables (users,
 * accounts, sessions, verification_tokens) would duplicate it for nothing.
 * Instead, the `jwt` callback below upserts through `UserRepository` on
 * sign-in and carries the internal id on the token.
 *
 * The config is lazy — a function, not an object — because the D1 binding
 * only exists once a request reaches the worker; building the config at
 * module load time would run before Cloudflare's context is available.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(async () => ({
  providers: [Discord],
  session: { strategy: "jwt" },
  // The host is Cloudflare Workers, not Vercel, so Auth.js cannot infer its
  // own canonical URL from the platform the way it does there.
  trustHost: true,
  // `/login` replaces Auth.js's default unstyled sign-in and error pages
  // (`/api/auth/signin`, `/api/auth/error`). Nothing else in this codebase
  // links to either default path — every sign-in control calls `signIn()`
  // as a Server Function, never a plain form POST to `/api/auth/signin` —
  // so redirecting both here has no other side effect to account for.
  // `pages.signIn`'s own OAuth failures land on `/login?error=<code>`
  // (SignInPageErrorParam, e.g. OAuthCallbackError); `pages.error` covers
  // the remaining codes (ErrorPageParam: Configuration, AccessDenied,
  // Verification). `messageForAuthError` (src/app/login/auth-error.ts)
  // maps every code from both families to the same error state.
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on sign-in — it is the *transformed* output of
      // the Discord provider's own profile() ({ id, name, email, image }),
      // not the raw OAuth payload (that is the separate `profile` param).
      // Every later call is just refreshing the existing token, with nothing
      // new to upsert.
      if (!user) return token;

      const identity = discordIdentityFromProfile(user);
      const db = await getAppDb();
      const storedUser = await createUserRepository(db).upsertFromDiscord(identity);

      return enrichToken(token, storedUser.id);
    },
    session({ session, token }) {
      return sessionFromToken(session, token);
    },
  },
}));
