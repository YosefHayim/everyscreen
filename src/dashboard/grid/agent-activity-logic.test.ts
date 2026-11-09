import { describe, expect, test } from "vitest";
import {
  listActivityLines,
  pickClock,
} from "@/dashboard/grid/agent-activity-logic";

describe("pickClock", () => {
  test("writes the local time with two digits per part", () => {
    const sentAt = new Date(2026, 0, 1, 9, 5, 7).getTime();

    expect(pickClock(sentAt)).toBe("09:05:07");
  });
});

describe("listActivityLines", () => {
  test("returns no lines for no notices", () => {
    expect(listActivityLines([])).toEqual([]);
  });

  test("keeps the order and marks failed commands", () => {
    const sentAt = new Date(2026, 0, 1, 10, 0, 0).getTime();

    const activityLines = listActivityLines([
      { commandName: "tap", status: "failed", line: "no such button", sentAt },
      { commandName: "open", status: "ok", line: "opened", sentAt },
    ]);

    expect(activityLines.map((line) => line.isFailed)).toEqual([true, false]);
    expect(activityLines[0]).toMatchObject({
      clock: "10:00:00",
      commandName: "tap",
    });
    expect(activityLines[0]?.segments).toEqual([
      { key: 0, text: "no such button", isRunId: false },
    ]);
    expect(activityLines[0]?.key).not.toBe(activityLines[1]?.key);
  });

  test("keeps a run id in one segment so it never breaks inside", () => {
    const sentAt = new Date(2026, 0, 1, 10, 0, 0).getTime();

    const activityLines = listActivityLines([
      {
        commandName: "report",
        status: "ok",
        line: "report run-0001 saved",
        sentAt,
      },
    ]);

    expect(activityLines[0]?.segments).toEqual([
      { key: 0, text: "report ", isRunId: false },
      { key: 7, text: "run-0001", isRunId: true },
      { key: 15, text: " saved", isRunId: false },
    ]);
  });

  test("drops the empty piece when a line starts with a run id", () => {
    const sentAt = new Date(2026, 0, 1, 10, 0, 0).getTime();

    const activityLines = listActivityLines([
      { commandName: "open", status: "ok", line: "run-0001 saved", sentAt },
    ]);

    expect(activityLines[0]?.segments).toEqual([
      { key: 0, text: "run-0001", isRunId: true },
      { key: 8, text: " saved", isRunId: false },
    ]);
  });
});
