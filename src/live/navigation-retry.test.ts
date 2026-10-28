import { describe, expect, test, vi } from "vitest";
import {
  retryAfterNavigation,
  type SettlablePage,
} from "@/live/navigation-retry";

const createFakePage = () => {
  const waitForTimeout = vi.fn(async () => {});
  const waitForLoadState = vi.fn(async () => {});
  const fakePage = { waitForTimeout, waitForLoadState } satisfies SettlablePage;
  return { fakePage, waitForTimeout, waitForLoadState };
};

describe("retryAfterNavigation", () => {
  test("reads a page that never fires load without waiting for it", async () => {
    const { fakePage, waitForLoadState } = createFakePage();
    const readPage = vi.fn(async () => "measured");

    const reading = await retryAfterNavigation(fakePage, readPage);

    expect(reading).toBe("measured");
    expect(readPage).toHaveBeenCalledTimes(1);
    expect(waitForLoadState).not.toHaveBeenCalled();
  });

  test("waits for the new page and reads again after a navigation race", async () => {
    const { fakePage, waitForLoadState } = createFakePage();
    const readPage = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(
        new Error(
          "page.evaluate: Execution context was destroyed, most likely because of a navigation",
        ),
      )
      .mockResolvedValueOnce("measured");

    const reading = await retryAfterNavigation(fakePage, readPage);

    expect(reading).toBe("measured");
    expect(readPage).toHaveBeenCalledTimes(2);
    expect(waitForLoadState).toHaveBeenCalledTimes(1);
  });

  test("throws any other error without reading again", async () => {
    const { fakePage } = createFakePage();
    const readPage = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error("boom"));

    const failure = retryAfterNavigation(fakePage, readPage);

    await expect(failure).rejects.toThrow("boom");
    expect(readPage).toHaveBeenCalledTimes(1);
  });
});
