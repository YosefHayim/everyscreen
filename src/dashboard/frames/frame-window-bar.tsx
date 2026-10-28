import type { ReactElement } from "react";
import type { Box, WindowBarKind } from "@/dashboard/frames/frame-layout-logic";
import { WindowBarLinux } from "@/dashboard/frames/window-bar-linux";
import { WindowBarMacos } from "@/dashboard/frames/window-bar-macos";
import { WindowBarWindows } from "@/dashboard/frames/window-bar-windows";

const WINDOW_BARS = {
  macos: WindowBarMacos,
  windows: WindowBarWindows,
  linux: WindowBarLinux,
} satisfies Record<WindowBarKind, () => ReactElement>;

interface FrameWindowBarProps {
  kind: WindowBarKind;
  box: Box;
}

export const FrameWindowBar = ({
  kind,
  box,
}: FrameWindowBarProps): ReactElement => {
  const WindowBar = WINDOW_BARS[kind];

  return (
    <div
      className="absolute top-0 left-0 w-full"
      style={{ height: box.height }}
    >
      <WindowBar />
    </div>
  );
};
