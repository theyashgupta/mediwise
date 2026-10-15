import { expect, type Page, test } from "@playwright/test";

const email = `e2e-ring-${Date.now()}@example.com`;
const password = "e2e-Password-1";

/**
 * Fails when a tier label overlaps the ring box without sitting fully inside the inner circle.
 *
 * @remarks
 * The ring is a circle of radius 52 with a 6 unit stroke in a 120 unit box, so the inner edge is at 49/120 of the width.
 */
async function expectTiersFit(page: Page) {
  const rings = page.getByTestId("score-ring-widest").getByRole("img");
  await expect(rings.first()).toBeVisible();
  const all = await rings.all();
  expect(all.length, "each size in English and Hindi").toBeGreaterThanOrEqual(6);
  for (const ring of all) {
    const circle = await ring.getByTestId("score-ring").boundingBox();
    const label = await ring.getByTestId("score-tier").boundingBox();
    if (!circle || !label) throw new Error("a ring or its tier label has no box");
    const outside =
      label.y >= circle.y + circle.height ||
      label.y + label.height <= circle.y ||
      label.x >= circle.x + circle.width ||
      label.x + label.width <= circle.x;
    const cx = circle.x + circle.width / 2;
    const cy = circle.y + circle.height / 2;
    const inner = (circle.width * 49) / 120;
    const corners: [number, number][] = [
      [label.x, label.y],
      [label.x + label.width, label.y],
      [label.x, label.y + label.height],
      [label.x + label.width, label.y + label.height],
    ];
    const inside = corners.every(([x, y]) => Math.hypot(x - cx, y - cy) <= inner);
    expect(
      outside || inside,
      `a ${label.width.toFixed(1)} px tier label crosses a ${circle.width} px ring`,
    ).toBe(true);
  }
}

test("the longest tier name fits inside each ring size or sits outside the ring", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-consent-terms").check();
  await page.getByTestId("auth-consent-health_data").check();
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("user-menu")).toBeVisible();

  await page.goto("/dev/kitchen-sink");
  await expectTiersFit(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectTiersFit(page);
});
