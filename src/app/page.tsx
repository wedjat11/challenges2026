import { Hero } from "@/app/hero";
import { auth } from "@/auth";

/**
 * Landing page. Thin async server root — `@/auth` cannot be imported under
 * Vitest, so every branch with behaviour lives in `Hero`, unit-tested via
 * `renderToStaticMarkup`. Signed out, this is the marketing entry screen
 * with a single "Log in" path; signed in, it is the existing headline and
 * app calls to action. The header now owns sign-in/out, so no `<AuthStatus />`
 * renders here anymore.
 */
export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-24">
      <Hero signedIn={Boolean(session?.user)} />
    </main>
  );
}
