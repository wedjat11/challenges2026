"use server";

import { signIn } from "@/auth";
import { safeReturnPath } from "@/app/login/return-path";

/**
 * `LoginPanel`'s form action. Untested directly (per this feature's
 * environment constraints, `@/auth` cannot be imported under Vitest — see
 * `return-path.test.ts`/`login-panel.test.tsx` for the tested pieces this
 * composes) — kept thin on purpose, matching `createChallengeAction`'s
 * split. Re-validates `from` here rather than trusting the hidden field:
 * a Server Function is reachable by direct POST (Next docs,
 * `07-mutating-data.md`), so the page rendering a safe value first is not
 * enough on its own.
 *
 * `signIn` performs its own redirect (Auth.js's default `redirect: true`)
 * by throwing Next's redirect signal, so this stays outside any try/catch —
 * same rule as `redirect()` itself (Next docs, `redirecting.md`).
 */
export async function signInWithDiscordAction(formData: FormData): Promise<void> {
  const redirectTo = safeReturnPath(formData.get("from"));

  await signIn("discord", { redirectTo });
}
