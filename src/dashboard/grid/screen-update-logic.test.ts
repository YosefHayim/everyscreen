import { describe, expect, test } from "vitest";
import { pickScreenUpdate } from "@/dashboard/grid/screen-update-logic";

describe("pickScreenUpdate", () => {
  test("is live for chromium", () => {
    const screenUpdate = pickScreenUpdate("chromium");

    expect(screenUpdate).toBe("live");
  });

  test("is per step for webkit", () => {
    const screenUpdate = pickScreenUpdate("webkit");

    expect(screenUpdate).toBe("perStep");
  });

  test("is per step for firefox", () => {
    const screenUpdate = pickScreenUpdate("firefox");

    expect(screenUpdate).toBe("perStep");
  });
});
