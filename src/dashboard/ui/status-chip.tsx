import { cva } from "class-variance-authority";
import { Icon } from "@/dashboard/ui/icon";
import type { IconName } from "@/dashboard/ui/icon-paths";

export type ChipStatus = "pass" | "warn" | "fail";

const CHIP_ICONS = {
  pass: "tick",
  warn: "finding",
  fail: "close",
} satisfies Record<ChipStatus, IconName>;

const CHIP_ICON_SIZE = 13;
const CHIP_STROKE_WIDTH = 2.4;

// A chip with a label sits on a soft background; an icon-only chip is the bare mark.
const chipVariants = cva(
  "inline-flex h-7 items-center gap-1.5 rounded-full text-[12.5px] font-medium",
  {
    variants: {
      status: {
        pass: "text-pass",
        warn: "text-warn",
        fail: "text-fail",
      },
      isLabelHidden: {
        true: "w-7 justify-center",
        false: "px-2.5",
      },
    },
    compoundVariants: [
      { status: "pass", isLabelHidden: false, className: "bg-pass-soft" },
      { status: "warn", isLabelHidden: false, className: "bg-warn-soft" },
      { status: "fail", isLabelHidden: false, className: "bg-fail-soft" },
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
}: StatusChipProps) => {
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
