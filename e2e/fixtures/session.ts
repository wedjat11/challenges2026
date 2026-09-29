import type { BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

import { requireEnv } from "./env";

/**
 * D16 — mints the Auth.js session cookie directly instead of driving a real
 * OAuth round trip or shipping a test-only provider/route (A14). Verified
 * against the installed `@auth/core@0.41.3` source (not assumed):
 * `defaultCookies()` names this cookie `authjs.session-token` with no
 * `__Secure-` prefix over plain http, and `getToken()` defaults `salt` to
 * the cookie name — so `encode()` here must pass that same `salt` or the app
 * fails to decrypt a token this fixture just minted. `userId` is the field
 * `sessionFromToken` (src/auth/callbacks.ts) reads onto `session.user.id`.
 */
const COOKIE_NAME = "authjs.session-token";

export type SessionUser = {
  id: string;
  discordId: string;
  name: string;
};

export async function signIn(context: BrowserContext, user: SessionUser): Promise<void> {
  const value = await encode({
    token: { sub: user.discordId, name: user.name, userId: user.id },
    secret: requireEnv("AUTH_SECRET"),
    salt: COOKIE_NAME,
    maxAge: 60 * 60,
  });

  await context.addCookies([
    {
      name: COOKIE_NAME,
      value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
