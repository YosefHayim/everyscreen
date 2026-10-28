import { describe, expect, test } from "vitest";
import {
  type CatalogChoice,
  listMakerGroups,
  toggleGridDeviceId,
} from "@/dashboard/picker/picker-logic";

const createChoice = (changes: Partial<CatalogChoice>): CatalogChoice => ({
  id: "pixel-9",
  name: "Pixel 9",
  maker: "google",
  isHiddenByCustomDevice: false,
  ...changes,
});

describe("listMakerGroups", () => {
  test("groups by maker in a fixed order and skips empty makers", () => {
    const pixel = createChoice({});
    const iphone = createChoice({ id: "iphone-17", maker: "apple" });

    const makerGroups = listMakerGroups([pixel, iphone]);

    expect(makerGroups).toEqual([
      { maker: "apple", choices: [iphone] },
      { maker: "google", choices: [pixel] },
    ]);
  });

  test("hides a catalog device that a custom device replaced", () => {
    const hiddenChoice = createChoice({ isHiddenByCustomDevice: true });

    expect(listMakerGroups([hiddenChoice])).toEqual([]);
  });
});

describe("toggleGridDeviceId", () => {
  test("adds an id that is not in the grid", () => {
    expect(toggleGridDeviceId(["pixel-9"], "iphone-17")).toEqual([
      "pixel-9",
      "iphone-17",
    ]);
  });

  test("removes an id that is in the grid", () => {
    expect(toggleGridDeviceId(["pixel-9", "iphone-17"], "pixel-9")).toEqual([
      "iphone-17",
    ]);
  });
});
