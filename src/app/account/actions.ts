"use server";

import { revalidatePath } from "next/cache";

import { createRiotAccountRepository } from "@/adapters/db/riot-account-repository";
import { auth } from "@/auth";
import { linkRiotAccount, type LinkRiotAccountResult } from "@/application/link-riot-account";
import { getAppDb } from "@/lib/db";
import { matchProviderFor } from "@/lib/riot";

/** Action state also covers the one failure the use case itself never sees. */
export type LinkRiotAccountActionState = LinkRiotAccountResult | { kind: "unauthenticated" };

/**
 * `useActionState` form action for the link form.
 *
 * Builds its dependencies per call rather than at module load: `getAppDb`
 * needs the request-scoped Cloudflare context, which does not exist until a
 * request is in flight.
 */
export async function linkRiotAccountAction(
  // `null` is `useActionState`'s initial value, before any submission exists.
  _prevState: LinkRiotAccountActionState | null,
  formData: FormData,
): Promise<LinkRiotAccountActionState> {
  const session = await auth();
  if (!session?.user?.id) return { kind: "unauthenticated" };

  const db = await getAppDb();
  const link = linkRiotAccount({
    riotAccounts: createRiotAccountRepository(db),
    matchProviderFor,
  });

  const result = await link({
    userId: session.user.id,
    riotId: String(formData.get("riotId") ?? ""),
    platform: String(formData.get("platform") ?? ""),
  });

  if (result.kind === "linked" || result.kind === "already_linked") {
    revalidatePath("/account");
  }

  return result;
}

/** No-op for a signed-out request: nothing to unlink without an owner to check against. */
export async function unlinkRiotAccountAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const db = await getAppDb();
  const riotAccounts = createRiotAccountRepository(db);

  const id = String(formData.get("id") ?? "");
  await riotAccounts.unlink(id, session.user.id);

  revalidatePath("/account");
}
