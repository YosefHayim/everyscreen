import type { ReactElement } from "react";
import { Icon } from "@/dashboard/ui/icon";

const CAPTION_BUTTONS = [
  { key: "minimize", glyph: <span className="h-px w-2.5 bg-ink" /> },
  { key: "maximize", glyph: <span className="size-2.5 border border-ink" /> },
  { key: "close", glyph: <Icon name="close" size={14} strokeWidth={1.4} /> },
];

export const WindowBarWindows = (): ReactElement => (
  <div className="flex size-full flex-col bg-soft">
    <div className="flex h-10 items-start">
      <span className="mt-2 ms-2 flex h-8 w-44 items-center rounded-t-lg bg-card px-3">
        <span className="h-2 w-24 rounded bg-line" />
      </span>
      <span className="ms-auto flex">
        {CAPTION_BUTTONS.map((captionButton) => (
          <span
            key={captionButton.key}
            className="flex h-8 w-[46px] items-center justify-center text-ink"
          >
            {captionButton.glyph}
          </span>
        ))}
      </span>
    </div>
    <div className="flex h-10 items-center gap-2 border-line border-b bg-card px-3">
      <span className="h-6 w-16 rounded bg-soft" />
      <span className="h-7 flex-1 rounded-full bg-soft" />
    </div>
  </div>
);
