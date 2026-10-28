import { describe, expect, test } from "vitest";
import {
  createDefaultFrameSpec,
  type FrameSpec,
  pickFitScale,
  pickFrameFamily,
  pickFrameLayout,
  pickStatusBarStyle,
} from "@/dashboard/frames/frame-layout-logic";

const createFrameSpec = (changes: Partial<FrameSpec>): FrameSpec => ({
  frameShape: "dynamic-island",
  platform: "ios",
  cutout: null,
  cornerRadius: null,
  safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  viewportMode: "full-screen",
  viewportWidth: 393,
  viewportHeight: 793,
  screenWidth: 393,
  screenHeight: 852,
  ...changes,
});

const createCutout = (
  kind: NonNullable<FrameSpec["cutout"]>["kind"],
  changes: Partial<NonNullable<FrameSpec["cutout"]>> = {},
): NonNullable<FrameSpec["cutout"]> => ({
  kind,
  width: null,
  height: null,
  top: null,
  left: null,
  ...changes,
});

describe("pickFrameFamily", () => {
  test.each([
    ["home-button", "phone-home-button"],
    ["dynamic-island", "phone-island"],
    ["punch-hole", "phone-hole-center"],
    ["tablet", "tablet"],
    ["laptop", "window-macos"],
    ["kiosk", "kiosk"],
  ] as const)(
    "uses the %s shape default when nothing else is known: %s",
    (frameShape, family) => {
      const frameSpec = createFrameSpec({ frameShape, platform: null });

      const pickedFamily = pickFrameFamily(frameSpec);

      expect(pickedFamily).toBe(family);
    },
  );

  test.each([
    ["none", "phone-plain"],
    ["notch", "phone-notch"],
    ["dynamic-island", "phone-island"],
    ["punch-hole-center", "phone-hole-center"],
    ["punch-hole-corner", "phone-hole-corner"],
    ["home-button", "phone-home-button"],
  ] as const)("draws a phone with a %s cutout as %s", (kind, family) => {
    const frameSpec = createFrameSpec({ cutout: createCutout(kind) });

    const pickedFamily = pickFrameFamily(frameSpec);

    expect(pickedFamily).toBe(family);
  });

  test.each([
    ["none", "tablet"],
    ["punch-hole-center", "tablet-hole"],
    ["home-button", "tablet-home-button"],
  ] as const)("draws a tablet with a %s cutout as %s", (kind, family) => {
    const frameSpec = createFrameSpec({
      frameShape: "tablet",
      cutout: createCutout(kind),
    });

    const pickedFamily = pickFrameFamily(frameSpec);

    expect(pickedFamily).toBe(family);
  });

  test.each([
    ["windows", "window-windows"],
    ["linux", "window-linux"],
    ["macos", "window-macos"],
  ] as const)("draws a %s laptop as %s", (platform, family) => {
    const frameSpec = createFrameSpec({ frameShape: "laptop", platform });

    const pickedFamily = pickFrameFamily(frameSpec);

    expect(pickedFamily).toBe(family);
  });

  test("ignores the cutout of a laptop", () => {
    const frameSpec = createFrameSpec({
      frameShape: "laptop",
      platform: "macos",
      cutout: createCutout("notch"),
    });

    const pickedFamily = pickFrameFamily(frameSpec);

    expect(pickedFamily).toBe("window-macos");
  });
});

describe("pickStatusBarStyle", () => {
  test.each([
    ["ios", "ios"],
    ["android", "android"],
    ["windows", null],
  ] as const)("reads the %s platform as %s", (platform, style) => {
    const frameSpec = createFrameSpec({ platform });

    const pickedStyle = pickStatusBarStyle(frameSpec);

    expect(pickedStyle).toBe(style);
  });

  test("falls back to the shape when the platform is unknown", () => {
    const frameSpec = createFrameSpec({
      platform: null,
      frameShape: "punch-hole",
    });

    const pickedStyle = pickStatusBarStyle(frameSpec);

    expect(pickedStyle).toBe("android");
  });
});

describe("pickFrameLayout", () => {
  test("draws a Dynamic Island phone at the catalog size plus its bezel", () => {
    const frameSpec = createFrameSpec({
      cornerRadius: 55,
      safeAreaInsets: { top: 59, bottom: 34, left: 0, right: 0 },
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.family).toBe("phone-island");
    expect(frameLayout.width).toBe(393 + 28);
    expect(frameLayout.height).toBe(852 + 26);
    expect(frameLayout.bodyRadius).toBe(55 + 14);
    expect(frameLayout.screen).toMatchObject({
      width: 393,
      height: 852,
      radius: 55,
    });
    expect(frameLayout.page).toEqual({
      left: 0,
      top: 59,
      width: 393,
      height: 793,
    });
    expect(frameLayout.cutout?.drawing).toBe("island");
    expect(frameLayout.cutout?.box).toEqual({
      left: 14 + 133.5,
      top: 13 + 11,
      width: 126,
      height: 37,
    });
    expect(frameLayout.statusBar).toMatchObject({
      style: "ios",
      startZoneWidth: 133.5,
      endZoneWidth: 133.5,
      centerY: 11 + 18.5,
      box: { left: 0, top: 0, width: 393, height: 59 },
    });
    expect(frameLayout.homeIndicator).toEqual({
      left: 129.5,
      top: 839,
      width: 134,
      height: 5,
    });
    expect(frameLayout.toolbar).toBeNull();
  });

  test("uses the published cutout geometry over the family default", () => {
    const frameSpec = createFrameSpec({
      frameShape: "punch-hole",
      platform: "android",
      cutout: createCutout("punch-hole-center", {
        width: 20,
        height: 22,
        top: 5,
        left: 100,
      }),
      viewportHeight: 822,
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.cutout?.box).toEqual({
      left: 12 + 100,
      top: 11 + 5,
      width: 20,
      height: 22,
    });
    expect(frameLayout.statusBar?.startZoneWidth).toBeNull();
    expect(frameLayout.statusBar?.centerY).toBe(16);
  });

  test("puts a corner punch hole at the family default left", () => {
    const frameSpec = createFrameSpec({
      frameShape: "punch-hole",
      platform: "android",
      cutout: createCutout("punch-hole-corner"),
      viewportHeight: 828,
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.family).toBe("phone-hole-corner");
    expect(frameLayout.cutout?.box.left).toBe(12 + 24);
    expect(frameLayout.statusBar?.box.height).toBe(24);
  });

  test("centers the status bar in the middle of the bar when the hole sits below it", () => {
    const frameSpec = createFrameSpec({
      frameShape: "punch-hole",
      platform: "android",
      cutout: createCutout("punch-hole-center", { top: 40 }),
      viewportHeight: 842,
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.statusBar?.centerY).toBe(5);
  });

  test("centers the status bar when a phone has no cutout", () => {
    const frameSpec = createFrameSpec({
      frameShape: "punch-hole",
      platform: "android",
      cutout: createCutout("none"),
      viewportHeight: 828,
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.family).toBe("phone-plain");
    expect(frameLayout.cutout).toBeNull();
    expect(frameLayout.statusBar?.centerY).toBe(12);
  });

  test("splits the status bar around a notch without centering on it", () => {
    const frameSpec = createFrameSpec({
      cutout: createCutout("notch"),
      frameShape: "dynamic-island",
      viewportHeight: 805,
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.family).toBe("phone-notch");
    expect(frameLayout.statusBar?.centerY).toBe(47 / 2);
    expect(frameLayout.statusBar?.startZoneWidth).toBe((393 - 209) / 2);
  });

  test("draws a home button phone with thick bezels and a round button", () => {
    const frameSpec = createFrameSpec({
      frameShape: "home-button",
      viewportWidth: 375,
      viewportHeight: 647,
      screenWidth: 375,
      screenHeight: 667,
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.family).toBe("phone-home-button");
    expect(frameLayout.width).toBe(375 + 56);
    expect(frameLayout.height).toBe(667 + 220);
    expect(frameLayout.bodyRadius).toBe(46);
    expect(frameLayout.cutout?.drawing).toBe("home-button");
    expect(frameLayout.cutout?.box).toEqual({
      left: 28 + (375 - 66) / 2,
      top: 110 + 667 + (110 - 66) / 2,
      width: 66,
      height: 66,
    });
    expect(frameLayout.homeIndicator).toBeNull();
  });

  test("draws a camera dot in the top bezel of a tablet", () => {
    const frameSpec = createFrameSpec({
      frameShape: "tablet",
      platform: "ipados",
      viewportWidth: 820,
      viewportHeight: 1156,
      screenWidth: 820,
      screenHeight: 1180,
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.family).toBe("tablet");
    expect(frameLayout.cutout?.drawing).toBe("camera");
    expect(frameLayout.cutout?.box.top).toBe((52 - 8) / 2);
    expect(frameLayout.statusBar?.style).toBe("ios");
  });

  test("stacks the status bar above the page so it never covers it in full-screen mode", () => {
    const frameSpec = createFrameSpec({});

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.statusBar?.box.height).toBe(59);
    expect(frameLayout.page.top).toBe(frameLayout.statusBar?.box.height);
    expect(frameLayout.screen.height).toBe(
      frameLayout.page.top + frameLayout.page.height,
    );
    expect(frameLayout.toolbar).toBeNull();
  });

  test("draws no status bar when the page fills the whole screen", () => {
    const frameSpec = createFrameSpec({ viewportHeight: 852 });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.statusBar).toBeNull();
    expect(frameLayout.page.top).toBe(0);
  });

  test("adds a bottom toolbar under the page for an iOS browser view with a known gap", () => {
    const frameSpec = createFrameSpec({
      viewportMode: "browser",
      viewportHeight: 659,
      safeAreaInsets: { top: 59, bottom: 0, left: 0, right: 0 },
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.screen.height).toBe(852);
    expect(frameLayout.page).toEqual({
      left: 0,
      top: 59,
      width: 393,
      height: 659,
    });
    expect(frameLayout.toolbar).toEqual({
      left: 0,
      top: 59 + 659,
      width: 393,
      height: 134,
    });
  });

  test("adds the family toolbar above the page for an Android browser view with no known gap", () => {
    const frameSpec = createFrameSpec({
      frameShape: "punch-hole",
      platform: "android",
      viewportMode: "browser",
      viewportWidth: 412,
      viewportHeight: 915,
      screenWidth: 412,
      screenHeight: 915,
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.screen.height).toBe(915 + 24 + 56);
    expect(frameLayout.page.top).toBe(24 + 56);
    expect(frameLayout.toolbar).toEqual({
      left: 0,
      top: 24,
      width: 412,
      height: 56,
    });
  });

  test("draws no browser chrome when the device has no status bar", () => {
    const frameSpec = createFrameSpec({
      frameShape: "kiosk",
      platform: null,
      viewportMode: "browser",
      viewportWidth: 800,
      viewportHeight: 1280,
      screenWidth: 800,
      screenHeight: 1280,
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameLayout.family).toBe("kiosk");
    expect(frameLayout.toolbar).toBeNull();
    expect(frameLayout.statusBar).toBeNull();
    expect(frameLayout.homeIndicator).toBeNull();
    expect(frameLayout.width).toBe(800 + 28);
  });

  test.each([
    ["macos", 52, 14],
    ["windows", 80, 8],
    ["linux", 47, 12],
  ] as const)(
    "draws a %s window with a %s px bar and radius %s",
    (platform, barHeight, radius) => {
      const frameSpec = createFrameSpec({
        frameShape: "laptop",
        platform,
        cornerRadius: 0,
        viewportWidth: 1440,
        viewportHeight: 900,
        screenWidth: 1440,
        screenHeight: 900,
      });

      const frameLayout = pickFrameLayout(frameSpec);

      expect(frameLayout.windowBar?.kind).toBe(platform);
      expect(frameLayout.height).toBe(900 + barHeight);
      expect(frameLayout.width).toBe(1440);
      expect(frameLayout.bodyRadius).toBe(radius);
      expect(frameLayout.page).toEqual({
        left: 0,
        top: barHeight,
        width: 1440,
        height: 900,
      });
      expect(frameLayout.statusBar).toBeNull();
      expect(frameLayout.cutout).toBeNull();
    },
  );
});

describe("pickFitScale", () => {
  test("shrinks to the tighter side of the box", () => {
    const frameSize = { width: 400, height: 800 };

    const widthBound = pickFitScale(frameSize, { width: 100, height: 800 });
    const heightBound = pickFitScale(frameSize, { width: 400, height: 200 });

    expect(widthBound).toBe(0.25);
    expect(heightBound).toBe(0.25);
  });

  test("never grows past true size", () => {
    const frameSize = { width: 400, height: 800 };

    const fitScale = pickFitScale(frameSize, { width: 4000, height: 8000 });

    expect(fitScale).toBe(1);
  });
});

describe("createDefaultFrameSpec", () => {
  test("describes a full-screen device with the shape defaults", () => {
    const frameSpec = createDefaultFrameSpec("home-button", {
      width: 375,
      height: 667,
    });

    const frameLayout = pickFrameLayout(frameSpec);

    expect(frameSpec.platform).toBeNull();
    expect(frameSpec.screenHeight).toBe(667);
    expect(frameLayout.family).toBe("phone-home-button");
  });
});
