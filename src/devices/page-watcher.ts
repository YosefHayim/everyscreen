import type { Page } from "playwright";

export type StopWatching = () => Promise<void>;

export type PageWatcher = (
  page: Page,
  deviceId: string,
) => Promise<StopWatching>;
