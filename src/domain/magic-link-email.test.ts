import { describe, expect, it } from "vitest";

import { magicLinkEmail } from "@/domain/magic-link-email";

/**
 * Pins the exact content design.md §5 specifies: subject names the site,
 * both parts state the link's URL exactly once and its expiry in minutes,
 * the HTML `href` is escaped (and round-trips back to the original URL),
 * and neither part ever mentions Discord — spec: "Magic-Link Email
 * Delivery Content and Channel", "No Token Leakage in Logs".
 */
describe("magicLinkEmail", () => {
  const url = "https://example.com/api/auth/callback/resend?token=abc&email=alice%40example.com";

  it("includes the siteName in the subject", () => {
    const email = magicLinkEmail({ url, expiresInMinutes: 15, siteName: "Become a Legend" });

    expect(email.subject).toBe("Your sign-in link for Become a Legend");
  });

  it("includes the exact URL once in the text part", () => {
    const email = magicLinkEmail({ url, expiresInMinutes: 15, siteName: "Become a Legend" });

    const occurrences = email.text.split(url).length - 1;
    expect(occurrences).toBe(1);
  });

  it("includes the escaped URL exactly once in the html part", () => {
    const email = magicLinkEmail({ url, expiresInMinutes: 15, siteName: "Become a Legend" });

    const escapedUrl = "https://example.com/api/auth/callback/resend?token=abc&amp;email=alice%40example.com";
    const occurrences = email.html.split(escapedUrl).length - 1;
    expect(occurrences).toBe(1);
  });

  it("unescaping the html href yields the original URL byte-for-byte", () => {
    const email = magicLinkEmail({ url, expiresInMinutes: 15, siteName: "Become a Legend" });

    const match = email.html.match(/href="([^"]*)"/);
    expect(match).not.toBeNull();

    const href = match?.[1];
    expect(href).toBeDefined();

    const unescaped = (href ?? "")
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"');

    expect(unescaped).toBe(url);
  });

  it("states the expiry in minutes in both the text and html parts", () => {
    const email = magicLinkEmail({ url, expiresInMinutes: 42, siteName: "Become a Legend" });

    expect(email.text).toContain("42 minutes");
    expect(email.html).toContain("42 minutes");
  });

  it("never mentions Discord in any part", () => {
    const email = magicLinkEmail({ url, expiresInMinutes: 15, siteName: "Become a Legend" });

    expect(email.subject).not.toContain("Discord");
    expect(email.text).not.toContain("Discord");
    expect(email.html).not.toContain("Discord");
  });
});
