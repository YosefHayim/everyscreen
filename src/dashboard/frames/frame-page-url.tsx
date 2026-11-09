import type { ReactElement } from "react";
import { useOpenAppUrl } from "@/dashboard/app-url/use-open-app-url";

export const FramePageUrl = (): ReactElement => {
  const openAppUrl = useOpenAppUrl();

  return (
    <span className="min-w-0 flex-1 truncate px-3 text-center font-mono text-xs text-ink-2">
      {openAppUrl}
    </span>
  );
};
