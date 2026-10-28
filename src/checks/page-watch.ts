import type { ConsoleMessage, Page, Request, Response } from "@playwright/test";
import {
  createConsoleFinding,
  createRequestFinding,
  type Finding,
  isRequestFailureEcho,
} from "@/checks/checks-logic";
import { broadcast } from "@/live/live-feed";

const HTTP_ERROR_STATUS = 400;

export const watchPage = (page: Page, deviceId: string): (() => void) => {
  const sendFinding = (finding: Finding) => {
    broadcast({ kind: "finding", finding });
  };

  const onConsole = (consoleMessage: ConsoleMessage) => {
    const isErrorMessage = consoleMessage.type() === "error";
    const messageText = consoleMessage.text();
    const isFindingWorthy =
      isErrorMessage && !isRequestFailureEcho(messageText);
    if (isFindingWorthy)
      sendFinding(createConsoleFinding(deviceId, messageText));
  };
  const onPageError = (error: Error) => {
    sendFinding(createConsoleFinding(deviceId, error.message));
  };
  const onRequestFailed = (request: Request) => {
    const failureText = request.failure()?.errorText ?? null;
    sendFinding(createRequestFinding(deviceId, request.url(), failureText));
  };
  const onResponse = (reply: Response) => {
    const isHttpError = reply.status() >= HTTP_ERROR_STATUS;
    if (isHttpError) {
      const failureText = String(reply.status());
      sendFinding(createRequestFinding(deviceId, reply.url(), failureText));
    }
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);

  return () => {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);
    page.off("response", onResponse);
  };
};
