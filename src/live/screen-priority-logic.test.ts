import { describe, expect, test } from "vitest";
import { isScreenAccepted, pickScreenPhase } from "./screen-priority-logic";

describe("pickScreenPhase", () => {
  test("follows the hub while a test runs", () => {
    expect(pickScreenPhase(["running"])).toBe("following-hub");
  });

  test("follows the hub while one of several tests still runs", () => {
    expect(pickScreenPhase(["ok", "running", "failed"])).toBe("following-hub");
  });

  test("keeps the test screen once every test finished", () => {
    expect(pickScreenPhase(["ok", "failed"])).toBe("keeping-test-screen");
  });
});

describe("isScreenAccepted", () => {
  test("accepts a hub screen while following the hub", () => {
    expect(isScreenAccepted("hub", "following-hub")).toBe(true);
  });

  test("rejects a hub screen while keeping the test screen", () => {
    expect(isScreenAccepted("hub", "keeping-test-screen")).toBe(false);
  });

  test("accepts a test screen in both phases", () => {
    expect(isScreenAccepted("test-run", "following-hub")).toBe(true);
    expect(isScreenAccepted("test-run", "keeping-test-screen")).toBe(true);
  });
});
