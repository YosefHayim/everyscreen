import type { ReactElement } from "react";
import { useAppUrl } from "@/dashboard/app-url/use-app-url";

export const FramePageUrl = (): ReactElement => {
  const { appUrl } = useAppUrl();

  return (
    <span className="min-w-0 flex-1 truncate px-3 text-center font-mono text-xs text-ink-2">
      {appUrl}
    </span>
  );
};
