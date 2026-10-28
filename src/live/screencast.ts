import type { Page } from "playwright";
import { SCREENCAST } from "@/environment";
import { broadcast } from "@/live/live-feed";

export const startScreencast = async (
  page: Page,
  deviceId: string,
): Promise<() => Promise<void>> => {
  const session = await page.context().newCDPSession(page);
  session.on("Page.screencastFrame", async (frame) => {
    broadcast({ kind: "screen", deviceId, imageBase64: frame.data });
    try {
      await session.send("Page.screencastFrameAck", {
        sessionId: frame.sessionId,
      });
    } catch (error) {
      console.error({ deviceId, error });
    }
  });
  await session.send("Page.startScreencast", { ...SCREENCAST });

  // A still page paints too few frames for the screencast, so each load sends one still screen image.
  const sendStillScreen = async (): Promise<void> => {
    const stillShot = await session.send("Page.captureScreenshot", {
      format: SCREENCAST.format,
      quality: SCREENCAST.quality,
    });
    broadcast({ kind: "screen", deviceId, imageBase64: stillShot.data });
  };
  const sendStillScreenOnLoad = (): void => {
    sendStillScreen().catch((error) => {
      console.error({ deviceId, error });
    });
  };
  page.on("load", sendStillScreenOnLoad);
  sendStillScreenOnLoad();

  return async () => {
    page.off("load", sendStillScreenOnLoad);
    await session.send("Page.stopScreencast");
    await session.detach();
  };
};
