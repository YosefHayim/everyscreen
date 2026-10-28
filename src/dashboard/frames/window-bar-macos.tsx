import type { ReactElement } from "react";
import { FramePageUrl } from "@/dashboard/frames/frame-page-url";
import { cn } from "@/dashboard/ui/cn";

const TRAFFIC_LIGHT_CLASS_NAMES = [
  "bg-window-close",
  "bg-window-minimize",
  "bg-window-maximize",
];

export const WindowBarMacos = (): ReactElement => (
  <div className="flex size-full items-center border-line border-b bg-soft ps-[19px]">
    <span className="flex gap-2">
      {TRAFFIC_LIGHT_CLASS_NAMES.map((lightClassName) => (
        <span
          key={lightClassName}
          className={cn("size-3 rounded-full", lightClassName)}
        />
      ))}
    </span>
    <span className="mx-auto flex h-7 w-[46%] items-center rounded-md bg-line">
      <FramePageUrl />
    </span>
    <span className="w-[79px]" />
  </div>
);
