import { describe, expect, test } from "vitest";
import { pickScreenStatus } from "@/dashboard/ui/screen-status-logic";

describe("pickScreenStatus", () => {
  test("is loading while the query is pending", () => {
    expect(pickScreenStatus("pending", true)).toBe("loading");
  });

  test("is failed when the query failed", () => {
    expect(pickScreenStatus("error", false)).toBe("failed");
  });

  test("is empty when the query loaded nothing", () => {
    expect(pickScreenStatus("success", true)).toBe("empty");
  });

  test("is ready when the query loaded something", () => {
    expect(pickScreenStatus("success", false)).toBe("ready");
  });
});
