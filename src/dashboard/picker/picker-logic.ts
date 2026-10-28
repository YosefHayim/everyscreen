import type { DeviceMaker } from "@/devices/devices-logic";

export interface CatalogChoice {
  id: string;
  name: string;
  maker: DeviceMaker;
  isHiddenByCustomDevice: boolean;
}

export interface MakerGroup {
  maker: DeviceMaker;
  choices: CatalogChoice[];
}

const MAKER_ORDER: DeviceMaker[] = [
  "apple",
  "samsung",
  "google",
  "xiaomi",
  "oneplus",
  "generic",
];

export const listMakerGroups = (catalog: CatalogChoice[]): MakerGroup[] => {
  const shownChoices = catalog.filter(
    (choice) => !choice.isHiddenByCustomDevice,
  );
  return MAKER_ORDER.map((maker) => ({
    maker,
    choices: shownChoices.filter((choice) => choice.maker === maker),
  })).filter((makerGroup) => makerGroup.choices.length > 0);
};

export const toggleGridDeviceId = (
  gridDeviceIds: string[],
  deviceId: string,
): string[] => {
  const isInGrid = gridDeviceIds.includes(deviceId);
  if (isInGrid) return gridDeviceIds.filter((gridId) => gridId !== deviceId);
  return [...gridDeviceIds, deviceId];
};
