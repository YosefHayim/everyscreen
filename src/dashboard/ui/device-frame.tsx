import type { ReactElement, ReactNode } from "react";
import {
  type FramePaint,
  type FrameSize,
  pickFrameLayout,
} from "@/dashboard/ui/device-frame-logic";

const PAINT_CLASS_NAMES = {
  "solid-frame": "fill-ink",
  "solid-detail": "fill-frame-detail",
  "outline-detail": "fill-none stroke-frame-detail stroke-[1.5]",
} satisfies Record<FramePaint, string>;

interface DeviceFrameProps extends FrameSize {
  children: ReactNode;
}

export const DeviceFrame = ({
  children,
  ...frameSize
}: DeviceFrameProps): ReactElement => {
  const layout = pickFrameLayout(frameSize);
  const { width, height, screenLeft, screenTop, screenWidth, screenHeight } =
    layout;

  return (
    <div className="relative flex-none" style={{ width, height }}>
      <div
        className="absolute overflow-hidden bg-card"
        style={{
          left: screenLeft,
          top: screenTop,
          width: screenWidth,
          height: screenHeight,
          borderRadius: layout.screenCornerRadius,
        }}
      >
        {children}
      </div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        {layout.parts.map((framePart) => (
          <path
            key={framePart.path}
            d={framePart.path}
            fillRule="evenodd"
            className={PAINT_CLASS_NAMES[framePart.paint]}
          />
        ))}
      </svg>
    </div>
  );
};
