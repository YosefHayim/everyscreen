import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/dashboard/ui/cn";

const SIZE_STRIP_SCALE = 0.13;

type OutlineShape = "phone" | "tablet" | "laptop" | "kiosk";

interface SizeStripDevice {
  id: string;
  outlineShape: OutlineShape;
  viewportWidth: number;
  viewportHeight: number;
}

const SIZE_STRIP_DEVICES: SizeStripDevice[] = [
  {
    id: "iphone-se",
    outlineShape: "phone",
    viewportWidth: 375,
    viewportHeight: 667,
  },
  {
    id: "iphone-15",
    outlineShape: "phone",
    viewportWidth: 393,
    viewportHeight: 852,
  },
  {
    id: "iphone-15-pro-max",
    outlineShape: "phone",
    viewportWidth: 430,
    viewportHeight: 932,
  },
  {
    id: "galaxy-s24",
    outlineShape: "phone",
    viewportWidth: 360,
    viewportHeight: 780,
  },
  {
    id: "pixel-8",
    outlineShape: "phone",
    viewportWidth: 412,
    viewportHeight: 915,
  },
  {
    id: "ipad-mini",
    outlineShape: "tablet",
    viewportWidth: 744,
    viewportHeight: 1133,
  },
  {
    id: "ipad-pro-11",
    outlineShape: "tablet",
    viewportWidth: 834,
    viewportHeight: 1194,
  },
  {
    id: "laptop-1440",
    outlineShape: "laptop",
    viewportWidth: 1440,
    viewportHeight: 900,
  },
  {
    id: "store-kiosk",
    outlineShape: "kiosk",
    viewportWidth: 1080,
    viewportHeight: 1920,
  },
];

const OUTLINE_CLASS_NAMES = {
  phone: "rounded-[10px] border-[1.5px] border-ink bg-paper",
  tablet: "rounded-md border-[1.5px] border-ink bg-paper",
  laptop: "rounded-t-md border-[1.5px] border-b-[6px] border-ink bg-paper",
  kiosk: "rounded-md border border-dashed border-cobalt bg-cobalt/5",
} satisfies Record<OutlineShape, string>;

export const SizeStrip = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <ul className="scroll-sideways m-0 flex list-none items-end justify-start gap-5 rounded-2xl border border-line bg-card p-6 md:justify-center">
      {SIZE_STRIP_DEVICES.map((device) => {
        const isKiosk = device.outlineShape === "kiosk";
        return (
          <li
            key={device.id}
            className="flex flex-none flex-col items-center gap-1.5"
          >
            <div
              className={cn(
                "relative flex items-start justify-start",
                OUTLINE_CLASS_NAMES[device.outlineShape],
              )}
              style={{
                width: Math.round(device.viewportWidth * SIZE_STRIP_SCALE),
                height: Math.round(device.viewportHeight * SIZE_STRIP_SCALE),
              }}
            >
              {isKiosk && (
                <span className="m-1 rounded-full bg-cobalt px-1.5 py-px font-mono text-[10px] text-card">
                  {t("device-sizes.justAdded")}
                </span>
              )}
            </div>
            <span className="text-[12.5px] font-medium">
              {t(`devices.${device.id}.name`)}
            </span>
            <span className="font-mono text-[11px] text-ink-3">
              {t("devices.size", {
                width: device.viewportWidth,
                height: device.viewportHeight,
              })}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
