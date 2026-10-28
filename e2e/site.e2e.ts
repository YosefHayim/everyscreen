import { expect, test } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
];
const SECTION_IDS = ["top", "checks", "steps", "cloud", "faq"];
const SECTION_HEADING_COUNT = 10;
const LOCAL_HOST = "127.0.0.1";

let siteServer: ViteDevServer;
let siteUrl: string;

test.beforeAll(async () => {
  siteServer = await createServer({
    configFile: "vite.site.config.ts",
    server: { port: 0, host: LOCAL_HOST, strictPort: false },
    logLevel: "error",
  });
  await siteServer.listen();
  const address = siteServer.httpServer?.address();
  const isAddressMissing = address === null || address === undefined;
  const isAddressText = typeof address === "string";
  if (isAddressMissing || isAddressText)
    throw new Error("Site server has no port");
  siteUrl = `http://${LOCAL_HOST}:${address.port}`;
});

test.afterAll(async () => {
  await siteServer.close();
});

for (const viewport of VIEWPORTS) {
  test.describe(`landing page at ${viewport.name} width`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });

    test("renders every section without console errors", async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      await page.route("https://fonts.googleapis.com/**", (route) =>
        route.fulfill({ contentType: "text/css", body: "" }),
      );

      await page.goto(siteUrl);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2 })).toHaveCount(
        SECTION_HEADING_COUNT,
      );
      for (const sectionId of SECTION_IDS) {
        await expect(page.locator(`#${sectionId}`)).toBeAttached();
      }
      await expect(page.getByRole("contentinfo")).toBeVisible();
      expect(consoleErrors).toEqual([]);
    });

    test("has no sideways scroll", async ({ page }) => {
      await page.goto(siteUrl);

      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );

      expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
    });

    test("gives every link a real href", async ({ page }) => {
      await page.goto(siteUrl);

      const hrefs = await page
        .locator("a")
        .evaluateAll((anchors) =>
          anchors.map((anchor) => anchor.getAttribute("href")),
        );

      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(href).toMatch(/^(https:\/\/|#[a-z])/);
      }
    });
  });
}
