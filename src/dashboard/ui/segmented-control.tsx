import type { ReactElement } from "react";
import { cn } from "@/dashboard/ui/cn";

export interface Segment<SegmentId extends string> {
  id: SegmentId;
  label: string;
}

interface SegmentedControlProps<SegmentId extends string> {
  label: string;
  segments: Segment<SegmentId>[];
  selectedId: SegmentId;
  onSelect: (segmentId: SegmentId) => void;
}

export const SegmentedControl = <SegmentId extends string>({
  label,
  segments,
  selectedId,
  onSelect,
}: SegmentedControlProps<SegmentId>): ReactElement => (
  <fieldset
    aria-label={label}
    className="m-0 inline-flex min-w-0 rounded-md border border-line bg-card p-0.5"
  >
    {segments.map((segment) => {
      const isSelected = segment.id === selectedId;
      return (
        <button
          key={segment.id}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect(segment.id)}
          className={cn(
            "min-h-8 cursor-pointer rounded px-2.5 text-xs font-medium md:min-h-7",
            isSelected && "bg-ink text-card",
            !isSelected && "text-ink-2 hover:text-ink",
          )}
        >
          {segment.label}
        </button>
      );
    })}
  </fieldset>
);
