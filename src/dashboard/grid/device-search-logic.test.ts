import { describe, expect, test } from "vitest";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import {
  isSearchShortcut,
  pickMatchingDevices,
  pickShortcutHintKey,
} from "@/dashboard/grid/device-search-logic";

const createView = (name: string): DeviceView => ({
  deviceId: name.toLowerCase().replaceAll(" ", "-"),
  name,
  browserName: "chromium",
  frameShape: "punch-hole",
  platform: "android",
  cutout: null,
  cornerRadius: null,
  safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  viewportMode: "full-screen",
  viewportWidth: 412,
  viewportHeight: 915,
  screenWidth: 412,
  screenHeight: 915,
  pixelRatio: 2,
  hasTouch: true,
  isCustom: false,
});

const DEVICE_VIEWS = [
  createView("iPhone 17"),
  createView("Pixel 9"),
  createView("Galaxy S25"),
];

describe("pickMatchingDevices", () => {
  test("keeps every device for an empty search", () => {
    expect(pickMatchingDevices(DEVICE_VIEWS, "  ")).toEqual(DEVICE_VIEWS);
  });

  test("matches a part of the name in any letter case", () => {
    const matchingViews = pickMatchingDevices(DEVICE_VIEWS, " PIX");

    expect(matchingViews).toEqual([DEVICE_VIEWS[1]]);
  });

  test("returns no device when nothing matches", () => {
    expect(pickMatchingDevices(DEVICE_VIEWS, "nokia")).toEqual([]);
  });
});

describe("isSearchShortcut", () => {
  test("accepts cmd+k and ctrl+k in any letter case", () => {
    expect(isSearchShortcut({ key: "k", metaKey: true, ctrlKey: false })).toBe(
      true,
    );
    expect(isSearchShortcut({ key: "K", metaKey: false, ctrlKey: true })).toBe(
      true,
    );
  });

  test("rejects k alone and other keys with cmd", () => {
    expect(isSearchShortcut({ key: "k", metaKey: false, ctrlKey: false })).toBe(
      false,
    );
    expect(isSearchShortcut({ key: "j", metaKey: true, ctrlKey: false })).toBe(
      false,
    );
  });
});

describe("pickShortcutHintKey", () => {
  test("shows the cmd hint on a Mac", () => {
    const hintKey = pickShortcutHintKey(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    );

    expect(hintKey).toBe("shell.searchShortcutMac");
  });

  test("shows the ctrl hint elsewhere", () => {
    const hintKey = pickShortcutHintKey(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    );

    expect(hintKey).toBe("shell.searchShortcutOther");
  });
});
