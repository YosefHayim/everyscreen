import type { FrameShape } from "@/devices/devices-logic";

// Frame sizes on the board are drawn for a screen shown at this scale.
const REFERENCE_SCALE = 0.36;

export type FramePaint = "solid-frame" | "solid-detail" | "outline-detail";

interface FramePart {
  path: string;
  paint: FramePaint;
}

export interface FrameLayout {
  width: number;
  height: number;
  screenLeft: number;
  screenTop: number;
  screenWidth: number;
  screenHeight: number;
  screenCornerRadius: string;
  parts: FramePart[];
}

export interface FrameSize {
  frameShape: FrameShape;
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
}

interface FrameLook {
  bezelSide: number;
  bezelTop: number;
  bezelBottom: number;
  radius: number;
  screenRadius: number;
}

const FRAME_LOOKS = {
  "home-button": {
    bezelSide: 7,
    bezelTop: 30,
    bezelBottom: 30,
    radius: 22,
    screenRadius: 0,
  },
  "dynamic-island": {
    bezelSide: 5,
    bezelTop: 5,
    bezelBottom: 5,
    radius: 25,
    screenRadius: 20,
  },
  "punch-hole": {
    bezelSide: 5,
    bezelTop: 5,
    bezelBottom: 5,
    radius: 23,
    screenRadius: 18,
  },
  tablet: {
    bezelSide: 10,
    bezelTop: 10,
    bezelBottom: 10,
    radius: 17,
    screenRadius: 7,
  },
  laptop: {
    bezelSide: 9,
    bezelTop: 9,
    bezelBottom: 0,
    radius: 14,
    screenRadius: 4,
  },
  kiosk: {
    bezelSide: 14,
    bezelTop: 14,
    bezelBottom: 14,
    radius: 6,
    screenRadius: 2,
  },
} satisfies Record<FrameShape, FrameLook>;

const LAPTOP_BASE_HEIGHT = 10;
const LAPTOP_BASE_OVERHANG = 21;
const LAPTOP_BASE_RADIUS = 12;
const LAPTOP_NOTCH = { width: 64, height: 4, radius: 6 };

interface Corners {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const roundNumber = (number: number) => Math.round(number * 100) / 100;

const createRoundedPath = (box: Box, corners: Corners) => {
  const { left, top, width, height } = box;
  const { topLeft, topRight, bottomRight, bottomLeft } = corners;
  const right = left + width;
  const bottom = top + height;
  const steps = [
    `M${left + topLeft} ${top}`,
    `H${right - topRight}`,
    `A${topRight} ${topRight} 0 0 1 ${right} ${top + topRight}`,
    `V${bottom - bottomRight}`,
    `A${bottomRight} ${bottomRight} 0 0 1 ${right - bottomRight} ${bottom}`,
    `H${left + bottomLeft}`,
    `A${bottomLeft} ${bottomLeft} 0 0 1 ${left} ${bottom - bottomLeft}`,
    `V${top + topLeft}`,
    `A${topLeft} ${topLeft} 0 0 1 ${left + topLeft} ${top}`,
    "Z",
  ];
  return steps.join("");
};

const createSameCorners = (radius: number): Corners => ({
  topLeft: radius,
  topRight: radius,
  bottomRight: radius,
  bottomLeft: radius,
});

const createPill = (box: Box, paint: FramePaint): FramePart => {
  const radius = Math.min(box.width, box.height) / 2;
  return { path: createRoundedPath(box, createSameCorners(radius)), paint };
};

const createCenteredPill = (
  frameWidth: number,
  top: number,
  size: { width: number; height: number },
  paint: FramePaint,
) => {
  const left = (frameWidth - size.width) / 2;
  return createPill({ left, top, ...size }, paint);
};

interface ShapeParts {
  frameWidth: number;
  frameHeight: number;
  scale: number;
}

const listShapeParts = (
  frameShape: FrameShape,
  shape: ShapeParts,
): FramePart[] => {
  const { frameWidth, frameHeight, scale } = shape;
  const sized = (size: number) => roundNumber(size * scale);

  switch (frameShape) {
    case "dynamic-island":
      return [
        createCenteredPill(
          frameWidth,
          sized(9),
          { width: sized(45), height: sized(13) },
          "solid-frame",
        ),
        createCenteredPill(
          frameWidth,
          frameHeight - sized(8) - sized(2),
          { width: sized(48), height: sized(2) },
          "solid-frame",
        ),
      ];
    case "punch-hole":
      return [
        createCenteredPill(
          frameWidth,
          sized(12),
          { width: sized(8), height: sized(8) },
          "solid-frame",
        ),
        createCenteredPill(
          frameWidth,
          frameHeight - sized(9) - sized(2),
          { width: sized(44), height: sized(2) },
          "solid-frame",
        ),
      ];
    case "home-button":
      return [
        createCenteredPill(
          frameWidth,
          sized(13),
          { width: sized(30), height: sized(3) },
          "solid-detail",
        ),
        createCenteredPill(
          frameWidth,
          frameHeight - sized(6) - sized(18),
          { width: sized(18), height: sized(18) },
          "outline-detail",
        ),
      ];
    case "tablet":
      return [
        createCenteredPill(
          frameWidth,
          sized(3.5),
          { width: sized(3), height: sized(3) },
          "solid-detail",
        ),
      ];
    case "laptop": {
      const notchBox = {
        left: (frameWidth - sized(LAPTOP_NOTCH.width)) / 2,
        top: frameHeight - sized(LAPTOP_BASE_HEIGHT),
        width: sized(LAPTOP_NOTCH.width),
        height: sized(LAPTOP_NOTCH.height),
      };
      const notchCorners = {
        ...createSameCorners(0),
        bottomLeft: sized(LAPTOP_NOTCH.radius),
        bottomRight: sized(LAPTOP_NOTCH.radius),
      };
      return [
        {
          path: createRoundedPath(notchBox, notchCorners),
          paint: "solid-detail",
        },
      ];
    }
    case "kiosk":
      return [];
  }
};

export const pickFrameLayout = (frameSize: FrameSize): FrameLayout => {
  const { frameShape, viewportWidth, viewportHeight, screenWidth } = frameSize;
  const look = FRAME_LOOKS[frameShape];
  const isLaptop = frameShape === "laptop";
  const screenScale = screenWidth / viewportWidth;
  const scale = screenScale / REFERENCE_SCALE;
  const sized = (size: number) => roundNumber(size * scale);

  const screenHeight = roundNumber(viewportHeight * screenScale);
  const bezelSide = sized(look.bezelSide);
  const bezelTop = sized(look.bezelTop);
  const bezelBottom = sized(look.bezelBottom);
  const lidWidth = screenWidth + bezelSide * 2;
  const lidHeight = bezelTop + screenHeight + bezelBottom;
  const baseOverhang = isLaptop ? sized(LAPTOP_BASE_OVERHANG) : 0;
  const baseHeight = isLaptop ? sized(LAPTOP_BASE_HEIGHT) : 0;
  const width = lidWidth + baseOverhang * 2;
  const height = lidHeight + baseHeight;
  const screenLeft = baseOverhang + bezelSide;
  const radius = sized(look.radius);
  const screenRadius = sized(look.screenRadius);
  const lidBottomRadius = isLaptop ? 0 : radius;
  const screenBottomRadius = isLaptop ? 0 : screenRadius;

  const lidBox = {
    left: baseOverhang,
    top: 0,
    width: lidWidth,
    height: lidHeight,
  };
  const lidCorners = {
    ...createSameCorners(radius),
    bottomLeft: lidBottomRadius,
    bottomRight: lidBottomRadius,
  };
  const screenBox = {
    left: screenLeft,
    top: bezelTop,
    width: screenWidth,
    height: screenHeight,
  };
  const screenCorners = {
    ...createSameCorners(screenRadius),
    bottomLeft: screenBottomRadius,
    bottomRight: screenBottomRadius,
  };
  const lidPath = `${createRoundedPath(lidBox, lidCorners)}${createRoundedPath(screenBox, screenCorners)}`;
  const lidPart: FramePart = { path: lidPath, paint: "solid-frame" };

  const baseBox = { left: 0, top: lidHeight, width, height: baseHeight };
  const baseCorners = {
    ...createSameCorners(0),
    bottomLeft: sized(LAPTOP_BASE_RADIUS),
    bottomRight: sized(LAPTOP_BASE_RADIUS),
  };
  const baseParts: FramePart[] = isLaptop
    ? [{ path: createRoundedPath(baseBox, baseCorners), paint: "solid-frame" }]
    : [];
  const shapeParts = listShapeParts(frameShape, {
    frameWidth: width,
    frameHeight: height,
    scale,
  });

  return {
    width: roundNumber(width),
    height: roundNumber(height),
    screenLeft: roundNumber(screenLeft),
    screenTop: bezelTop,
    screenWidth,
    screenHeight,
    screenCornerRadius: `${screenRadius}px ${screenRadius}px ${screenBottomRadius}px ${screenBottomRadius}px`,
    parts: [lidPart, ...baseParts, ...shapeParts],
  };
};
