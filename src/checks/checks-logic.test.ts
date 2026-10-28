import { describe, expect, test } from "vitest";
import type { PageMeasurements } from "@/checks/check-probes";
import {
  createConsoleFinding,
  createRequestFinding,
  isFaviconUrl,
  isRequestFailureEcho,
  listFindings,
} from "@/checks/checks-logic";

const PHONE = { id: "iphone-se", hasTouch: true };
const LAPTOP = { id: "laptop", hasTouch: false };
const EMPTY_PAGE: PageMeasurements = {
  viewportWidth: 375,
  viewportHeight: 667,
  widestPastEdge: null,
  clippedSelectors: [],
  pinnedBoxes: [],
  tapTargets: [],
  safeAreaInsets: { top: 0, bottom: 0 },
};
const NOTCH_INSETS = { top: 47, bottom: 34 };

describe("listFindings", () => {
  test("returns no findings for an empty page", () => {
    const measurements = EMPTY_PAGE;

    const findings = listFindings(measurements, PHONE);

    expect(findings).toEqual([]);
  });

  test("reports overflow with the px past the edge", () => {
    const widestPastEdge = { selector: ".cart-total", overflowPx: 18 };
    const measurements = { ...EMPTY_PAGE, widestPastEdge };

    const findings = listFindings(measurements, PHONE);

    expect(findings).toEqual([
      {
        kind: "overflow",
        severity: "fail",
        deviceId: "iphone-se",
        selector: ".cart-total",
        message: ".cart-total is 18px past the edge",
      },
    ]);
  });

  test("reports every clipped label as a warning", () => {
    const clippedSelectors = [".title", ".price"];
    const measurements = { ...EMPTY_PAGE, clippedSelectors };

    const findings = listFindings(measurements, PHONE);

    expect(findings.map((finding) => finding.selector)).toEqual([
      ".title",
      ".price",
    ]);
    expect(findings[0]?.kind).toBe("clipped-text");
    expect(findings[0]?.severity).toBe("warn");
  });

  test("reports a pinned box under the notch", () => {
    const pinnedBoxes = [
      {
        selector: ".header",
        top: 0,
        bottom: 60,
        paddingTop: 0,
        paddingBottom: 0,
      },
    ];
    const measurements = {
      ...EMPTY_PAGE,
      pinnedBoxes,
      safeAreaInsets: NOTCH_INSETS,
    };

    const findings = listFindings(measurements, PHONE);

    expect(findings.map((finding) => finding.kind)).toEqual(["safe-area"]);
  });

  test("reports a pinned box under the home bar", () => {
    const pinnedBoxes = [
      {
        selector: ".bar",
        top: 600,
        bottom: 667,
        paddingTop: 0,
        paddingBottom: 0,
      },
    ];
    const measurements = {
      ...EMPTY_PAGE,
      pinnedBoxes,
      safeAreaInsets: NOTCH_INSETS,
    };

    const findings = listFindings(measurements, PHONE);

    expect(findings.map((finding) => finding.selector)).toEqual([".bar"]);
  });

  test("accepts pinned boxes that pad for the insets", () => {
    const pinnedBoxes = [
      {
        selector: ".header",
        top: 0,
        bottom: 90,
        paddingTop: 47,
        paddingBottom: 0,
      },
      {
        selector: ".bar",
        top: 600,
        bottom: 667,
        paddingTop: 0,
        paddingBottom: 34,
      },
    ];
    const measurements = {
      ...EMPTY_PAGE,
      pinnedBoxes,
      safeAreaInsets: NOTCH_INSETS,
    };

    const findings = listFindings(measurements, PHONE);

    expect(findings).toEqual([]);
  });

  test("accepts pinned boxes clear of both insets", () => {
    const pinnedBoxes = [
      {
        selector: ".bar",
        top: 100,
        bottom: 160,
        paddingTop: 0,
        paddingBottom: 0,
      },
    ];
    const measurements = {
      ...EMPTY_PAGE,
      pinnedBoxes,
      safeAreaInsets: NOTCH_INSETS,
    };

    const findings = listFindings(measurements, PHONE);

    expect(findings).toEqual([]);
  });

  test("reports small tap targets on a touch device", () => {
    const tapTargets = [
      { selector: "button", width: 30.4, height: 30.2 },
      { selector: ".buy", width: 120, height: 48 },
    ];
    const measurements = { ...EMPTY_PAGE, tapTargets };

    const findings = listFindings(measurements, PHONE);

    expect(findings.map((finding) => finding.message)).toEqual([
      "button is 30x30, under 44x44",
    ]);
  });

  test("skips tap targets on a device without touch", () => {
    const tapTargets = [{ selector: "button", width: 30, height: 30 }];
    const measurements = { ...EMPTY_PAGE, tapTargets };

    const findings = listFindings(measurements, LAPTOP);

    expect(findings).toEqual([]);
  });
});

describe("createConsoleFinding", () => {
  test("makes a failing console-error finding without a selector", () => {
    const deviceId = "pixel-8";

    const finding = createConsoleFinding(deviceId, "boom");

    expect(finding).toEqual({
      kind: "console-error",
      severity: "fail",
      deviceId: "pixel-8",
      selector: null,
      message: "boom",
    });
  });
});

describe("createRequestFinding", () => {
  test("names the path and the failure text", () => {
    const requestUrl = "http://127.0.0.1:9/api/cart?x=1";

    const finding = createRequestFinding(
      "laptop",
      requestUrl,
      "net::ERR_FAILED",
    );

    expect(finding.kind).toBe("failed-request");
    expect(finding.message).toBe("/api/cart net::ERR_FAILED");
  });

  test("says failed when the request has no failure text", () => {
    const requestUrl = "http://127.0.0.1:9/api/cart";

    const finding = createRequestFinding("laptop", requestUrl, null);

    expect(finding.message).toBe("/api/cart failed");
  });
});

describe("isRequestFailureEcho", () => {
  test("is true for the browser's own failed-load message", () => {
    const consoleMessage = "Failed to load resource: net::ERR_FAILED";

    const isEcho = isRequestFailureEcho(consoleMessage);

    expect(isEcho).toBe(true);
  });

  test("is false for a message from the page", () => {
    const consoleMessage = "Cart total failed to load";

    const isEcho = isRequestFailureEcho(consoleMessage);

    expect(isEcho).toBe(false);
  });
});

describe("isFaviconUrl", () => {
  test("is true for the favicon path", () => {
    const isFavicon = isFaviconUrl("http://127.0.0.1:3000/favicon.ico");

    expect(isFavicon).toBe(true);
  });

  test("is false for any other path", () => {
    const isFavicon = isFaviconUrl("http://127.0.0.1:3000/api/cart");

    expect(isFavicon).toBe(false);
  });
});
