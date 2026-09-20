import { createRiotAccountRepository } from "@/adapters/db/riot-account-repository";
import { unlinkRiotAccountAction } from "@/app/account/actions";
import { LinkRiotAccountForm } from "@/app/account/link-form";
import { ReasonBanner } from "@/app/account/reason-banner";
import { auth } from "@/auth";
import { AuthStatus } from "@/components/auth-status";
import { getAppDb } from "@/lib/db";
import { PLATFORM_LABELS } from "@/domain/riot-id";

/** First of a possibly-repeated `searchParams` value, matching `/login`'s `firstValue`. */
function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Where a signed-in user links and manages the Riot accounts they play
 * challenges with. Every linked account shows "Unverified" because nothing
 * in v1 checks that the person linking an account actually owns it — see
 * `verified` in schema.ts — so the page says so rather than implying more
 * trust than the data backs up.
 *
 * `?reason=` (D18, challenge-participation: Sign-In and Linked Account
 * Required to Join): the join action redirects here after a signed-out or
 * no-linked-account join attempt. `ReasonBanner` renders in both branches
 * below — the redirect can land a signed-out visitor here too.
 */
export default async function AccountPage(props: PageProps<"/account">) {
  const session = await auth();
  const { reason } = await props.searchParams;

  if (!session?.user) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-24">
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        <ReasonBanner reason={firstValue(reason)} />
        <p className="mt-4 leading-relaxed text-black/70 dark:text-white/70">
          Sign in to link a Riot account.
        </p>
        <div className="mt-6">
          <AuthStatus from="/account" />
        </div>
      </main>
    );
  }

  const db = await getAppDb();
  const accounts = await createRiotAccountRepository(db).listByUser(session.user.id);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-24">
      <div className="flex items-center justify-between gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        <AuthStatus />
      </div>

      <ReasonBanner reason={firstValue(reason)} />

      <section className="mt-10">
        <h2 className="text-sm font-medium tracking-tight">Linked Riot accounts</h2>

        {accounts.length === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
            No Riot account linked yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-black/10 p-4 dark:border-white/15"
              >
                <div>
                  <p className="text-sm font-medium">
                    {account.gameName}#{account.tagLine}
                    <span className="ml-2 text-black/50 dark:text-white/50">
                      {PLATFORM_LABELS[account.platform]}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Unverified — anyone can claim any Riot ID; ownership is not checked yet.
                  </p>
                </div>
                <form action={unlinkRiotAccountAction}>
                  <input type="hidden" name="id" value={account.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/15"
                  >
                    Unlink
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium tracking-tight">Link a Riot account</h2>
        <div className="mt-4">
          <LinkRiotAccountForm />
        </div>
      </section>
    </main>
  );
}
