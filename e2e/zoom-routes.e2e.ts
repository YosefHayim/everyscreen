import { expect, test } from "@playwright/test";
import { createZoomRoutes } from "@/live/zoom-routes";

const putZoom = (zoomBody: unknown) => ({
  method: "PUT",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(zoomBody),
});

test.describe("zoom routes", () => {
  test("accepts null to drop back to the normal stream", async () => {
    const zoomRoutes = createZoomRoutes();

    const zoomReply = await zoomRoutes.request(
      "/",
      putZoom({ deviceId: null }),
    );

    expect(zoomReply.status).toBe(200);
    expect(await zoomReply.json()).toEqual({ deviceId: null });
  });

  test("answers 422 for a device that has no live browser", async () => {
    const zoomRoutes = createZoomRoutes();

    const zoomReply = await zoomRoutes.request(
      "/",
      putZoom({ deviceId: "nokia-3310" }),
    );

    expect(zoomReply.status).toBe(422);
    expect(await zoomReply.text()).toContain("nokia-3310");
  });

  test("answers 400 for an empty device id", async () => {
    const zoomRoutes = createZoomRoutes();

    const zoomReply = await zoomRoutes.request("/", putZoom({ deviceId: "" }));

    expect(zoomReply.status).toBe(400);
  });
});
