import Link from "next/link";

import { HeroCtas } from "@/app/hero-ctas";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/legal";

/**
 * Landing page's testable presentational half. `page.tsx` stays a thin
 * async root — it awaits `auth()`, which `renderToStaticMarkup` cannot
 * resolve, matching `site-header.tsx`'s same reason.
 *
 * Signed out: the marketing entry screen from `design/Login.dc.html`'s
 * "01 Principal" state, reusing `login-panel.tsx`'s display type scale and
 * eyebrow `Badge` — one primary "Log in" link, no app calls to action.
 * Signed in: the existing headline and `HeroCtas`, unchanged except that
 * the inline `<AuthStatus />` this used to render alongside the headline is
 * gone — `SiteHeader` owns sign-in/out now.
 */
export function Hero({ signedIn }: { signedIn: boolean }) {
  if (!signedIn) {
    return (
      <div className="flex flex-col gap-5">
        <Badge tone="info">Goal challenges, tracked automatically</Badge>
        <h1 className="font-display text-display-2 font-bold leading-none tracking-display text-text-primary md:text-display-1">
          Your friends.
          <br />
          Your rules.
          <br />
          Your legend.
        </h1>
        <p className="max-w-[320px] text-body text-text-muted md:max-w-[520px] md:text-body-lg">
          Create goal challenges with your friends and let match history
          update your progress automatically.
        </p>
        <Link
          href="/login"
          className={buttonClassName({ variant: "primary", size: "lg", className: "mt-2 w-fit" })}
        >
          Log in
        </Link>
        <p className="text-body-sm text-text-muted">
          No new account. We use your Discord sign-in.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-display-3 font-bold tracking-display text-text-primary">
        {SITE_NAME}
      </h1>

      <p className="mt-6 text-body-lg leading-relaxed text-text-secondary">
        Set a League of Legends challenge, share the link, and let it track itself.
      </p>

      <p className="mt-4 text-body leading-relaxed text-text-secondary">
        Pick a goal — win ten ranked games as Jungle this week, play twenty games as one champion
        — and invite whoever you want. Progress is worked out from match history as games finish,
        so nobody has to report their own results.
      </p>

      <HeroCtas />
    </>
  );
}
