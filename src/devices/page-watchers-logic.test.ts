import { describe, expect, test } from "vitest";
import { listDefaultPageWatchers } from "@/devices/page-watchers-logic";

const cdpWatcher = async () => async () => undefined;

describe("listDefaultPageWatchers", () => {
  test("keeps the CDP watchers for chromium", () => {
    const cdpPageWatchers = [cdpWatcher];

    const pageWatchers = listDefaultPageWatchers("chromium", cdpPageWatchers);

    expect(pageWatchers).toEqual([cdpWatcher]);
  });

  test("returns no watchers for webkit", () => {
    const pageWatchers = listDefaultPageWatchers("webkit", [cdpWatcher]);

    expect(pageWatchers).toEqual([]);
  });

  test("returns no watchers for firefox", () => {
    const pageWatchers = listDefaultPageWatchers("firefox", [cdpWatcher]);

    expect(pageWatchers).toEqual([]);
  });
});
