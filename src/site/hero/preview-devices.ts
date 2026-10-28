import type { FrameShape } from "@/devices/devices-logic";

export type PreviewBadge = "passed" | "finding";

export interface PreviewDevice {
  id: string;
  frameShape: FrameShape;
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  frameRate: number;
  cartTopInset: number;
  badge: PreviewBadge;
  hasCouponOverflow: boolean;
  isHiddenOnPhone: boolean;
}

export const PREVIEW_DEVICES: PreviewDevice[] = [
  {
    id: "iphone-15",
    frameShape: "dynamic-island",
    viewportWidth: 393,
    viewportHeight: 852,
    screenWidth: 141,
    frameRate: 60,
    cartTopInset: 24,
    badge: "passed",
    hasCouponOverflow: false,
    isHiddenOnPhone: false,
  },
  {
    id: "iphone-se",
    frameShape: "home-button",
    viewportWidth: 375,
    viewportHeight: 667,
    screenWidth: 135,
    frameRate: 54,
    cartTopInset: 10,
    badge: "finding",
    hasCouponOverflow: true,
    isHiddenOnPhone: false,
  },
  {
    id: "pixel-8",
    frameShape: "punch-hole",
    viewportWidth: 412,
    viewportHeight: 915,
    screenWidth: 148,
    frameRate: 58,
    cartTopInset: 22,
    badge: "passed",
    hasCouponOverflow: false,
    isHiddenOnPhone: true,
  },
  {
    id: "ipad-mini",
    frameShape: "tablet",
    viewportWidth: 744,
    viewportHeight: 1133,
    screenWidth: 268,
    frameRate: 60,
    cartTopInset: 10,
    badge: "passed",
    hasCouponOverflow: false,
    isHiddenOnPhone: true,
  },
];
