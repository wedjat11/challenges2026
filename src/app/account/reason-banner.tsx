import { Card } from "@/components/ui/card";

/**
 * challenge-participation: Sign-In and Linked Account Required to Join
 * (D18) — the join action redirects here with a machine-readable reason
 * (`?reason=sign-in-to-join` or `?reason=link-account-to-join`); this
 * closed union is the only shape ever rendered. An unrecognised or absent
 * `reason` renders nothing, never arbitrary reflected text.
 */

export type AccountReason = "sign-in-to-join" | "link-account-to-join";

const REASON_MESSAGES: Record<AccountReason, string> = {
  "sign-in-to-join": "Sign in to join that challenge.",
  "link-account-to-join": "Link a Riot account to join that challenge.",
};

function isAccountReason(value: string): value is AccountReason {
  return value === "sign-in-to-join" || value === "link-account-to-join";
}

/** Pure mapping, tested with no render — the source of truth `ReasonBanner` renders from. */
export function messageForReason(reason: string | undefined): string | null {
  if (reason === undefined) return null;
  return isAccountReason(reason) ? REASON_MESSAGES[reason] : null;
}

export function ReasonBanner({ reason }: { reason: string | undefined }) {
  const message = messageForReason(reason);
  if (!message) return null;

  return (
    <Card padding="md" className="mb-6">
      <p role="status" className="text-body-sm text-text-primary">
        {message}
      </p>
    </Card>
  );
}
