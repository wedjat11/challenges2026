import { expect, test } from "@playwright/test";

import { signIn } from "./fixtures/session";

/**
 * challenge-participation: Automated End-to-End Coverage of Create-Then-Join.
 *
 * Exercises the real app against a seeded local D1 (D17), signing in via
 * cookie injection only (D16, A14) — no production authentication bypass is
 * ever invoked. Ids match `e2e/fixtures/seed.sql`.
 *
 * **Step 2 reconciliation, stated plainly.** Design.md's own spec sketch says
 * "click Join" for the signed-out visitor, but that control does not exist:
 * S5b's owner-approved deviation (see apply-progress.md's S5b section)
 * renders a "Sign in to join" link to `/login?from=/challenges/{id}` for a
 * signed-out visitor instead of a Join button, because the page is already
 * readable signed out and a submit-then-redirect round trip is a worse
 * experience than showing the correct next step up front. This spec asserts
 * what the product actually does — the link, its exact `href`, and that
 * following it lands on `/login` — and separately covers the D18 redirect
 * path where it truly exists: a direct signed-out visit to
 * `/account?reason=sign-in-to-join` renders the banner.
 */

const USER_A = { id: "e2e-user-a", discordId: "e2e-discord-a", name: "E2E User A" };
const USER_B = { id: "e2e-user-b", discordId: "e2e-discord-b", name: "E2E User B" };
const ACCOUNT_A_NAME = "E2E Player A#NA1";
const ACCOUNT_B_NAME = "E2E Player B#NA2";

/** `<input type="datetime-local">`'s expected local-time format, no seconds. */
function formatDatetimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

test("create-then-join", async ({ browser }) => {
  test.setTimeout(90_000);

  // 1. Context A, signed in as user A, creates a challenge via the "Play N
  // games" preset with target 5, self-joining.
  const contextA = await browser.newContext();
  await signIn(contextA, USER_A);
  const pageA = await contextA.newPage();

  await pageA.goto("/challenges/new");

  await pageA.getByRole("button", { name: /Play N games/ }).click();
  await pageA.getByRole("button", { name: "Next", exact: true }).click();

  await pageA.getByLabel("Rule 1 target").fill("5");
  await pageA.getByRole("button", { name: "Next", exact: true }).click();

  const title = `E2E ${Date.now()}`;
  const startsAt = new Date(Date.now() - 60 * 60 * 1000);
  const endsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  await pageA.getByLabel("Title").fill(title);
  await pageA.getByLabel("Starts").fill(formatDatetimeLocal(startsAt));
  await pageA.getByLabel("Ends").fill(formatDatetimeLocal(endsAt));
  await pageA.getByLabel("Join this challenge").check();

  await pageA.getByRole("button", { name: "Next", exact: true }).click();
  // Two DOM matches exist (`CreateFormBody` keeps every wizard step mounted,
  // only hidden via the `hidden` attribute): the "rules" step's own rule
  // preview, and the "review" step's summary list — this one, later in DOM
  // order.
  await expect(pageA.getByText("Play 5 games", { exact: true }).last()).toBeVisible();

  await pageA.getByRole("button", { name: "Create challenge" }).click();
  await expect(pageA).toHaveURL(/\/challenges\/[0-9a-f-]{36}$/);

  const challengeId = new URL(pageA.url()).pathname.split("/").pop() as string;

  // 2. A signed-out context reads the same page (unauthenticated read is
  // allowed), sees "Sign in to join" instead of a Join button, and following
  // it lands on /login. The D18 redirect-with-reason path is also covered
  // directly, since no unauthenticated submit is possible from this UI.
  const signedOutContext = await browser.newContext();
  const signedOutPage = await signedOutContext.newPage();

  await signedOutPage.goto(`/challenges/${challengeId}`);
  await expect(signedOutPage.getByRole("heading", { name: title })).toBeVisible();

  const signInLink = signedOutPage.getByRole("link", { name: "Sign in to join" });
  await expect(signInLink).toHaveAttribute(
    "href",
    `/login?from=%2Fchallenges%2F${challengeId}`,
  );
  await signInLink.click();
  await expect(signedOutPage).toHaveURL(/\/login/);

  await signedOutPage.goto("/account?reason=sign-in-to-join");
  await expect(signedOutPage.getByText("Sign in to join that challenge.")).toBeVisible();

  await signedOutContext.close();

  // 3. Context B, signed in as user B, joins. Inline confirmation, then after
  // a reload both display names appear as participants at 0 / 5.
  const contextB = await browser.newContext();
  await signIn(contextB, USER_B);
  const pageB = await contextB.newPage();

  await pageB.goto(`/challenges/${challengeId}`);
  await pageB.getByRole("button", { name: "Join" }).click();
  // An unrelated empty `role="status"` sr-only region exists elsewhere on
  // the page; `hasText` scopes to the join form's own non-empty one.
  const joinStatusB = pageB.getByRole("status").filter({ hasText: "joined" });
  await expect(joinStatusB).toHaveText(`You joined with ${ACCOUNT_B_NAME}.`);

  await pageB.reload();
  await expect(pageB.getByText(ACCOUNT_A_NAME, { exact: true })).toBeVisible();
  await expect(pageB.getByText(ACCOUNT_B_NAME, { exact: true })).toBeVisible();
  await expect(pageB.getByText("0 / 5")).toHaveCount(2);

  // 4. Joining again reports "already joined" and leaves the participant
  // count unchanged.
  await pageB.getByRole("button", { name: "Join" }).click();
  await expect(joinStatusB).toHaveText("You have already joined this challenge.");
  await expect(pageB.getByText("0 / 5")).toHaveCount(2);

  await contextB.close();

  // 5. /challenges lists the created challenge.
  await pageA.goto("/challenges");
  await expect(pageA.getByRole("heading", { name: title, level: 3 })).toBeVisible();

  await contextA.close();
});
