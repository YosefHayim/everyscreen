import type { ReactElement } from "react";

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
          className={`size-3 rounded-full ${lightClassName}`}
        />
      ))}
    </span>
    <span className="mx-auto h-7 w-[46%] rounded-md bg-line" />
    <span className="w-[79px]" />
  </div>
);
