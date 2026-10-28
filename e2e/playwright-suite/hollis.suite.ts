import { expect, test } from "@playwright/test";

const hollisUrl = process.env.HOLLIS_URL;
const isHollisUrlMissing = hollisUrl === undefined;
if (isHollisUrlMissing) throw new Error("Set HOLLIS_URL to the shop page");

test.describe("hollis goods", () => {
  test("shows the shop name", async ({ page }) => {
    await page.goto(hollisUrl);

    await expect(page).toHaveTitle("Hollis Goods");
  });

  test("shows a wishlist button", async ({ page }) => {
    await page.goto(hollisUrl);

    await expect(page.getByRole("button", { name: "Wishlist" })).toBeVisible();
  });
});
