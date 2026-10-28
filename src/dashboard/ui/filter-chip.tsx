import type { ReactElement } from "react";
import { cn } from "@/dashboard/ui/cn";

interface FilterChipProps {
  label: string;
  count: number | null;
  isSelected: boolean;
  onSelect: () => void;
}

export const FilterChip = ({
  label,
  count,
  isSelected,
  onSelect,
}: FilterChipProps): ReactElement => {
  const hasCount = count !== null;

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium md:h-10",
        isSelected && "border-ink bg-ink text-card",
        !isSelected && "border-line bg-card text-ink",
      )}
    >
      {label}
      {hasCount && (
        <span className="font-mono text-xs opacity-70">{count}</span>
      )}
    </button>
  );
};
