import type { PageMeasurements } from "@/checks/check-probes";
import type { SafeAreaInsets } from "@/devices/devices-logic";

export const MIN_TAP_SIZE = 44;
const REQUEST_FAILURE_ECHO = "Failed to load resource";
const FAVICON_PATH = "/favicon.ico";

export type FindingKind =
  | "overflow"
  | "clipped-text"
  | "safe-area"
  | "tap-target"
  | "console-error"
  | "failed-request";

export type Severity = "failed" | "warn";

export interface Finding {
  kind: FindingKind;
  severity: Severity;
  deviceId: string;
  selector: string | null;
  message: string;
}

export interface CheckDevice {
  id: string;
  hasTouch: boolean;
  safeAreaInsets: SafeAreaInsets;
}

const findOverflow = (
  measurements: PageMeasurements,
  checkDevice: CheckDevice,
): Finding[] => {
  const { widestPastEdge } = measurements;
  const isNothingPastEdge = widestPastEdge === null;
  if (isNothingPastEdge) return [];

  const { selector, overflowPx } = widestPastEdge;
  return [
    {
      kind: "overflow",
      severity: "failed",
      deviceId: checkDevice.id,
      selector,
      message: `${selector} is ${overflowPx}px past the edge`,
    },
  ];
};

const findClippedLabels = (
  measurements: PageMeasurements,
  checkDevice: CheckDevice,
): Finding[] =>
  measurements.clippedSelectors.map((selector) => ({
    kind: "clipped-text",
    severity: "warn",
    deviceId: checkDevice.id,
    selector,
    message: `${selector} cuts its text off`,
  }));

const listSafeAreaFindings = (
  measurements: PageMeasurements,
  checkDevice: CheckDevice,
): Finding[] => {
  const isPageKeptOutOfInsets = !measurements.isViewportCover;
  if (isPageKeptOutOfInsets) return [];

  const { pinnedBoxes, viewportHeight } = measurements;
  const { safeAreaInsets } = checkDevice;
  const homeBarTop = viewportHeight - safeAreaInsets.bottom;
  return pinnedBoxes
    .filter((pinnedBox) => {
      const { top, bottom } = safeAreaInsets;
      const { cssSafeAreaSides } = pinnedBox;
      const isTopCovered = pinnedBox.paddingTop >= top || cssSafeAreaSides.top;
      const isBottomCovered =
        pinnedBox.paddingBottom >= bottom || cssSafeAreaSides.bottom;
      const isUnderNotch = pinnedBox.top < top && !isTopCovered;
      const isUnderHomeBar = pinnedBox.bottom > homeBarTop && !isBottomCovered;
      return isUnderNotch || isUnderHomeBar;
    })
    .map((pinnedBox) => ({
      kind: "safe-area",
      severity: "warn",
      deviceId: checkDevice.id,
      selector: pinnedBox.selector,
      message: `${pinnedBox.selector} sits under the notch or home bar`,
    }));
};

const findSmallTapTargets = (
  measurements: PageMeasurements,
  checkDevice: CheckDevice,
): Finding[] => {
  const isMouseOnly = !checkDevice.hasTouch;
  if (isMouseOnly) return [];

  return measurements.tapTargets
    .filter(({ width, height }) => Math.min(width, height) < MIN_TAP_SIZE)
    .map(({ selector, width, height }) => ({
      kind: "tap-target",
      severity: "warn",
      deviceId: checkDevice.id,
      selector,
      message:
        `${selector} is ${Math.round(width)}x${Math.round(height)}, ` +
        `under ${MIN_TAP_SIZE}x${MIN_TAP_SIZE}`,
    }));
};

export const listFindings = (
  measurements: PageMeasurements,
  checkDevice: CheckDevice,
): Finding[] => [
  ...findOverflow(measurements, checkDevice),
  ...findClippedLabels(measurements, checkDevice),
  ...listSafeAreaFindings(measurements, checkDevice),
  ...findSmallTapTargets(measurements, checkDevice),
];

// The browser also logs every failed request as a console error.
export const isRequestFailureEcho = (consoleMessage: string): boolean =>
  consoleMessage.startsWith(REQUEST_FAILURE_ECHO);

export const isFaviconUrl = (requestUrl: string): boolean =>
  new URL(requestUrl).pathname === FAVICON_PATH;

export const createConsoleFinding = (
  deviceId: string,
  consoleMessage: string,
): Finding => ({
  kind: "console-error",
  severity: "failed",
  deviceId,
  selector: null,
  message: consoleMessage,
});

export const createRequestFinding = (
  deviceId: string,
  requestUrl: string,
  failureReason: string | null,
): Finding => {
  const { pathname } = new URL(requestUrl);
  return {
    kind: "failed-request",
    severity: "failed",
    deviceId,
    selector: null,
    message: `${pathname} ${failureReason ?? "failed"}`,
  };
};
