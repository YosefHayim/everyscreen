import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { Density, SizeMode } from "@/dashboard/grid/grid-view-logic";
import { useGridView } from "@/dashboard/grid/use-grid-view";
import { Icon } from "@/dashboard/ui/icon";
import {
  type Segment,
  SegmentedControl,
} from "@/dashboard/ui/segmented-control";

const SIZE_MODE_SEGMENTS = [
  { id: "fit", labelKey: "grid.strip.fit" },
  { id: "true-size", labelKey: "grid.strip.trueSize" },
] satisfies { id: SizeMode; labelKey: string }[];

const DENSITY_SEGMENTS = [
  { id: "comfortable", labelKey: "grid.strip.comfortable" },
  { id: "compact", labelKey: "grid.strip.compact" },
] satisfies { id: Density; labelKey: string }[];

const SCALE_BUTTON_CLASS_NAME =
  "grid size-8 cursor-pointer place-items-center rounded border border-line bg-card text-ink md:size-7";

export const RunStrip = (): ReactElement => {
  const { t } = useTranslation();
  const { gridView, changeSizeMode, changeDensity, stepScale } = useGridView();
  const sizeModeSegments: Segment<SizeMode>[] = SIZE_MODE_SEGMENTS.map(
    (segment) => ({ id: segment.id, label: t(segment.labelKey) }),
  );
  const densitySegments: Segment<Density>[] = DENSITY_SEGMENTS.map(
    (segment) => ({ id: segment.id, label: t(segment.labelKey) }),
  );

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-card px-3 py-1.5 md:px-5">
      <SegmentedControl
        label={t("grid.strip.sizeMode")}
        segments={sizeModeSegments}
        selectedId={gridView.sizeMode}
        onSelect={changeSizeMode}
      />
      <SegmentedControl
        label={t("grid.strip.density")}
        segments={densitySegments}
        selectedId={gridView.density}
        onSelect={changeDensity}
      />
      <fieldset
        aria-label={t("grid.strip.scale")}
        className="m-0 inline-flex min-w-0 items-center gap-1 border-0 p-0"
      >
        <button
          type="button"
          aria-label={t("grid.strip.smaller")}
          onClick={() => stepScale("smaller")}
          className={SCALE_BUTTON_CLASS_NAME}
        >
          <Icon name="minus" size={14} />
        </button>
        <output
          aria-label={t("grid.strip.scale")}
          className="min-w-10 text-center font-mono text-xs text-ink-2"
        >
          {gridView.scalePercent}%
        </output>
        <button
          type="button"
          aria-label={t("grid.strip.larger")}
          onClick={() => stepScale("larger")}
          className={SCALE_BUTTON_CLASS_NAME}
        >
          <Icon name="plus" size={14} />
        </button>
      </fieldset>
    </div>
  );
};
