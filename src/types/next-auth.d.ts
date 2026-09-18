import type { DefaultSession } from "next-auth";

/**
 * The internal `users.id` this app keys everything else on — riot_accounts,
 * challenges, participants — is not part of Auth.js's default session or
 * token shape. This augmentation adds it so `session.user.id` and
 * `token.userId` typecheck everywhere they are read.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** The internal `users.id`, set by `enrichToken` on sign-in. */
    userId?: string;
  }
}
