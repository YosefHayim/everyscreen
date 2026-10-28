import { describe, expect, test } from "vitest";
import { pickSetupStepProgress } from "@/dashboard/grid/setup-steps-logic";

describe("pickSetupStepProgress", () => {
  test("asks for the hub while the live feed is connecting", () => {
    const progress = pickSetupStepProgress("connecting", false);

    expect(progress.map((step) => step.status)).toEqual([
      "now",
      "later",
      "later",
    ]);
  });

  test("asks for the hub when the live feed is closed", () => {
    const progress = pickSetupStepProgress("closed", false);

    expect(progress.map((step) => step.status)).toEqual([
      "now",
      "later",
      "later",
    ]);
  });

  test("asks to open the app when the hub is open and no screen image came", () => {
    const progress = pickSetupStepProgress("open", false);

    expect(progress.map((step) => step.status)).toEqual([
      "done",
      "now",
      "later",
    ]);
  });

  test("asks to run the tests once a screen image has arrived", () => {
    const progress = pickSetupStepProgress("open", true);

    expect(progress.map((step) => step.status)).toEqual([
      "done",
      "done",
      "now",
    ]);
  });

  test("keeps the app step later when a screen image is left from a closed feed", () => {
    const progress = pickSetupStepProgress("closed", true);

    expect(progress.map((step) => step.status)).toEqual([
      "now",
      "later",
      "later",
    ]);
  });

  test("names the three steps in order", () => {
    const progress = pickSetupStepProgress("open", false);

    expect(progress.map((step) => step.stepKey)).toEqual([
      "startHub",
      "openApp",
      "runTests",
    ]);
  });
});
