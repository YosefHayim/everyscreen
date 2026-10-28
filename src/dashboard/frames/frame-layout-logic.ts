import type {
  CutoutKind,
  DeviceCutout,
  DevicePlatform,
  FrameShape,
  SafeAreaInsets,
  ViewportMode,
} from "@/devices/devices-logic";

export type FrameFamily =
  | "phone-home-button"
  | "phone-notch"
  | "phone-island"
  | "phone-hole-center"
  | "phone-hole-corner"
  | "phone-plain"
  | "tablet-home-button"
  | "tablet-hole"
  | "tablet"
  | "window-macos"
  | "window-windows"
  | "window-linux"
  | "kiosk";

export type StatusBarStyle = "ios" | "android";
export type WindowBarKind = "macos" | "windows" | "linux";
export type CutoutDrawing =
  | "island"
  | "notch"
  | "hole"
  | "home-button"
  | "camera";

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FrameSize {
  width: number;
  height: number;
}

export interface FrameSpec {
  frameShape: FrameShape;
  platform: DevicePlatform | null;
  cutout: DeviceCutout | null;
  cornerRadius: number | null;
  safeAreaInsets: SafeAreaInsets;
  viewportMode: ViewportMode;
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
}

interface CutoutDefault {
  width: number;
  height: number;
  top: number;
  left: number | null;
}

interface FamilyLook {
  bezelSide: number;
  bezelTop: number;
  bezelBottom: number;
  minBodyRadius: number;
  screenRadius: number;
  statusBarHeight: number;
  statusBarSidePadding: number;
  toolbarHeight: number;
  hasHomeIndicator: boolean;
  cutoutDrawing: CutoutDrawing | null;
  cutoutDefault: CutoutDefault;
  windowBarHeight: number;
  windowRadius: number;
}

const NO_CUTOUT: CutoutDefault = { width: 0, height: 0, top: 0, left: null };
const ISLAND_CUTOUT: CutoutDefault = {
  width: 126,
  height: 37,
  top: 11,
  left: null,
};
const NOTCH_CUTOUT: CutoutDefault = {
  width: 209,
  height: 30,
  top: 0,
  left: null,
};
const HOLE_CENTER_CUTOUT: CutoutDefault = {
  width: 11,
  height: 11,
  top: 8,
  left: null,
};
const HOLE_CORNER_CUTOUT: CutoutDefault = {
  width: 11,
  height: 11,
  top: 8,
  left: 24,
};
const PHONE_HOME_BUTTON_CUTOUT: CutoutDefault = {
  width: 66,
  height: 66,
  top: 0,
  left: null,
};
const TABLET_HOME_BUTTON_CUTOUT: CutoutDefault = {
  width: 52,
  height: 52,
  top: 0,
  left: null,
};
const CAMERA_CUTOUT: CutoutDefault = {
  width: 8,
  height: 8,
  top: 0,
  left: null,
};

const PHONE_LOOK = {
  bezelSide: 14,
  bezelTop: 13,
  bezelBottom: 13,
  minBodyRadius: 0,
  screenRadius: 55,
  statusBarHeight: 59,
  statusBarSidePadding: 28,
  toolbarHeight: 50,
  hasHomeIndicator: true,
  cutoutDrawing: null,
  cutoutDefault: NO_CUTOUT,
  windowBarHeight: 0,
  windowRadius: 0,
} satisfies FamilyLook;

const ANDROID_PHONE_LOOK = {
  ...PHONE_LOOK,
  bezelSide: 12,
  bezelTop: 11,
  bezelBottom: 11,
  screenRadius: 36,
  statusBarHeight: 24,
  statusBarSidePadding: 24,
  toolbarHeight: 56,
} satisfies FamilyLook;

const TABLET_LOOK = {
  ...PHONE_LOOK,
  bezelSide: 52,
  bezelTop: 52,
  bezelBottom: 52,
  screenRadius: 18,
  statusBarHeight: 24,
  statusBarSidePadding: 24,
  cutoutDrawing: "camera",
  cutoutDefault: CAMERA_CUTOUT,
} satisfies FamilyLook;

const WINDOW_LOOK = {
  ...PHONE_LOOK,
  bezelSide: 0,
  bezelTop: 0,
  bezelBottom: 0,
  screenRadius: 0,
  statusBarHeight: 0,
  hasHomeIndicator: false,
} satisfies FamilyLook;

const FAMILY_LOOKS = {
  "phone-home-button": {
    ...PHONE_LOOK,
    bezelSide: 28,
    bezelTop: 110,
    bezelBottom: 110,
    minBodyRadius: 46,
    screenRadius: 0,
    statusBarHeight: 20,
    statusBarSidePadding: 8,
    toolbarHeight: 44,
    hasHomeIndicator: false,
    cutoutDrawing: "home-button",
    cutoutDefault: PHONE_HOME_BUTTON_CUTOUT,
  },
  "phone-notch": {
    ...PHONE_LOOK,
    screenRadius: 47,
    statusBarHeight: 47,
    cutoutDrawing: "notch",
    cutoutDefault: NOTCH_CUTOUT,
  },
  "phone-island": {
    ...PHONE_LOOK,
    cutoutDrawing: "island",
    cutoutDefault: ISLAND_CUTOUT,
  },
  "phone-hole-center": {
    ...ANDROID_PHONE_LOOK,
    cutoutDrawing: "hole",
    cutoutDefault: HOLE_CENTER_CUTOUT,
  },
  "phone-hole-corner": {
    ...ANDROID_PHONE_LOOK,
    cutoutDrawing: "hole",
    cutoutDefault: HOLE_CORNER_CUTOUT,
  },
  "phone-plain": ANDROID_PHONE_LOOK,
  "tablet-home-button": {
    ...TABLET_LOOK,
    bezelSide: 40,
    bezelTop: 90,
    bezelBottom: 90,
    minBodyRadius: 28,
    screenRadius: 0,
    statusBarHeight: 20,
    hasHomeIndicator: false,
    cutoutDrawing: "home-button",
    cutoutDefault: TABLET_HOME_BUTTON_CUTOUT,
  },
  "tablet-hole": {
    ...TABLET_LOOK,
    bezelSide: 16,
    bezelTop: 16,
    bezelBottom: 16,
    screenRadius: 20,
    statusBarHeight: 30,
    cutoutDrawing: "hole",
    cutoutDefault: HOLE_CENTER_CUTOUT,
  },
  tablet: TABLET_LOOK,
  "window-macos": {
    ...WINDOW_LOOK,
    windowBarHeight: 52,
    windowRadius: 14,
  },
  "window-windows": {
    ...WINDOW_LOOK,
    windowBarHeight: 80,
    windowRadius: 8,
  },
  "window-linux": {
    ...WINDOW_LOOK,
    windowBarHeight: 47,
    windowRadius: 12,
  },
  kiosk: {
    ...WINDOW_LOOK,
    bezelSide: 14,
    bezelTop: 14,
    bezelBottom: 14,
    minBodyRadius: 6,
  },
} satisfies Record<FrameFamily, FamilyLook>;

const STATUS_FONT_MAX = { ios: 17, android: 14 } satisfies Record<
  StatusBarStyle,
  number
>;
const STATUS_FONT_SHARE = 0.6;
const HOME_INDICATOR_SIZES = {
  ios: { width: 134, height: 5 },
  android: { width: 108, height: 4 },
} satisfies Record<StatusBarStyle, FrameSize>;
const HOME_INDICATOR_BOTTOM_GAP = 8;

export interface StatusBarLayout {
  style: StatusBarStyle;
  box: Box;
  centerY: number;
  fontSize: number;
  sidePadding: number;
  startZoneWidth: number | null;
  endZoneWidth: number | null;
}

export interface FrameLayout {
  family: FrameFamily;
  width: number;
  height: number;
  bodyRadius: number;
  hasBody: boolean;
  screen: Box & { radius: number };
  page: Box;
  statusBar: StatusBarLayout | null;
  toolbar: Box | null;
  windowBar: { kind: WindowBarKind; box: Box } | null;
  cutout: { drawing: CutoutDrawing; box: Box } | null;
  homeIndicator: Box | null;
}

const SHAPE_FAMILIES = {
  "home-button": "phone-home-button",
  "dynamic-island": "phone-island",
  "punch-hole": "phone-hole-center",
  tablet: "tablet",
  laptop: "window-macos",
  kiosk: "kiosk",
} satisfies Record<FrameShape, FrameFamily>;

const PHONE_CUTOUT_FAMILIES = {
  none: "phone-plain",
  notch: "phone-notch",
  "dynamic-island": "phone-island",
  "punch-hole-center": "phone-hole-center",
  "punch-hole-corner": "phone-hole-corner",
  "home-button": "phone-home-button",
} satisfies Record<CutoutKind, FrameFamily>;

const TABLET_CUTOUT_FAMILIES = {
  none: "tablet",
  notch: "tablet",
  "dynamic-island": "tablet",
  "punch-hole-center": "tablet-hole",
  "punch-hole-corner": "tablet-hole",
  "home-button": "tablet-home-button",
} satisfies Record<CutoutKind, FrameFamily>;

const WINDOW_PLATFORM_FAMILIES = {
  ios: "window-macos",
  ipados: "window-macos",
  android: "window-macos",
  macos: "window-macos",
  windows: "window-windows",
  linux: "window-linux",
} satisfies Record<DevicePlatform, FrameFamily>;

const PLATFORM_STATUS_STYLES = {
  ios: "ios",
  ipados: "ios",
  android: "android",
  macos: null,
  windows: null,
  linux: null,
} satisfies Record<DevicePlatform, StatusBarStyle | null>;

const SHAPE_STATUS_STYLES = {
  "home-button": "ios",
  "dynamic-island": "ios",
  "punch-hole": "android",
  tablet: null,
  laptop: null,
  kiosk: null,
} satisfies Record<FrameShape, StatusBarStyle | null>;

const WINDOW_BAR_KINDS = {
  "window-macos": "macos",
  "window-windows": "windows",
  "window-linux": "linux",
  "phone-home-button": null,
  "phone-notch": null,
  "phone-island": null,
  "phone-hole-center": null,
  "phone-hole-corner": null,
  "phone-plain": null,
  "tablet-home-button": null,
  "tablet-hole": null,
  tablet: null,
  kiosk: null,
} satisfies Record<FrameFamily, WindowBarKind | null>;

const isPhoneShape = (frameShape: FrameShape): boolean =>
  frameShape === "home-button" ||
  frameShape === "dynamic-island" ||
  frameShape === "punch-hole";

export const pickFrameFamily = (frameSpec: FrameSpec): FrameFamily => {
  const { frameShape, platform, cutout } = frameSpec;
  const isCutoutKnown = cutout !== null;
  const isPhone = isPhoneShape(frameShape);
  const isTablet = frameShape === "tablet";
  const isWindow = frameShape === "laptop";
  const isPlatformKnown = platform !== null;
  if (isPhone && isCutoutKnown) return PHONE_CUTOUT_FAMILIES[cutout.kind];
  if (isTablet && isCutoutKnown) return TABLET_CUTOUT_FAMILIES[cutout.kind];
  if (isWindow && isPlatformKnown) return WINDOW_PLATFORM_FAMILIES[platform];
  return SHAPE_FAMILIES[frameShape];
};

export const pickStatusBarStyle = (
  frameSpec: FrameSpec,
): StatusBarStyle | null => {
  const { platform, frameShape } = frameSpec;
  const isPlatformKnown = platform !== null;
  if (isPlatformKnown) return PLATFORM_STATUS_STYLES[platform];
  return SHAPE_STATUS_STYLES[frameShape];
};

interface CutoutPlacement {
  drawing: CutoutDrawing;
  box: Box;
  screenLeft: number;
}

const pickCutoutPlacement = (
  frameSpec: FrameSpec,
  look: FamilyLook,
  screenHeight: number,
): CutoutPlacement | null => {
  const { cutoutDrawing, cutoutDefault } = look;
  const hasNoCutout = cutoutDrawing === null;
  if (hasNoCutout) return null;

  const { bezelSide, bezelTop, bezelBottom } = look;
  const { viewportWidth } = frameSpec;
  const isHomeButton = cutoutDrawing === "home-button";
  if (isHomeButton) {
    const { width: diameter } = cutoutDefault;
    const homeButtonBox = {
      left: bezelSide + (viewportWidth - diameter) / 2,
      top: bezelTop + screenHeight + (bezelBottom - diameter) / 2,
      width: diameter,
      height: diameter,
    };
    return { drawing: cutoutDrawing, box: homeButtonBox, screenLeft: 0 };
  }

  const isCamera = cutoutDrawing === "camera";
  if (isCamera) {
    const { width: cameraSize } = cutoutDefault;
    const cameraBox = {
      left: bezelSide + (viewportWidth - cameraSize) / 2,
      top: (bezelTop - cameraSize) / 2,
      width: cameraSize,
      height: cameraSize,
    };
    return { drawing: cutoutDrawing, box: cameraBox, screenLeft: 0 };
  }

  const published = frameSpec.cutout;
  const width = published?.width ?? cutoutDefault.width;
  const height = published?.height ?? cutoutDefault.height;
  const top = published?.top ?? cutoutDefault.top;
  const defaultLeft = cutoutDefault.left ?? (viewportWidth - width) / 2;
  const screenLeft = published?.left ?? defaultLeft;
  const box = {
    left: bezelSide + screenLeft,
    top: bezelTop + top,
    width,
    height,
  };
  return { drawing: cutoutDrawing, box, screenLeft };
};

const isCutoutAroundStatusBar = (drawing: CutoutDrawing): boolean =>
  drawing === "island" || drawing === "notch";

const createStatusBar = (
  style: StatusBarStyle,
  statusHeight: number,
  screenWidth: number,
  look: FamilyLook,
  cutoutPlacement: CutoutPlacement | null,
): StatusBarLayout => {
  const fontSize = Math.min(
    STATUS_FONT_MAX[style],
    Math.round(statusHeight * STATUS_FONT_SHARE),
  );
  const box = { left: 0, top: 0, width: screenWidth, height: statusHeight };
  const hasNoCutout = cutoutPlacement === null;
  const baseBar = {
    style,
    box,
    fontSize,
    sidePadding: look.statusBarSidePadding,
  };
  if (hasNoCutout) {
    return {
      ...baseBar,
      centerY: statusHeight / 2,
      startZoneWidth: null,
      endZoneWidth: null,
    };
  }

  const { drawing, screenLeft } = cutoutPlacement;
  const cutoutWidth = cutoutPlacement.box.width;
  const isAroundCutout = isCutoutAroundStatusBar(drawing);
  const isCutoutCentered = drawing === "island" || drawing === "hole";
  const cutoutCenterY =
    cutoutPlacement.box.top - look.bezelTop + cutoutPlacement.box.height / 2;
  const isBarOnCutoutLine = isCutoutCentered && cutoutCenterY < statusHeight;
  const centerY = isBarOnCutoutLine ? cutoutCenterY : statusHeight / 2;
  const startZoneWidth = isAroundCutout ? screenLeft : null;
  const endZoneWidth = isAroundCutout
    ? screenWidth - screenLeft - cutoutWidth
    : null;
  return { ...baseBar, centerY, startZoneWidth, endZoneWidth };
};

const createWindowLayout = (
  frameSpec: FrameSpec,
  family: FrameFamily,
  windowBarKind: WindowBarKind,
): FrameLayout => {
  const look = FAMILY_LOOKS[family];
  const { viewportWidth, viewportHeight } = frameSpec;
  const width = viewportWidth;
  const height = look.windowBarHeight + viewportHeight;
  const barBox = { left: 0, top: 0, width, height: look.windowBarHeight };
  return {
    family,
    width,
    height,
    bodyRadius: look.windowRadius,
    hasBody: false,
    screen: { left: 0, top: 0, width, height, radius: look.windowRadius },
    page: {
      left: 0,
      top: look.windowBarHeight,
      width: viewportWidth,
      height: viewportHeight,
    },
    statusBar: null,
    toolbar: null,
    windowBar: { kind: windowBarKind, box: barBox },
    cutout: null,
    homeIndicator: null,
  };
};

const pickStatusHeight = (
  frameSpec: FrameSpec,
  look: FamilyLook,
  statusStyle: StatusBarStyle | null,
): number => {
  const hasNoStatusBar = statusStyle === null || look.statusBarHeight === 0;
  if (hasNoStatusBar) return 0;
  const { top: insetTop } = frameSpec.safeAreaInsets;
  const isInsetPublished = insetTop > 0;
  if (isInsetPublished) return insetTop;
  return look.statusBarHeight;
};

interface ChromeHeights {
  total: number;
  toolbar: number;
}

const pickChromeHeights = (
  frameSpec: FrameSpec,
  look: FamilyLook,
  statusHeight: number,
): ChromeHeights => {
  const isBrowserMode = frameSpec.viewportMode === "browser";
  const hasNoChrome = !isBrowserMode || statusHeight === 0;
  if (hasNoChrome) return { total: 0, toolbar: 0 };

  const gap = frameSpec.screenHeight - frameSpec.viewportHeight;
  const isGapKnown = gap > statusHeight;
  if (isGapKnown) return { total: gap, toolbar: gap - statusHeight };
  return {
    total: statusHeight + look.toolbarHeight,
    toolbar: look.toolbarHeight,
  };
};

const createHomeIndicator = (
  statusStyle: StatusBarStyle | null,
  look: FamilyLook,
  screenSize: FrameSize,
): Box | null => {
  const hasNoIndicator = statusStyle === null || !look.hasHomeIndicator;
  if (hasNoIndicator) return null;
  const { width, height } = HOME_INDICATOR_SIZES[statusStyle];
  return {
    left: (screenSize.width - width) / 2,
    top: screenSize.height - HOME_INDICATOR_BOTTOM_GAP - height,
    width,
    height,
  };
};

const createDeviceLayout = (
  frameSpec: FrameSpec,
  family: FrameFamily,
): FrameLayout => {
  const look = FAMILY_LOOKS[family];
  const statusStyle = pickStatusBarStyle(frameSpec);
  const statusHeight = pickStatusHeight(frameSpec, look, statusStyle);
  const chrome = pickChromeHeights(frameSpec, look, statusHeight);
  const { viewportWidth, viewportHeight } = frameSpec;
  const screenSize = {
    width: viewportWidth,
    height: viewportHeight + chrome.total,
  };
  const screenRadius = frameSpec.cornerRadius ?? look.screenRadius;
  const hasToolbar = chrome.toolbar > 0;
  const isToolbarAtBottom = statusStyle === "ios";
  const toolbarTop = isToolbarAtBottom
    ? statusHeight + viewportHeight
    : statusHeight;
  const toolbar = hasToolbar
    ? { left: 0, top: toolbarTop, width: viewportWidth, height: chrome.toolbar }
    : null;
  const isBrowserChromeShown = chrome.total > 0;
  const pageTopBelowChrome = isToolbarAtBottom
    ? statusHeight
    : statusHeight + chrome.toolbar;
  const pageTop = isBrowserChromeShown ? pageTopBelowChrome : 0;
  const cutoutPlacement = pickCutoutPlacement(
    frameSpec,
    look,
    screenSize.height,
  );
  const hasStatusBar = statusStyle !== null && statusHeight > 0;
  const statusBar = hasStatusBar
    ? createStatusBar(
        statusStyle,
        statusHeight,
        viewportWidth,
        look,
        cutoutPlacement,
      )
    : null;

  return {
    family,
    width: screenSize.width + 2 * look.bezelSide,
    height: screenSize.height + look.bezelTop + look.bezelBottom,
    bodyRadius: Math.max(screenRadius + look.bezelSide, look.minBodyRadius),
    hasBody: true,
    screen: {
      left: look.bezelSide,
      top: look.bezelTop,
      width: screenSize.width,
      height: screenSize.height,
      radius: screenRadius,
    },
    page: {
      left: 0,
      top: pageTop,
      width: viewportWidth,
      height: viewportHeight,
    },
    statusBar,
    toolbar,
    windowBar: null,
    cutout: cutoutPlacement,
    homeIndicator: createHomeIndicator(statusStyle, look, screenSize),
  };
};

export const pickFrameLayout = (frameSpec: FrameSpec): FrameLayout => {
  const family = pickFrameFamily(frameSpec);
  const windowBarKind = WINDOW_BAR_KINDS[family];
  const isWindow = windowBarKind !== null;
  if (isWindow) return createWindowLayout(frameSpec, family, windowBarKind);
  return createDeviceLayout(frameSpec, family);
};

export const createDefaultFrameSpec = (
  frameShape: FrameShape,
  viewportSize: FrameSize,
): FrameSpec => ({
  frameShape,
  platform: null,
  cutout: null,
  cornerRadius: null,
  safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  viewportMode: "full-screen",
  viewportWidth: viewportSize.width,
  viewportHeight: viewportSize.height,
  screenWidth: viewportSize.width,
  screenHeight: viewportSize.height,
});

// A frame never grows past its true css size.
export const pickFitScale = (
  frameSize: FrameSize,
  boxSize: FrameSize,
): number =>
  Math.min(
    1,
    boxSize.width / frameSize.width,
    boxSize.height / frameSize.height,
  );
