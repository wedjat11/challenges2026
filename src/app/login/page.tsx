import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signInWithDiscordAction } from "@/app/login/actions";
import { messageForAuthError } from "@/app/login/auth-error";
import { LoginPanel } from "@/app/login/login-panel";
import { safeReturnPath } from "@/app/login/return-path";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

/** First of a possibly-repeated `searchParams` value; Next types query values as `string | string[] | undefined`. */
function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * `/login`: server-rendered, reachable signed out. Untested directly, like
 * `create-form.tsx`/`actions.ts` in this codebase — `@/auth` cannot be
 * imported under Vitest — so every branch with behaviour (return-path
 * validation, error copy, markup) lives in the tested helpers and
 * `LoginPanel` this composes.
 */
export default async function LoginPage(props: PageProps<"/login">) {
  const session = await auth();
  if (session?.user) {
    redirect("/account"); // throws; must stay outside any try (Next docs)
  }

  const { from: rawFrom, error: rawError } = await props.searchParams;

  // Only pass `from` through when it is exactly the value `safeReturnPath`
  // would accept unchanged — an invalid or unsafe value renders no hidden
  // field at all, rather than silently swapping in a fallback the visitor
  // never asked for. The empty string sentinel can never be a real
  // fallback match: `safeReturnPath` always rejects "" as its own input.
  const candidate = firstValue(rawFrom) ?? "";
  const from = safeReturnPath(candidate, "") || undefined;

  const error = messageForAuthError(firstValue(rawError));

  return (
    <main className="flex flex-1 flex-col">
      <LoginPanel from={from} error={error} action={signInWithDiscordAction} />
    </main>
  );
}
