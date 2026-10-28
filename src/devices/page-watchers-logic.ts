import type { BrowserName } from "@/devices/devices-logic";
import type { PageWatcher } from "@/devices/page-watcher";

export const listDefaultPageWatchers = (
  browserName: BrowserName,
  cdpPageWatchers: PageWatcher[],
): PageWatcher[] => {
  const isChromium = browserName === "chromium";
  if (isChromium) return cdpPageWatchers;
  return [];
};
