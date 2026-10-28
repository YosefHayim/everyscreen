export type DesktopPlatform = "macos" | "windows" | "linux";

const REGISTRY_PLATFORM_PART = /\(Windows NT [^)]+\)/;

// Chrome freezes the platform part of its Mac and Linux agents, so only that part differs from the Windows agent.
const PLATFORM_PARTS = {
  macos: "(Macintosh; Intel Mac OS X 10_15_7)",
  linux: "(X11; Linux x86_64)",
};

export const createDesktopUserAgent = (
  desktopPlatform: DesktopPlatform,
  registryUserAgent: string,
): string => {
  const isRegistryAgentUsed = desktopPlatform === "windows";
  if (isRegistryAgentUsed) return registryUserAgent;
  return registryUserAgent.replace(
    REGISTRY_PLATFORM_PART,
    PLATFORM_PARTS[desktopPlatform],
  );
};
