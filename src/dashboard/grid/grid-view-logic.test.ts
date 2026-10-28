import { describe, expect, test } from "vitest";
import {
  DEFAULT_GRID_VIEW,
  type GridView,
  pickFrameScale,
  pickGridColumns,
  pickGridView,
  pickTilePadding,
  stepScalePercent,
} from "@/dashboard/grid/grid-view-logic";

const createGridView = (changes: Partial<GridView>): GridView => ({
  ...DEFAULT_GRID_VIEW,
  ...changes,
});

describe("pickGridView", () => {
  test("keeps a stored view that passes the schema", () => {
    const storedGridView = {
      sizeMode: "true-size",
      density: "comfortable",
      scalePercent: 70,
    };

    const gridView = pickGridView(storedGridView);

    expect(gridView).toEqual(storedGridView);
  });

  test("falls back to the default for nothing stored", () => {
    const gridView = pickGridView(null);

    expect(gridView).toEqual(DEFAULT_GRID_VIEW);
  });

  test("falls back to the default for a scale out of range", () => {
    const gridView = pickGridView({ ...DEFAULT_GRID_VIEW, scalePercent: 900 });

    expect(gridView).toEqual(DEFAULT_GRID_VIEW);
  });
});

describe("stepScalePercent", () => {
  test("steps by ten percent", () => {
    expect(stepScalePercent(100, "larger")).toBe(110);
    expect(stepScalePercent(100, "smaller")).toBe(90);
  });

  test("stops at the smallest and largest scale", () => {
    expect(stepScalePercent(30, "smaller")).toBe(30);
    expect(stepScalePercent(200, "larger")).toBe(200);
  });
});

describe("pickFrameScale", () => {
  test("draws true size at the scale percent", () => {
    const gridView = createGridView({
      sizeMode: "true-size",
      scalePercent: 50,
    });

    const frameScale = pickFrameScale({ width: 400, height: 800 }, gridView);

    expect(frameScale).toBe(0.5);
  });

  test("fits a tall frame into the compact column height", () => {
    const frameScale = pickFrameScale(
      { width: 100, height: 878 },
      DEFAULT_GRID_VIEW,
    );

    expect(frameScale).toBeCloseTo((420 - 8) / 878, 5);
  });

  test("fits a wide frame into the comfortable column width", () => {
    const gridView = createGridView({ density: "comfortable" });

    const frameScale = pickFrameScale({ width: 1440, height: 952 }, gridView);

    expect(frameScale).toBeCloseTo((240 - 16) / 1440, 5);
  });

  test("never grows a small frame past true size", () => {
    const frameScale = pickFrameScale(
      { width: 50, height: 50 },
      DEFAULT_GRID_VIEW,
    );

    expect(frameScale).toBe(1);
  });

  test("grows the fit box with the scale percent", () => {
    const gridView = createGridView({ scalePercent: 200 });

    const frameScale = pickFrameScale({ width: 100, height: 878 }, gridView);

    expect(frameScale).toBeCloseTo((840 - 8) / 878, 5);
  });
});

describe("pickGridColumns", () => {
  test("gives auto-fill columns in fit mode", () => {
    const gridColumns = pickGridColumns(DEFAULT_GRID_VIEW);

    expect(gridColumns).toEqual({
      gap: 8,
      template: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
    });
  });

  test("scales the column width with the scale percent", () => {
    const gridView = createGridView({
      density: "comfortable",
      scalePercent: 50,
    });

    const gridColumns = pickGridColumns(gridView);

    expect(gridColumns.template).toContain("120px");
    expect(gridColumns.gap).toBe(12);
  });

  test("gives no columns in true size so tiles keep their own width", () => {
    const gridView = createGridView({ sizeMode: "true-size" });

    const gridColumns = pickGridColumns(gridView);

    expect(gridColumns.template).toBeNull();
  });
});

describe("pickTilePadding", () => {
  test("is tighter in compact density", () => {
    const comfortable = createGridView({ density: "comfortable" });

    expect(pickTilePadding(DEFAULT_GRID_VIEW)).toBe(4);
    expect(pickTilePadding(comfortable)).toBe(8);
  });
});
