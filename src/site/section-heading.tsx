import type { ReactElement } from "react";
import { cn } from "@/dashboard/ui/cn";

type HeadingAlignment = "centered" | "left" | "split";

interface SectionHeadingProps {
  title: string;
  subtitle: string;
  alignment?: HeadingAlignment;
  isOnCobalt?: boolean;
}

export const SectionHeading = ({
  title,
  subtitle,
  alignment = "left",
  isOnCobalt = false,
}: SectionHeadingProps): ReactElement => {
  const isCentered = alignment === "centered";
  const isSplit = alignment === "split";

  const subtitleToneClassName = isOnCobalt ? "text-card/80" : "text-ink-2";

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        isCentered && "items-center text-center",
        isSplit && "md:grid md:grid-cols-2 md:items-end md:gap-12",
      )}
    >
      <h2 className="m-0 text-balance text-[clamp(30px,1.6vw+14px,38px)] leading-[1.15] font-medium tracking-[-0.025em]">
        {title}
      </h2>
      <p
        className={cn(
          "m-0 max-w-[640px] text-pretty text-base leading-6",
          subtitleToneClassName,
        )}
      >
        {subtitle}
      </p>
    </div>
  );
};
