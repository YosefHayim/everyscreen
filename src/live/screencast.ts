import type { Page } from "playwright";
import type { StopWatching } from "@/devices/page-watcher";
import { SCREENCAST } from "@/environment";
import { broadcast } from "@/live/live-feed";

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
