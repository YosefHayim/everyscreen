import { ICON_PATHS, type IconName } from "@/dashboard/ui/icon-paths";

const DEFAULT_ICON_SIZE = 16;
const DEFAULT_STROKE_WIDTH = 1.8;

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export const Icon = ({
  name,
  size = DEFAULT_ICON_SIZE,
  strokeWidth = DEFAULT_STROKE_WIDTH,
}: IconProps) => (
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
    className="flex-none"
  >
    {ICON_PATHS[name].map((pathShape) => (
      <path key={pathShape} d={pathShape} />
    ))}
  </svg>
);
