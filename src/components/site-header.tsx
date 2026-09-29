import { auth } from "@/auth";
import { AuthStatus } from "@/components/auth-status";
import { SiteHeaderBody } from "@/components/site-header-body";

/**
 * Present on every route (design-system: Header Navigation; public landing
 * and session-gated navigation). Thin async server root — `@/auth` cannot
 * be imported under Vitest, so every branch with behaviour lives in
 * `SiteHeaderBody`, which is unit-tested via `renderToStaticMarkup`. Signed
 * out, only the wordmark and a "Log in" control render; signed in, the
 * three navigation destinations (Challenges, Create, Account) plus
 * `<AuthStatus />` render, as before this change.
 */
export async function SiteHeader() {
  const session = await auth();

  return <SiteHeaderBody signedIn={Boolean(session?.user)} authSlot={<AuthStatus />} />;
}
