import type { ReactElement, ReactNode } from "react";
import { FrameBrowserToolbar } from "@/dashboard/frames/frame-browser-toolbar";
import { FrameCutout } from "@/dashboard/frames/frame-cutout";
import type { FrameLayout } from "@/dashboard/frames/frame-layout-logic";
import { FrameStatusBar } from "@/dashboard/frames/frame-status-bar";
import { FrameWindowBar } from "@/dashboard/frames/frame-window-bar";
import { cn } from "@/dashboard/ui/cn";

interface DeviceFrameProps {
  layout: FrameLayout;
  scale: number;
  children: ReactNode;
}

export const DeviceFrame = ({
  layout,
  scale,
  children,
}: DeviceFrameProps): ReactElement => {
  const { width, height, screen, page, windowBar } = layout;
  const { statusBar, toolbar, cutout, homeIndicator } = layout;
  const hasBody = layout.hasBody;
  const hasWindowBar = windowBar !== null;
  const hasToolbar = toolbar !== null;
  const hasStatusBar = statusBar !== null;
  const hasHomeIndicator = homeIndicator !== null;
  const hasCutout = cutout !== null;

  return (
    <div
      data-frame-family={layout.family}
      className="relative flex-none"
      style={{ width: width * scale, height: height * scale }}
    >
      {/* Phone buttons and window controls keep their side in right-to-left pages. */}
      <div
        dir="ltr"
        className="absolute top-0 left-0 origin-top-left"
        style={{ width, height, transform: `scale(${scale})` }}
      >
        {hasBody && (
          <div
            className="absolute inset-0 bg-ink shadow-[inset_0_0_0_2px_var(--color-frame-detail)]"
            style={{ borderRadius: layout.bodyRadius }}
          />
        )}
        <div
          className={cn(
            "absolute overflow-hidden bg-card",
            hasWindowBar && "border border-line shadow-lift",
          )}
          style={{
            left: screen.left,
            top: screen.top,
            width: screen.width,
            height: screen.height,
            borderRadius: screen.radius,
          }}
        >
          <div
            data-frame-page=""
            className="absolute overflow-hidden"
            style={{
              left: page.left,
              top: page.top,
              width: page.width,
              height: page.height,
            }}
          >
            {children}
          </div>
          {hasWindowBar && (
            <FrameWindowBar kind={windowBar.kind} box={windowBar.box} />
          )}
          {hasToolbar && <FrameBrowserToolbar box={toolbar} />}
          {hasStatusBar && <FrameStatusBar statusBar={statusBar} />}
          {hasHomeIndicator && (
            <span
              aria-hidden="true"
              className="absolute rounded-full bg-ink"
              style={{
                left: homeIndicator.left,
                top: homeIndicator.top,
                width: homeIndicator.width,
                height: homeIndicator.height,
              }}
            />
          )}
        </div>
        {hasCutout && <FrameCutout drawing={cutout.drawing} box={cutout.box} />}
      </div>
    </div>
  );
};
