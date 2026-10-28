import { describe, expect, test } from "vitest";
import {
  isOpenAppCardShown,
  isSetupGuideShown,
  pickSetupStepProgress,
} from "@/dashboard/grid/setup-steps-logic";

describe("pickSetupStepProgress", () => {
  test("asks for the hub while the live feed is connecting", () => {
    const progress = pickSetupStepProgress("connecting", false, false);

    expect(progress.map((step) => step.status)).toEqual([
      "now",
      "later",
      "later",
    ]);
  });

  test("asks for the hub when the live feed is closed", () => {
    const progress = pickSetupStepProgress("closed", false, false);

    expect(progress.map((step) => step.status)).toEqual([
      "now",
      "later",
      "later",
    ]);
  });

  test("asks to open the app when the hub is open and no screen image came", () => {
    const progress = pickSetupStepProgress("open", false, false);

    expect(progress.map((step) => step.status)).toEqual([
      "done",
      "now",
      "later",
    ]);
  });

  test("asks to run the tests once a screen image has arrived", () => {
    const progress = pickSetupStepProgress("open", true, false);

    expect(progress.map((step) => step.status)).toEqual([
      "done",
      "done",
      "now",
    ]);
  });

  test("keeps the app step later when a screen image is left from a closed feed", () => {
    const progress = pickSetupStepProgress("closed", true, false);

    expect(progress.map((step) => step.status)).toEqual([
      "now",
      "later",
      "later",
    ]);
  });

  test("marks the tests step done once a run exists", () => {
    const progress = pickSetupStepProgress("open", true, true);

    expect(progress.map((step) => step.status)).toEqual([
      "done",
      "done",
      "done",
    ]);
  });

  test("names the three steps in order", () => {
    const progress = pickSetupStepProgress("open", false, false);

    expect(progress.map((step) => step.stepKey)).toEqual([
      "startHub",
      "openApp",
      "runTests",
    ]);
  });
});

describe("isOpenAppCardShown", () => {
  test("shows the card while the live feed is closed", () => {
    expect(isOpenAppCardShown("closed", false)).toBe(true);
  });

  test("shows the card when the hub is open and no screen image came", () => {
    expect(isOpenAppCardShown("open", false)).toBe(true);
  });

  test("hides the card once a screen image has arrived", () => {
    expect(isOpenAppCardShown("open", true)).toBe(false);
  });

  test("shows the card when a screen image is left from a closed feed", () => {
    expect(isOpenAppCardShown("closed", true)).toBe(true);
  });
});

describe("isSetupGuideShown", () => {
  test("shows the guide before any run", () => {
    expect(isSetupGuideShown(false)).toBe(true);
  });

  test("hides the guide once a run exists", () => {
    expect(isSetupGuideShown(true)).toBe(false);
  });
});
