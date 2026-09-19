import type { Metadata } from "next";

import { createRiotAccountRepository } from "@/adapters/db/riot-account-repository";
import { CreateForm } from "@/app/challenges/new/create-form";
import { auth } from "@/auth";
import { AuthStatus } from "@/components/auth-status";
import { Card } from "@/components/ui/card";
import { getAppDb } from "@/lib/db";

export const metadata: Metadata = {
  title: "Create a challenge",
};

/**
 * challenge-authoring: Sign-In Required to Create a Challenge. Signed out
 * renders a sign-in panel with `<AuthStatus />` rather than `redirect()`,
 * matching `/account` and keeping the URL shareable (the spec allows
 * "redirected **or** shown a sign-in prompt"); the rule builder is not
 * rendered in that branch.
 */
export default async function NewChallengePage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-24">
        <h1 className="font-display text-title-2 tracking-title text-text-primary">
          Create a challenge
        </h1>
        <Card padding="lg" className="mt-8">
          <p className="text-body text-text-secondary">Sign in to create a challenge.</p>
          <div className="mt-4">
            <AuthStatus from="/challenges/new" />
          </div>
        </Card>
      </main>
    );
  }

  const db = await getAppDb();
  const accounts = await createRiotAccountRepository(db).listByUser(session.user.id);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-24">
      <h1 className="font-display text-title-2 tracking-title text-text-primary">
        Create a challenge
      </h1>
      <div className="mt-8">
        <CreateForm accounts={accounts} />
      </div>
    </main>
  );
}
