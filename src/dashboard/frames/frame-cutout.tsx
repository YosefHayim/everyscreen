import type { ReactElement } from "react";
import type { Box, CutoutDrawing } from "@/dashboard/frames/frame-layout-logic";
import { cn } from "@/dashboard/ui/cn";

const CUTOUT_CLASS_NAMES = {
  island: "rounded-full bg-black",
  notch: "rounded-b-[22px] bg-black",
  hole: "rounded-full bg-black ring-1 ring-frame-detail",
  "home-button": "rounded-full border-2 border-frame-detail",
  camera: "rounded-full bg-frame-detail",
} satisfies Record<CutoutDrawing, string>;

interface FrameCutoutProps {
  drawing: CutoutDrawing;
  box: Box;
}

export const FrameCutout = ({
  drawing,
  box,
}: FrameCutoutProps): ReactElement => (
  <div
    aria-hidden="true"
    className={cn("absolute", CUTOUT_CLASS_NAMES[drawing])}
    style={{
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
    }}
  />
);
