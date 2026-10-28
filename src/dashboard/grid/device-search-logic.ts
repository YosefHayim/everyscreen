import type { DeviceView } from "@/dashboard/devices/device-view-logic";

export const pickMatchingDevices = (
  deviceViews: DeviceView[],
  searchQuery: string,
): DeviceView[] => {
  const wantedName = searchQuery.trim().toLowerCase();
  const isSearchEmpty = wantedName === "";
  if (isSearchEmpty) return deviceViews;
  return deviceViews.filter((deviceView) =>
    deviceView.name.toLowerCase().includes(wantedName),
  );
};

export interface ShortcutPress {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
}

export type ShortcutHintKey =
  | "shell.searchShortcutMac"
  | "shell.searchShortcutOther";

export const isSearchShortcut = (shortcutPress: ShortcutPress): boolean => {
  const { key, metaKey, ctrlKey } = shortcutPress;
  const isKKey = key.toLowerCase() === "k";
  const isCommandHeld = metaKey || ctrlKey;
  return isKKey && isCommandHeld;
};

export const pickShortcutHintKey = (userAgent: string): ShortcutHintKey => {
  const isMacUserAgent = /Mac|iPhone|iPad/.test(userAgent);
  if (isMacUserAgent) return "shell.searchShortcutMac";
  return "shell.searchShortcutOther";
};
