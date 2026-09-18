import Link from "next/link";

import { auth, signIn, signOut } from "@/auth";

/**
 * Sign-in state for the landing page header. Both actions are server
 * actions, so signing in or out ships no client JavaScript of its own.
 *
 * A plain `img`, not `next/image`: the avatar comes from Discord's CDN, and
 * whitelisting that host in `next.config.ts` is out of scope for this task.
 */
export async function AuthStatus() {
  const session = await auth();

  if (!session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("discord");
        }}
      >
        <button
          type="submit"
          className="rounded-md border border-black/10 px-4 py-2 text-sm font-medium dark:border-white/15"
        >
          Sign in with Discord
        </button>
      </form>
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
      <Link href="/account" className="text-sm text-black/70 underline dark:text-white/70">
        Your account
      </Link>
      <button
        type="submit"
        className="rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/15"
      >
        Sign out
      </button>
    </form>
  );
}
