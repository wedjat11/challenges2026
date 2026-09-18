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
