import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LoginPanel } from "@/app/login/login-panel";

/**
 * Static-render tests, matching `create-form-body.test.tsx` and the
 * `src/components/ui/*.test.tsx` pattern: `renderToStaticMarkup`, no jsdom,
 * assertions on rendered text/attributes rather than Tailwind class names.
 *
 * `action` never runs in these tests — `renderToStaticMarkup` performs an
 * initial, non-interactive render only, so a no-op stand-in is enough to
 * exercise every prop-driven branch (`from` present/absent, `error`
 * present/absent). The real `action` prop is the Server Function wired up
 * in `page.tsx`, which is untested per this feature's environment
 * constraints (`@/auth` cannot be imported under Vitest).
 */

function noopAction(): void {
  // Stand-in for the Server Function `action` prop — never invoked by a
  // static, non-interactive render.
}

describe("LoginPanel — main state", () => {
  it("renders the wordmark, headline and Discord submit button", () => {
    const html = renderToStaticMarkup(<LoginPanel action={noopAction} />);

    expect(html).toContain("Become");
    expect(html).toContain("a Legend");
    expect(html).toContain("Your friends.");
    expect(html).toContain("Your rules.");
    expect(html).toContain("Your legend.");
    expect(html).toContain("<form");
    expect(html).toContain('type="submit"');
    expect(html).toContain("Sign in with Discord");
  });

  it("does not render the error alert region", () => {
    const html = renderToStaticMarkup(<LoginPanel action={noopAction} />);

    expect(html).not.toContain('role="alert"');
  });

  it("does not render a hidden from field when from is absent", () => {
    const html = renderToStaticMarkup(<LoginPanel action={noopAction} />);

    expect(html).not.toContain('name="from"');
  });

  it("renders a hidden from field carrying the given value when from is set", () => {
    const html = renderToStaticMarkup(
      <LoginPanel action={noopAction} from="/challenges/new" />,
    );

    expect(html).toContain('type="hidden"');
    expect(html).toContain('name="from"');
    expect(html).toContain('value="/challenges/new"');
  });

  it("links the legal line to /terms and /privacy", () => {
    const html = renderToStaticMarkup(<LoginPanel action={noopAction} />);

    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/privacy"');
  });
});

describe("LoginPanel — error state", () => {
  // No apostrophe: react-dom/server HTML-escapes text content (`'` becomes
  // `&#x27;`), so a literal `indexOf` match needs a quote-free fixture.
  const error = { title: "Sign-in failed.", body: "Discord did not respond. Try again." };

  it("renders the error title and body inside a role=alert region", () => {
    const html = renderToStaticMarkup(<LoginPanel action={noopAction} error={error} />);

    const alertIndex = html.indexOf('role="alert"');
    expect(alertIndex).toBeGreaterThan(-1);
    expect(html.indexOf(error.title)).toBeGreaterThan(alertIndex);
    expect(html.indexOf(error.body)).toBeGreaterThan(alertIndex);
  });

  it("relabels the submit button as Try again instead of Sign in with Discord", () => {
    const html = renderToStaticMarkup(<LoginPanel action={noopAction} error={error} />);

    expect(html).toContain("Try again");
    expect(html).not.toContain("Sign in with Discord");
  });

  it("does not render the main-state headline while showing an error", () => {
    const html = renderToStaticMarkup(<LoginPanel action={noopAction} error={error} />);

    expect(html).not.toContain("Your friends.");
  });
});
