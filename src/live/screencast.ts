import { errors, type Page } from "playwright";
import type { StopWatching } from "@/devices/device-browsers";
import { SCREENCAST } from "@/environment";
import { broadcast } from "@/live/live-feed";

const PAINT_TIMEOUT_MS = 3000;

// A single-page app paints after the load event, so a screen image taken right after goto is white.
const waitForPaintedPage = async (page: Page): Promise<void> => {
  try {
    await page.waitForFunction(
      () => {
        const { body } = document;
        const isBodyMissing = body === null;
        if (isBodyMissing) return false;
        // innerText skips script text, which textContent would count as painted.
        // biome-ignore lint/performance/useDomNodeTextContent: only rendered text counts
        const hasText = body.innerText.trim().length > 0;
        const hasMedia = body.querySelector("img, canvas, svg, video") !== null;
        return hasText || hasMedia;
      },
      undefined,
      { timeout: PAINT_TIMEOUT_MS },
    );
  } catch (error) {
    const isPageStillEmpty = error instanceof errors.TimeoutError;
    if (!isPageStillEmpty) throw error;
  }
  await page.evaluate(
    () =>
      new Promise<void>((onPainted) => {
        requestAnimationFrame(() => requestAnimationFrame(() => onPainted()));
      }),
  );
};

export const startScreencast = async (
  page: Page,
  deviceId: string,
): Promise<StopWatching> => {
  const cdpSession = await page.context().newCDPSession(page);
  cdpSession.on("Page.screencastFrame", async (screencastFrame) => {
    try {
      await cdpSession.send("Page.screencastFrameAck", {
        sessionId: screencastFrame.sessionId,
      });
    } catch (error) {
      const hasPageClosed = page.isClosed();
      if (hasPageClosed) return;
      console.error({ deviceId, error });
    }
    broadcast({ kind: "screen", deviceId, imageBase64: screencastFrame.data });
  });
  await cdpSession.send("Page.startScreencast", { ...SCREENCAST });

  // A still page paints too few frames for the screencast, so each load sends one still screen image.
  const sendStillScreenImage = async (): Promise<void> => {
    await waitForPaintedPage(page);
    const stillScreenImage = await cdpSession.send("Page.captureScreenshot", {
      format: SCREENCAST.format,
      quality: SCREENCAST.quality,
    });
    broadcast({
      kind: "screen",
      deviceId,
      imageBase64: stillScreenImage.data,
    });
  };
  const sendStillScreenImageOnLoad = (): void => {
    sendStillScreenImage().catch((error) => {
      const hasPageClosed = page.isClosed();
      if (hasPageClosed) return;
      console.error({ deviceId, error });
    });
  };
  page.on("load", sendStillScreenImageOnLoad);
  sendStillScreenImageOnLoad();

  return async () => {
    page.off("load", sendStillScreenImageOnLoad);
    try {
      await cdpSession.send("Page.stopScreencast");
    } finally {
      await cdpSession.detach();
    }
  };
};

export const sendStepScreen = async (
  page: Page,
  deviceId: string,
): Promise<void> => {
  await waitForPaintedPage(page);
  const stepScreenImage = await page.screenshot({
    type: SCREENCAST.format,
    quality: SCREENCAST.quality,
  });
  broadcast({
    kind: "screen",
    deviceId,
    imageBase64: stepScreenImage.toString("base64"),
  });
};
