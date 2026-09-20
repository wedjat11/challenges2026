import Link from "next/link";

import { withReturnPath } from "@/app/login/return-path";
import { auth, signOut } from "@/auth";

/**
 * Sign-in state for the landing page header. Signed out, this is a plain
 * link to `/login` (styled as the pre-existing outline control) rather
 * than the old inline Discord form — `/login` is the one place that calls
 * `signIn()` now. Signing out still ships no client JavaScript of its own.
 *
 * A plain `img`, not `next/image`: the avatar comes from Discord's CDN, and
 * whitelisting that host in `next.config.ts` is out of scope for this task.
 *
 * Restyled in S6 (design.md §5, "Duplicate link"): the signed-in branch no
 * longer renders its own "Your account" link — `SiteHeader` (S0) already
 * owns that destination in its three-item nav.
 */
export async function AuthStatus({ from }: { from?: string } = {}) {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link
        href={withReturnPath("/login", from)}
        className="rounded-md border border-border-hairline px-4 py-2 text-sm font-medium"
      >
        Sign in with Discord
      </Link>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
      className="flex items-center gap-3"
    >
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Discord avatar, no remotePatterns configured
        <img
          src={session.user.image}
          alt=""
          width={32}
          height={32}
          className="rounded-full"
        />
      ) : null}
      <span className="text-sm font-medium">{session.user.name}</span>
      <button
        type="submit"
        className="rounded-md border border-border-hairline px-3 py-1.5 text-sm"
      >
        Sign out
      </button>
    </form>
  );
}
