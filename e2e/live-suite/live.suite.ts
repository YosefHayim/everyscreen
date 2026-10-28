import { expect, test } from "@/playwright/playwright-fixture";

const GREEN_PAGE_URL = `data:text/html,${encodeURIComponent('<!doctype html><title>Live suite</title><meta name="viewport" content="width=device-width"><body style="margin:0;background:rgb(34,170,102);height:100vh"><p style="margin:0">Live suite</p></body>')}`;
const WATCH_PAUSE_MS = 5000;

// Serial mode keeps each device on one test at a time while the devices run side by side.
test.describe("live suite", () => {
  test.describe.configure({ mode: "serial" });

  test("shows the green page", async ({ page }) => {
    await page.goto(GREEN_PAGE_URL);
    await page.waitForTimeout(WATCH_PAUSE_MS);

    await expect(page).toHaveTitle("Live suite");
  });

  test("fails on purpose", async ({ page }) => {
    await page.goto(GREEN_PAGE_URL);
    await page.waitForTimeout(WATCH_PAUSE_MS);

    await expect(page).toHaveTitle("Another title");
  });
});
