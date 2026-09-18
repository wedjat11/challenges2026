import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { z } from "zod";

import type { DiscordIdentity } from "@/domain/ports/user-repository";

/**
 * Pure, framework-free auth logic.
 *
 * Kept out of `auth.ts` because that file needs a live Cloudflare context to
 * even build its config; these functions do not, so they are the part of
 * auth worth testing directly instead of through a signed-in browser.
 */

/**
 * This is the shape Discord's own `profile()` callback in
 * `next-auth/providers/discord` already returns — `{ id, name, email,
 * image }` — not the raw Discord API response. Validating that shape rather
 * than the raw one means this module never re-derives the avatar CDN URL:
 * the provider already worked out the default-avatar fallback and the
 * gif/png extension, and duplicating that logic would be a second place for
 * it to go stale.
 */
const discordProfileSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  image: z.string().trim().min(1).nullable().optional(),
});

/** Throws a descriptive error when `profile` is not a usable Discord identity. */
export function discordIdentityFromProfile(profile: unknown): DiscordIdentity {
  const parsed = discordProfileSchema.parse(profile);

  return {
    discordId: parsed.id,
    displayName: parsed.name,
    avatarUrl: parsed.image ?? null,
  };
}

/** Carries the internal user id from sign-in onto every later JWT. */
export function enrichToken(token: JWT, userId: string): JWT {
  return { ...token, userId };
}

/**
 * Exposes the internal user id on `session.user.id`, which is what server
 * components and route handlers actually key on.
 */
export function sessionFromToken(session: Session, token: JWT): Session {
  return {
    ...session,
    user: {
      ...session.user,
      // Defensive, not expected: enrichToken always runs before this on
      // sign-in, so token.userId should already be set by the time session()
      // runs. A pure function should still not crash if that ever changes.
      id: token.userId ?? "",
    },
  };
}
