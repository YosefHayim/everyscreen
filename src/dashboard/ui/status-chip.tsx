import { cva } from "class-variance-authority";
import type { ReactElement } from "react";
import { Icon } from "@/dashboard/ui/icon";
import type { IconName } from "@/dashboard/ui/icon-paths";

export type ChipStatus = "ok" | "warn" | "failed";

const CHIP_ICONS = {
  ok: "tick",
  warn: "finding",
  failed: "close",
} satisfies Record<ChipStatus, IconName>;

const CHIP_ICON_SIZE = 13;
const CHIP_STROKE_WIDTH = 2.4;

// A chip with a label sits on a soft background; an icon-only chip is the bare mark.
const chipVariants = cva(
  "inline-flex h-7 items-center gap-1.5 rounded-full text-[12.5px] font-medium",
  {
    variants: {
      status: {
        ok: "text-ok",
        warn: "text-warn",
        failed: "text-failed",
      },
      isLabelHidden: {
        true: "w-7 justify-center",
        false: "px-2.5",
      },
    },
    compoundVariants: [
      { status: "ok", isLabelHidden: false, className: "bg-ok-soft" },
      { status: "warn", isLabelHidden: false, className: "bg-warn-soft" },
      { status: "failed", isLabelHidden: false, className: "bg-failed-soft" },
    ],
  },
);

interface StatusChipProps {
  status: ChipStatus;
  label: string;
  isLabelHidden?: boolean;
}

export const StatusChip = ({
  status,
  label,
  isLabelHidden = false,
}: StatusChipProps): ReactElement => {
  const labelClassName = isLabelHidden ? "sr-only" : undefined;

  return (
    <span className={chipVariants({ status, isLabelHidden })}>
      <Icon
        name={CHIP_ICONS[status]}
        size={CHIP_ICON_SIZE}
        strokeWidth={CHIP_STROKE_WIDTH}
      />
      <span className={labelClassName}>{label}</span>
    </span>
  );
};
