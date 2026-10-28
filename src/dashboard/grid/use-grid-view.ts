import { useSyncExternalStore } from "react";
import {
  type Density,
  type GridView,
  type ScaleDirection,
  type SizeMode,
  stepScalePercent,
} from "@/dashboard/grid/grid-view-logic";
import {
  changeGridView,
  getGridView,
  subscribeToGridView,
} from "@/dashboard/grid/grid-view-store";

interface GridViewControls {
  gridView: GridView;
  changeSizeMode: (sizeMode: SizeMode) => void;
  changeDensity: (density: Density) => void;
  stepScale: (direction: ScaleDirection) => void;
}

export const useGridView = (): GridViewControls => {
  const gridView = useSyncExternalStore(subscribeToGridView, getGridView);

  return {
    gridView,
    changeSizeMode: (sizeMode) => changeGridView({ sizeMode }),
    changeDensity: (density) => changeGridView({ density }),
    stepScale: (direction) =>
      changeGridView({
        scalePercent: stepScalePercent(gridView.scalePercent, direction),
      }),
  };
};
