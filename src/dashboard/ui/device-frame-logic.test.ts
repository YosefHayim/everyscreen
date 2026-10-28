import { describe, expect, test } from "vitest";
import type { FrameShape } from "@/devices/devices-logic";
import { pickFrameLayout } from "./device-frame-logic";

const SHAPES_WITH_CUTOUTS = [
  { frameShape: "dynamic-island", partCount: 3 },
  { frameShape: "punch-hole", partCount: 3 },
  { frameShape: "home-button", partCount: 3 },
  { frameShape: "tablet", partCount: 2 },
  { frameShape: "laptop", partCount: 3 },
] satisfies { frameShape: FrameShape; partCount: number }[];

// 360px wide viewport at the frame's reference scale of 0.36: bezel sizes stay as drawn.
const REFERENCE_SCREEN_WIDTH = 129.6;

const pickPhoneLayout = (frameShape: FrameShape) =>
  pickFrameLayout({
    frameShape,
    viewportWidth: 360,
    viewportHeight: 720,
    screenWidth: REFERENCE_SCREEN_WIDTH,
  });

describe("pickFrameLayout", () => {
  test("keeps the screen at the width it was given and scales its height with the viewport", () => {
    const layout = pickPhoneLayout("punch-hole");

    expect(layout.screenWidth).toBe(REFERENCE_SCREEN_WIDTH);
    expect(layout.screenHeight).toBe(259.2);
  });

  test("grows the frame bezel with the screen scale", () => {
    const smallLayout = pickPhoneLayout("home-button");
    const bigLayout = pickFrameLayout({
      frameShape: "home-button",
      viewportWidth: 360,
      viewportHeight: 720,
      screenWidth: REFERENCE_SCREEN_WIDTH * 2,
    });

    expect(bigLayout.screenTop).toBe(smallLayout.screenTop * 2);
  });

  test("draws the home button phone with a tall top and bottom bezel", () => {
    const layout = pickPhoneLayout("home-button");

    expect(layout.screenTop).toBe(30);
    expect(layout.height).toBe(259.2 + 30 * 2);
    expect(layout.screenCornerRadius).toBe("0px 0px 0px 0px");
  });

  test("draws the laptop with a base wider than the lid and a flat screen bottom", () => {
    const layout = pickPhoneLayout("laptop");

    expect(layout.width).toBeGreaterThan(
      layout.screenWidth + layout.screenLeft * 2 - 1,
    );
    expect(layout.screenLeft).toBeGreaterThan(layout.screenTop);
    expect(layout.screenCornerRadius).toBe("4px 4px 0px 0px");
  });

  test("draws the kiosk as a plain bezel with no cutouts", () => {
    const layout = pickPhoneLayout("kiosk");

    expect(layout.parts).toHaveLength(1);
    expect(layout.screenLeft).toBe(14);
  });

  test.each(SHAPES_WITH_CUTOUTS)(
    "lists $partCount parts for the $frameShape frame",
    ({ frameShape, partCount }) => {
      const layout = pickPhoneLayout(frameShape);

      expect(layout.parts).toHaveLength(partCount);
    },
  );

  test("paints the home button as an outline and the bezel as solid", () => {
    const layout = pickPhoneLayout("home-button");
    const paints = layout.parts.map((framePart) => framePart.paint);

    expect(paints).toEqual(["solid-frame", "solid-detail", "outline-detail"]);
  });
});
