import type { ReactElement } from "react";
import { cn } from "@/dashboard/ui/cn";
import { SITE_ICON_PATHS, type SiteIconName } from "./site-icon-paths";

const DEFAULT_ICON_SIZE = 16;
const DEFAULT_STROKE_WIDTH = 1.8;

interface SiteIconProps {
  name: SiteIconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const SiteIcon = ({
  name,
  size = DEFAULT_ICON_SIZE,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  className,
}: SiteIconProps): ReactElement => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={cn("flex-none", className)}
  >
    {SITE_ICON_PATHS[name].map((pathShape) => (
      <path key={pathShape} d={pathShape} />
    ))}
  </svg>
);
