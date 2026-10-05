export type MagicLinkEmail = {
  subject: string;
  text: string;
  html: string;
};

/**
 * Escapes the four characters that matter inside an HTML attribute value.
 * The `href` carries `&`-separated query parameters; an unescaped `&` in
 * an attribute is tolerated by most mail clients and mangled by strict
 * ones — a silently dead link (design.md §5).
 */
function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Builds the magic-link email content — spec: "Magic-Link Email Delivery
 * Content and Channel". `siteName` is a parameter, not an import, so this
 * module stays free of `src/lib` and needs no fixture wiring to test
 * (design.md §5). Both a plain-text and an HTML part are returned;
 * multipart improves deliverability and some clients strip HTML.
 */
export function magicLinkEmail(input: {
  url: string;
  expiresInMinutes: number;
  siteName: string;
}): MagicLinkEmail {
  const { url, expiresInMinutes, siteName } = input;

  const subject = `Your sign-in link for ${siteName}`;

  const text = `Sign in to ${siteName}

Open this link to sign in:
${url}

The link expires in ${expiresInMinutes} minutes and works once.

If you didn't ask for this, ignore this email — nothing happened.`;

  const escapedUrl = escapeHtmlAttribute(url);
  const html = `<div style="font-family: sans-serif;">
  <p>Sign in to ${siteName}</p>
  <p><a href="${escapedUrl}">Sign in</a></p>
  <p>The link expires in ${expiresInMinutes} minutes and works once.</p>
  <p>If you didn't ask for this, ignore this email — nothing happened.</p>
</div>`;

  return { subject, text, html };
}
