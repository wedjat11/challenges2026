import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JoinFormBody, messageFor } from "@/app/challenges/[id]/join-form-body";
import type { RiotAccount } from "@/domain/ports/riot-account-repository";

/**
 * Static-render tests, matching `create-form-body.test.tsx`: no jsdom,
 * assertions on rendered markup/text (strict-tdd's Implementation Detail
 * Coupling Rule). `messageFor` is a pure function, tested directly with no
 * render at all.
 */

function account(overrides: Partial<RiotAccount> = {}): RiotAccount {
  return {
    id: "acc-1",
    userId: "user-1",
    puuid: "puuid-1",
    gameName: "Riven",
    tagLine: "NA1",
    platform: "na1",
    region: "americas",
    verified: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("messageFor", () => {
  it("maps 'joined' to a message naming the account", () => {
    expect(messageFor({ kind: "joined" }, "Riven#NA1")).toBe("You joined with Riven#NA1.");
  });

  it("maps 'already_joined' to its exact message", () => {
    expect(messageFor({ kind: "already_joined" }, "Riven#NA1")).toBe(
      "You have already joined this challenge.",
    );
  });

  it("maps 'challenge_ended' to its exact message", () => {
    expect(messageFor({ kind: "challenge_ended" }, "Riven#NA1")).toBe(
      "This challenge has ended, so it can no longer be joined.",
    );
  });

  it("maps 'challenge_not_found' to its exact message", () => {
    expect(messageFor({ kind: "challenge_not_found" }, "Riven#NA1")).toBe(
      "This challenge no longer exists.",
    );
  });

  it("maps 'riot_account_not_owned' to its exact message", () => {
    expect(messageFor({ kind: "riot_account_not_owned" }, "Riven#NA1")).toBe(
      "That Riot account is not linked to your sign-in.",
    );
  });

  it("returns null when there is no state yet", () => {
    expect(messageFor(null, "Riven#NA1")).toBeNull();
  });
});

describe("JoinFormBody", () => {
  it("renders a hidden challengeId field with the exact id", () => {
    const html = renderToStaticMarkup(
      <JoinFormBody
        challengeId="abc-123"
        accounts={[account()]}
        state={null}
        formAction={() => {}}
        pending={false}
      />,
    );

    expect(html).toContain('name="challengeId"');
    expect(html).toContain('value="abc-123"');
  });

  it("renders no picker for a single linked account, using it directly via a hidden field", () => {
    const html = renderToStaticMarkup(
      <JoinFormBody
        challengeId="abc-123"
        accounts={[account()]}
        state={null}
        formAction={() => {}}
        pending={false}
      />,
    );

    expect(html).not.toContain("<select");
    expect(html).toContain('name="riotAccountId"');
    expect(html).toContain('value="acc-1"');
  });

  it("renders a Select to choose among multiple linked accounts", () => {
    const html = renderToStaticMarkup(
      <JoinFormBody
        challengeId="abc-123"
        accounts={[account(), account({ id: "acc-2", gameName: "Ahri", tagLine: "EUW" })]}
        state={null}
        formAction={() => {}}
        pending={false}
      />,
    );

    expect(html).toContain("<select");
    expect(html).toContain("Riven#NA1");
    expect(html).toContain("Ahri#EUW");
  });

  it("blocks resubmission and shows a loading indicator while pending", () => {
    const idle = renderToStaticMarkup(
      <JoinFormBody
        challengeId="abc-123"
        accounts={[account()]}
        state={null}
        formAction={() => {}}
        pending={false}
      />,
    );
    const pending = renderToStaticMarkup(
      <JoinFormBody
        challengeId="abc-123"
        accounts={[account()]}
        state={null}
        formAction={() => {}}
        pending
      />,
    );

    expect(idle).not.toContain("aria-busy");
    expect(pending).toContain('aria-busy="true"');
  });

  it("renders the inline result message in a role=status region", () => {
    const html = renderToStaticMarkup(
      <JoinFormBody
        challengeId="abc-123"
        accounts={[account()]}
        state={{ kind: "joined" }}
        formAction={() => {}}
        pending={false}
      />,
    );

    expect(html).toMatch(/role="status"[^>]*>You joined with Riven#NA1\./);
  });

  it("renders no result region before any submission", () => {
    const html = renderToStaticMarkup(
      <JoinFormBody
        challengeId="abc-123"
        accounts={[account()]}
        state={null}
        formAction={() => {}}
        pending={false}
      />,
    );

    expect(html).not.toContain('role="status"');
  });
});
