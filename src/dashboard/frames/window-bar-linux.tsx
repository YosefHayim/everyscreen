import type { ReactElement } from "react";
import { Icon } from "@/dashboard/ui/icon";

export const WindowBarLinux = (): ReactElement => (
  <div className="flex size-full items-center gap-2 border-line border-b bg-soft px-3">
    <span className="h-6 w-14 rounded-md bg-line" />
    <span className="mx-auto h-6 w-[40%] rounded-md bg-line" />
    <span className="grid size-[26px] place-items-center rounded-full bg-line text-ink">
      <Icon name="close" size={12} strokeWidth={1.6} />
    </span>
  </div>
);
