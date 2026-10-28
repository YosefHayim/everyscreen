import { devices } from "playwright";
import { describe, expect, test } from "vitest";
import { createDesktopUserAgent } from "@/devices/desktop-user-agent-logic";

const REGISTRY_USER_AGENT = devices["Desktop Chrome"].userAgent;

describe("createDesktopUserAgent", () => {
  test("keeps the registry agent for Windows", () => {
    const userAgent = createDesktopUserAgent("windows", REGISTRY_USER_AGENT);

    expect(userAgent).toBe(REGISTRY_USER_AGENT);
  });

  test("swaps the platform part for a Mac and keeps the Chrome version", () => {
    const userAgent = createDesktopUserAgent("macos", REGISTRY_USER_AGENT);

    expect(userAgent).toContain("(Macintosh; Intel Mac OS X 10_15_7)");
    expect(userAgent).not.toContain("Windows");
    expect(userAgent.split(")")[1]).toBe(REGISTRY_USER_AGENT.split(")")[1]);
  });

  test("swaps the platform part for Linux", () => {
    const userAgent = createDesktopUserAgent("linux", REGISTRY_USER_AGENT);

    expect(userAgent).toContain("(X11; Linux x86_64)");
    expect(userAgent).not.toContain("Windows");
  });
});
