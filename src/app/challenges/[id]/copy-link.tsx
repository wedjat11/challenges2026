"use client";

import { useState } from "react";

import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

/**
 * challenge-view: Share URL Affordance. Clipboard access needs a client
 * boundary — the one interactive element on an otherwise server-rendered
 * page (matching `copy-link.tsx`'s stated boundary in design.md's
 * server/client split table).
 *
 * A plain `<button>`, not `IconButton`: `IconButtonProps` omits `onClick`
 * by design (D8 — primitives assume a form/server-action flow), and this
 * control's only job is a client-side clipboard write with no form to
 * submit. Same precedent `create-form-body.tsx` already established for
 * its Back/Next controls.
 */

export type CopyLinkProps = { url: string };

export function CopyLink({ url }: CopyLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access can be denied by the browser/permissions policy;
      // the readonly input still shows the URL to copy by hand.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        readOnly
        value={url}
        aria-label="Challenge URL"
        onFocus={(event) => event.currentTarget.select()}
        className="h-10 flex-1 rounded-control border border-border-subtle bg-surface-1 px-3 text-body text-text-primary"
      />
      <button
        type="button"
        aria-label="Copy link"
        onClick={handleCopy}
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control",
          "bg-transparent text-action-ghost-fg transition-colors hover:bg-surface-2 focus-visible:outline-none",
        )}
      >
        <Icon name="copy" />
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
