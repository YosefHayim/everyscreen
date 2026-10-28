import { z } from "zod";
import {
  type FrameSize,
  pickFitScale,
} from "@/dashboard/frames/frame-layout-logic";

const MIN_SCALE_PERCENT = 30;
const MAX_SCALE_PERCENT = 200;
const SCALE_STEP_PERCENT = 10;
const PERCENT_DIVISOR = 100;

const gridViewSchema = z.object({
  sizeMode: z.enum(["fit", "true-size"]),
  density: z.enum(["comfortable", "compact"]),
  scalePercent: z.number().int().min(MIN_SCALE_PERCENT).max(MAX_SCALE_PERCENT),
});

export type GridView = z.infer<typeof gridViewSchema>;
export type SizeMode = GridView["sizeMode"];
export type Density = GridView["density"];
export type ScaleDirection = "smaller" | "larger";

export const DEFAULT_GRID_VIEW = {
  sizeMode: "fit",
  density: "compact",
  scalePercent: 100,
} satisfies GridView;

interface DensityLook {
  gap: number;
  tilePadding: number;
  columnWidth: number;
  fitHeight: number;
}

const DENSITY_LOOKS = {
  comfortable: { gap: 12, tilePadding: 8, columnWidth: 240, fitHeight: 520 },
  compact: { gap: 8, tilePadding: 4, columnWidth: 180, fitHeight: 420 },
} satisfies Record<Density, DensityLook>;

const SCALE_STEP_SIGNS = {
  smaller: -1,
  larger: 1,
} satisfies Record<ScaleDirection, number>;

export interface GridColumns {
  gap: number;
  template: string | null;
}

export const pickGridView = (storedGridView: unknown): GridView => {
  const parsedGridView = gridViewSchema.safeParse(storedGridView);
  const isStoredViewUsable = parsedGridView.success;
  if (isStoredViewUsable) return parsedGridView.data;
  return DEFAULT_GRID_VIEW;
};

export const stepScalePercent = (
  scalePercent: number,
  direction: ScaleDirection,
): number => {
  const steppedPercent =
    scalePercent + SCALE_STEP_SIGNS[direction] * SCALE_STEP_PERCENT;
  return Math.min(
    MAX_SCALE_PERCENT,
    Math.max(MIN_SCALE_PERCENT, steppedPercent),
  );
};

export const pickFrameScale = (
  frameSize: FrameSize,
  gridView: GridView,
): number => {
  const scaleRatio = gridView.scalePercent / PERCENT_DIVISOR;
  const isTrueSize = gridView.sizeMode === "true-size";
  if (isTrueSize) return scaleRatio;

  const densityLook = DENSITY_LOOKS[gridView.density];
  const paddingWidth = 2 * densityLook.tilePadding;
  const fitBox = {
    width: densityLook.columnWidth * scaleRatio - paddingWidth,
    height: densityLook.fitHeight * scaleRatio - paddingWidth,
  };
  return pickFitScale(frameSize, fitBox);
};

export const pickGridColumns = (gridView: GridView): GridColumns => {
  const densityLook = DENSITY_LOOKS[gridView.density];
  const isTrueSize = gridView.sizeMode === "true-size";
  if (isTrueSize) return { gap: densityLook.gap, template: null };

  const scaleRatio = gridView.scalePercent / PERCENT_DIVISOR;
  const columnWidth = Math.round(densityLook.columnWidth * scaleRatio);
  return {
    gap: densityLook.gap,
    template: `repeat(auto-fill, minmax(min(100%, ${columnWidth}px), 1fr))`,
  };
};

export const pickTilePadding = (gridView: GridView): number =>
  DENSITY_LOOKS[gridView.density].tilePadding;
