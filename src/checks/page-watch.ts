import type { ConsoleMessage, Frame, Request, Response } from "playwright";
import {
  createConsoleFinding,
  createRequestFinding,
  type Finding,
  isFaviconUrl,
  isRequestFailureEcho,
} from "@/checks/checks-logic";
import type { PageWatcher } from "@/devices/page-watcher";
import { broadcast } from "@/live/live-feed";

const HTTP_ERROR_STATUS = 400;

export const watchPage: PageWatcher = async (page, deviceId) => {
  const sentFindingKeys = new Set<string>();
  const sendFinding = (finding: Finding) => {
    const findingKey = `${finding.kind}|${finding.message}`;
    const isAlreadySent = sentFindingKeys.has(findingKey);
    if (isAlreadySent) return;
    sentFindingKeys.add(findingKey);
    broadcast({ kind: "finding", finding });
  };

  const onConsole = (consoleMessage: ConsoleMessage) => {
    const consoleLine = consoleMessage.text();
    const isErrorMessage = consoleMessage.type() === "error";
    const isFindingWorthy =
      isErrorMessage && !isRequestFailureEcho(consoleLine);
    if (!isFindingWorthy) return;
    sendFinding(createConsoleFinding(deviceId, consoleLine));
  };
  const onPageError = (error: Error) => {
    sendFinding(createConsoleFinding(deviceId, error.message));
  };
  const onRequestFailed = (request: Request) => {
    const failureReason = request.failure()?.errorText ?? null;
    sendFinding(createRequestFinding(deviceId, request.url(), failureReason));
  };
  const onResponse = (httpResponse: Response) => {
    const isHttpError = httpResponse.status() >= HTTP_ERROR_STATUS;
    const isFavicon = isFaviconUrl(httpResponse.url());
    if (!isHttpError || isFavicon) return;
    const failureReason = String(httpResponse.status());
    const requestUrl = httpResponse.url();
    sendFinding(createRequestFinding(deviceId, requestUrl, failureReason));
  };
  const onNavigated = (frame: Frame) => {
    const isMainFrame = frame === page.mainFrame();
    if (isMainFrame) sentFindingKeys.clear();
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);
  page.on("framenavigated", onNavigated);

  return async () => {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);
    page.off("response", onResponse);
    page.off("framenavigated", onNavigated);
  };
};
