import type { Page } from "@playwright/test";

interface PinnedBox {
  selector: string;
  top: number;
  bottom: number;
  paddingTop: number;
  paddingBottom: number;
}

export interface PageMeasurements {
  viewportWidth: number;
  viewportHeight: number;
  widestPastEdge: { selector: string; overflowPx: number } | null;
  clippedSelectors: string[];
  pinnedBoxes: PinnedBox[];
  safeAreaInsets: { top: number; bottom: number };
  tapTargets: { selector: string; width: number; height: number }[];
}

const TAP_TAGS = "a[href], button, input, [role=button]";

const readMeasurements = (tapTags: string): PageMeasurements => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const describeElement = (element: Element) => {
    const firstClass = element.classList[0] ?? null;
    const tagName = element.tagName.toLowerCase();
    const isUnclassed = firstClass === null;
    return isUnclassed ? tagName : `.${firstClass}`;
  };

  const insetProbe = document.createElement("div");
  insetProbe.style.cssText = `position:fixed;visibility:hidden;
    padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)`;
  document.body.append(insetProbe);
  const insetStyle = getComputedStyle(insetProbe);
  const safeAreaInsets = {
    top: Number.parseFloat(insetStyle.paddingTop),
    bottom: Number.parseFloat(insetStyle.paddingBottom),
  };
  insetProbe.remove();

  const everyElement = [...document.querySelectorAll("body *")];
  const measured = everyElement.map((element) => ({
    selector: describeElement(element),
    style: getComputedStyle(element),
    box: element.getBoundingClientRect(),
    element,
  }));

  const pastEdge = measured
    .map(({ selector, box }) => ({
      selector,
      overflowPx: Math.round(box.right - viewportWidth),
    }))
    .filter((part) => part.overflowPx > 0)
    .sort((first, second) => second.overflowPx - first.overflowPx);

  const clippedSelectors = measured
    .filter(({ style, element }) => {
      const hidesOverflow =
        style.overflowX === "hidden" || style.textOverflow === "ellipsis";
      const isWiderThanBox = element.scrollWidth > element.clientWidth;
      return hidesOverflow && isWiderThanBox;
    })
    .map((part) => part.selector);

  const pinnedBoxes = measured
    .filter(({ style }) => ["fixed", "sticky"].includes(style.position))
    .map(({ selector, box, style }) => ({
      selector,
      top: box.top,
      bottom: box.bottom,
      paddingTop: Number.parseFloat(style.paddingTop),
      paddingBottom: Number.parseFloat(style.paddingBottom),
    }));

  const tapTargets = measured
    .filter(({ element }) => element.matches(tapTags))
    .map(({ selector, box }) => ({
      selector,
      width: box.width,
      height: box.height,
    }));

  return {
    viewportWidth,
    viewportHeight,
    widestPastEdge: pastEdge[0] ?? null,
    clippedSelectors,
    pinnedBoxes,
    safeAreaInsets,
    tapTargets,
  };
};

export const measurePage = (page: Page): Promise<PageMeasurements> =>
  page.evaluate(readMeasurements, TAP_TAGS);
