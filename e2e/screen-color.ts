import type { Page } from "playwright";

export interface ScreenColor {
  red: number;
  green: number;
  blue: number;
}

export const readCenterColor = (
  page: Page,
  imageBase64: string,
): Promise<ScreenColor> =>
  page.evaluate(async (jpegBase64) => {
    const image = new Image();
    image.src = `data:image/jpeg;base64,${jpegBase64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const canvasContext = canvas.getContext("2d");
    if (canvasContext === null) throw new Error("No canvas context");
    canvasContext.drawImage(image, 0, 0);
    const [red, green, blue] = canvasContext.getImageData(
      Math.floor(image.width / 2),
      Math.floor(image.height / 2),
      1,
      1,
    ).data;
    return { red, green, blue };
  }, imageBase64);
