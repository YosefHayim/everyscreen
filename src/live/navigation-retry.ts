import { errors, type Page } from "playwright";
import { pickErrorMessage } from "@/commands/commands-logic";

const NAVIGATION_SETTLE_TIMEOUT_MS = 3000;
const NAVIGATION_SETTLE_PAUSE_MS = 200;
const NAVIGATION_RACE_MESSAGE = "Execution context was destroyed";

export type SettlablePage = Pick<Page, "waitForTimeout" | "waitForLoadState">;

const waitForNewPage = async (page: SettlablePage): Promise<void> => {
  await page.waitForTimeout(NAVIGATION_SETTLE_PAUSE_MS);
  try {
    await page.waitForLoadState("domcontentloaded", {
      timeout: NAVIGATION_SETTLE_TIMEOUT_MS,
    });
  } catch (error) {
    const isSlowPage = error instanceof errors.TimeoutError;
    if (!isSlowPage) throw error;
  }
};

// A tap can start a redirect that destroys the page context mid-read. Read first; only on that error wait briefly and read once more.
export const retryAfterNavigation = async <Reading>(
  page: SettlablePage,
  readPage: () => Promise<Reading>,
): Promise<Reading> => {
  try {
    return await readPage();
  } catch (error) {
    const isNavigationRace = pickErrorMessage(error).includes(
      NAVIGATION_RACE_MESSAGE,
    );
    if (!isNavigationRace) throw error;
    await waitForNewPage(page);
    return readPage();
  }
};
