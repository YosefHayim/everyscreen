import { describe, expect, test } from "vitest";
import type { Finding } from "@/checks/checks-logic";
import type { DeviceView } from "@/dashboard/devices/device-view-logic";
import {
  createSweepMatrix,
  listShownRows,
  pickCellCaption,
  pickOpenedShot,
  pickSweepTotals,
  pickThumbScreenWidth,
  type SweepCell,
} from "@/dashboard/sweep/sweep-matrix-logic";
import type { Run, RunStep } from "@/runs/runs-logic";

const PHONE: DeviceView = {
  deviceId: "iphone-se",
  name: "iPhone SE",
  browserName: "webkit",
  frameShape: "home-button",
  viewportWidth: 375,
  viewportHeight: 667,
  pixelRatio: 2,
  hasTouch: true,
  isCustom: false,
};
const LAPTOP: DeviceView = {
  ...PHONE,
  deviceId: "laptop-1440",
  name: "Laptop",
  frameShape: "laptop",
  viewportWidth: 1440,
  viewportHeight: 900,
};
const REMOVED_DEVICE_ID = "removed-device";

const CLIPPED_FINDING: Finding = {
  kind: "clipped-text",
  severity: "warn",
  deviceId: PHONE.deviceId,
  selector: "h1",
  message: "h1 cuts its text off",
};
const OVERFLOW_FINDING: Finding = {
  ...CLIPPED_FINDING,
  kind: "overflow",
  selector: "div",
  message: "div runs 20px past the edge",
};

const createStep = (stepNumber: number, route: string): RunStep => ({
  stepId: `step-${stepNumber}`,
  title: `sweep ${route}`,
  startedAt: stepNumber,
  deviceAnswers: [
    {
      status: "ok",
      deviceId: PHONE.deviceId,
      durationMs: 10,
      shotPath: `.everyscreen/shots/run-0001-step-${stepNumber}-iphone-se.png`,
    },
    {
      status: "ok",
      deviceId: LAPTOP.deviceId,
      durationMs: 10,
      shotPath: null,
    },
    {
      status: "ok",
      deviceId: REMOVED_DEVICE_ID,
      durationMs: 10,
      shotPath: null,
    },
  ],
  findings: [],
  proof: null,
});

const CLEAN_STEP = createStep(1, "/");
const FINDING_STEP: RunStep = {
  ...createStep(2, "/login"),
  findings: [CLIPPED_FINDING, OVERFLOW_FINDING],
};
const FAILED_STEP: RunStep = {
  ...createStep(3, "/Orders"),
  deviceAnswers: [
    {
      status: "failed",
      deviceId: PHONE.deviceId,
      durationMs: 10,
      message: "left the app origin",
      shotPath: null,
    },
  ],
};

const SWEEP_RUN: Run = {
  runId: "run-0001",
  origin: "cli",
  runKind: "sweep",
  status: "failed",
  startedAt: 1,
  steps: [CLEAN_STEP, FINDING_STEP, FAILED_STEP],
};

const DEVICE_VIEWS = [LAPTOP, PHONE];

describe("createSweepMatrix", () => {
  test("makes one column per grid device the run answered, in grid order", () => {
    const sweepMatrix = createSweepMatrix(SWEEP_RUN, DEVICE_VIEWS);

    expect(sweepMatrix.columns.map(({ deviceId }) => deviceId)).toEqual([
      "laptop-1440",
      "iphone-se",
    ]);
  });

  test("makes one row per route with its shots, findings and verdict", () => {
    const sweepMatrix = createSweepMatrix(SWEEP_RUN, DEVICE_VIEWS);

    const [cleanRow, findingRow, failedRow] = sweepMatrix.rows;

    expect(cleanRow.route).toBe("/");
    expect(cleanRow.shotCount).toBe(1);
    expect(cleanRow.verdict).toBe("clean");
    expect(findingRow.findingCount).toBe(2);
    expect(findingRow.verdict).toBe("findings");
    expect(failedRow.failedCount).toBe(1);
    expect(failedRow.verdict).toBe("failed");
  });

  test("points a cell at its shot and keeps its failure message", () => {
    const sweepMatrix = createSweepMatrix(SWEEP_RUN, DEVICE_VIEWS);

    const [, phoneCell] = sweepMatrix.rows[0].cells;
    const [laptopFailedCell, phoneFailedCell] = sweepMatrix.rows[2].cells;

    expect(phoneCell.shotUrl).toBe("/api/shots/run-0001-step-1-iphone-se.png");
    expect(phoneFailedCell.failureMessage).toBe("left the app origin");
    expect(phoneFailedCell.shotUrl).toBeNull();
    expect(laptopFailedCell.status).toBe("none");
    expect(laptopFailedCell.failureMessage).toBeNull();
  });
});

describe("pickSweepTotals", () => {
  test("counts routes, devices, shots, findings and cell statuses", () => {
    const sweepMatrix = createSweepMatrix(SWEEP_RUN, DEVICE_VIEWS);

    const sweepTotals = pickSweepTotals(sweepMatrix);

    expect(sweepTotals).toEqual({
      routeCount: 3,
      deviceCount: 2,
      shotCount: 2,
      findingCount: 2,
      okCount: 3,
      warnCount: 1,
      failedCount: 1,
    });
  });
});

describe("listShownRows", () => {
  const { rows } = createSweepMatrix(SWEEP_RUN, DEVICE_VIEWS);

  test("keeps every row when nothing is filtered", () => {
    const shownRows = listShownRows(rows, {
      isFindingsOnly: false,
      routeFilter: "",
    });

    expect(shownRows).toHaveLength(3);
  });

  test("hides clean rows when only findings are wanted", () => {
    const shownRows = listShownRows(rows, {
      isFindingsOnly: true,
      routeFilter: "",
    });

    expect(shownRows.map(({ route }) => route)).toEqual(["/login", "/Orders"]);
  });

  test("filters rows by path text, ignoring case and spaces around it", () => {
    const shownRows = listShownRows(rows, {
      isFindingsOnly: false,
      routeFilter: " ORDERS ",
    });

    expect(shownRows.map(({ route }) => route)).toEqual(["/Orders"]);
  });

  test("shows nothing when no path matches", () => {
    const shownRows = listShownRows(rows, {
      isFindingsOnly: false,
      routeFilter: "cart",
    });

    expect(shownRows).toEqual([]);
  });
});

describe("pickCellCaption", () => {
  const baseCell: SweepCell = {
    deviceId: PHONE.deviceId,
    status: "ok",
    shotUrl: null,
    failureMessage: null,
    findings: [],
  };

  test("words a failed cell with its failure message", () => {
    const caption = pickCellCaption({
      ...baseCell,
      status: "failed",
      failureMessage: "left the app origin",
    });

    expect(caption).toEqual({
      kind: "failure",
      message: "left the app origin",
    });
  });

  test("words a warn cell with its first finding and counts the rest", () => {
    const caption = pickCellCaption({
      ...baseCell,
      status: "warn",
      findings: [CLIPPED_FINDING, OVERFLOW_FINDING],
    });

    expect(caption).toEqual({
      kind: "finding",
      findingKind: "clipped-text",
      moreCount: 1,
    });
  });

  test("words a clean cell with its status", () => {
    const caption = pickCellCaption(baseCell);

    expect(caption).toEqual({ kind: "status", status: "ok" });
  });
});

describe("pickThumbScreenWidth", () => {
  test("fits a tall phone frame inside the thumbnail height", () => {
    const screenWidth = pickThumbScreenWidth(PHONE);

    expect(screenWidth).toBeGreaterThan(0);
    expect(screenWidth).toBeLessThan(PHONE.viewportWidth);
  });

  test("gives a wide laptop a wider screen than a phone", () => {
    expect(pickThumbScreenWidth(LAPTOP)).toBeGreaterThan(
      pickThumbScreenWidth(PHONE),
    );
  });
});

describe("pickOpenedShot", () => {
  const sweepMatrix = createSweepMatrix(SWEEP_RUN, DEVICE_VIEWS);

  test("opens nothing when no shot is chosen", () => {
    expect(pickOpenedShot(sweepMatrix, null)).toBeNull();
  });

  test("opens the chosen route on the chosen device", () => {
    const openedShot = pickOpenedShot(sweepMatrix, {
      stepId: "step-2",
      deviceId: PHONE.deviceId,
    });

    expect(openedShot?.route).toBe("/login");
    expect(openedShot?.deviceView.name).toBe("iPhone SE");
    expect(openedShot?.cell.findings).toHaveLength(2);
  });

  test("opens nothing when the chosen route or device is gone", () => {
    const goneRoute = pickOpenedShot(sweepMatrix, {
      stepId: "step-9",
      deviceId: PHONE.deviceId,
    });
    const goneDevice = pickOpenedShot(sweepMatrix, {
      stepId: "step-1",
      deviceId: REMOVED_DEVICE_ID,
    });

    expect(goneRoute).toBeNull();
    expect(goneDevice).toBeNull();
  });
});
