import type { ReactElement } from "react";
import type {
  StepSegment,
  StepSegmentState,
} from "@/dashboard/device-feed/step-progress-logic";
import { cn } from "@/dashboard/ui/cn";

const SEGMENT_CLASS_NAMES = {
  done: "bg-ok",
  current: "bg-pink",
  failed: "bg-failed",
  pending: "bg-line",
} satisfies Record<StepSegmentState, string>;

interface TileStepSegmentsProps {
  testTitle: string;
  segments: StepSegment[];
}

export const TileStepSegments = ({
  testTitle,
  segments,
}: TileStepSegmentsProps): ReactElement => (
  <div aria-hidden="true" className="mt-1.5 flex h-[3px] gap-0.5">
    {segments.map(({ stepIndex, state }) => (
      <span
        key={`${testTitle}:${stepIndex}`}
        className={cn("h-full flex-1 rounded-full", SEGMENT_CLASS_NAMES[state])}
      />
    ))}
  </div>
);
