import Link from "next/link";

import type { AuthErrorMessage } from "@/app/login/auth-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Translates `design/Login.dc.html`'s "01 Principal" and "04 Error" states
 * (see `odd/tasks/login-page.md` §"Design reference") into theme utilities —
 * wordmark, centred headline/subtitle stack, full-width primary CTA, note
 * and legal line. Riot-specific states (permissions, connecting, new
 * account) are out of scope; Discord is the only provider.
 *
 * Mobile-first at 390px, larger display type from `md:` (the mockup's
 * desktop headline is 104px vs. 52px on mobile) — a single centred column
 * on both, not the desktop mockup's two-panel split, since the product
 * already carries a persistent `SiteHeader`/`SiteFooter` shell the mockup's
 * standalone screen does not have.
 *
 * Server component: the only interactive element is the `<form>`, and its
 * `action` is a Server Function supplied by the caller — no client-boundary
 * directive is needed here (D8).
 */

export type LoginPanelProps = {
  /** Validated return path to carry through the Discord round-trip; omitted entirely (no hidden field) when absent or unsafe — see `page.tsx`. */
  from?: string;
  /** `null`/absent renders the main state; set renders the error state with the same button relabelled "Try again". */
  error?: AuthErrorMessage | null;
  /** Server Function bound to `signInWithDiscordAction`. */
  action: (formData: FormData) => void | Promise<void>;
};

export function LoginPanel({ from, error, action }: LoginPanelProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-2xl flex-col justify-between gap-10 px-6 py-10 md:justify-center md:gap-16 md:py-24">
      <div className="font-display text-title-3 font-bold uppercase leading-tight tracking-title text-text-primary">
        Become
        <br />
        a Legend
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5 md:flex-none">
        {error ? (
          <div role="alert" className="flex flex-col gap-3">
            <h1 className="font-display text-display-2 font-bold leading-none tracking-display text-text-primary md:text-display-1">
              {error.title}
            </h1>
            <p className="max-w-[320px] text-body text-text-muted md:max-w-[520px] md:text-body-lg">
              {error.body}
            </p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      <form action={action} className="flex flex-col gap-3.5">
        {from ? <input type="hidden" name="from" value={from} /> : null}
        <Button type="submit" variant="primary" size="lg" fullWidth>
          {error ? "Try again" : "Sign in with Discord"}
        </Button>
        <p className="text-center text-body-sm text-text-muted">
          No new account. We use your Discord sign-in.
        </p>
        <p className="text-center text-caption text-text-faint">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
