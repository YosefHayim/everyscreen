import type { Page } from "playwright";
import { pickErrorMessage } from "@/commands/commands-logic";

const ATTEMPTS = 5;
const SETTLE_MS = 200;
const NAVIGATION_RACE_MESSAGE = "Execution context was destroyed";

// A tap can start a redirect that destroys the page context mid-read; wait for the new page and read again.
export const retryAfterNavigation = async <Reading>(
  page: Page,
  readPage: () => Promise<Reading>,
): Promise<Reading> => {
  for (let attempt = 1; attempt < ATTEMPTS; attempt += 1) {
    try {
      await page.waitForLoadState("load");
      return await readPage();
    } catch (error) {
      const isNavigationRace = pickErrorMessage(error).includes(
        NAVIGATION_RACE_MESSAGE,
      );
      if (!isNavigationRace) throw error;
      await page.waitForTimeout(SETTLE_MS);
    }
  }
  await page.waitForLoadState("load");
  return readPage();
};
