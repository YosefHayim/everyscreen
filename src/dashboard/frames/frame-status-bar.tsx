import type { ReactElement } from "react";
import type { StatusBarLayout } from "@/dashboard/frames/frame-layout-logic";
import { StatusIcons } from "@/dashboard/frames/status-icons";

// A phone status bar always shows this time in marketing and design tools.
const STATUS_TIME = "9:41";

interface FrameStatusBarProps {
  statusBar: StatusBarLayout;
}

export const FrameStatusBar = ({
  statusBar,
}: FrameStatusBarProps): ReactElement => {
  const { box, centerY, fontSize, sidePadding, style } = statusBar;
  const { startZoneWidth, endZoneWidth } = statusBar;
  const isSplitAroundCutout = startZoneWidth !== null && endZoneWidth !== null;
  const timeClassName = style === "ios" ? "font-semibold" : "font-medium";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 flex items-center text-ink"
      style={{
        top: 0,
        width: box.width,
        height: centerY * 2,
        fontSize,
        paddingInline: isSplitAroundCutout ? 0 : sidePadding,
        justifyContent: "space-between",
      }}
    >
      <span
        className={`${timeClassName} flex justify-center`}
        style={{ width: startZoneWidth ?? undefined }}
      >
        {STATUS_TIME}
      </span>
      <span
        className="flex justify-center"
        style={{ width: endZoneWidth ?? undefined }}
      >
        <StatusIcons />
      </span>
    </div>
  );
};
