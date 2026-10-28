import type { ReactElement } from "react";
import type { Box } from "@/dashboard/frames/frame-layout-logic";
import { FramePageUrl } from "@/dashboard/frames/frame-page-url";

const ADDRESS_PILL_WIDTH_SHARE = 0.62;
const ADDRESS_PILL_HEIGHT_SHARE = 0.5;

interface FrameBrowserToolbarProps {
  box: Box;
}

export const FrameBrowserToolbar = ({
  box,
}: FrameBrowserToolbarProps): ReactElement => (
  <div
    aria-hidden="true"
    className="absolute flex items-center justify-center border-line border-y bg-soft"
    style={{
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    }}
  >
    <span
      className="flex items-center rounded-full bg-line"
      style={{
        width: box.width * ADDRESS_PILL_WIDTH_SHARE,
        height: box.height * ADDRESS_PILL_HEIGHT_SHARE,
      }}
    >
      <FramePageUrl />
    </span>
  </div>
);
