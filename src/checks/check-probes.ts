import type { Page } from "playwright";

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
  tapTargets: { selector: string; width: number; height: number }[];
}

const TAP_TAGS = "a[href], button, input, [role=button]";

// Runs inside the page (page.evaluate): it can use nothing outside itself.
const readMeasurements = (tapTags: string): PageMeasurements => {
  const SELECTOR_DEPTH = 3;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const describeNode = (element: Element) => {
    const tagName = element.tagName.toLowerCase();
    const firstClass = element.classList[0] ?? null;
    const isUnclassed = firstClass === null;
    const classPart = isUnclassed ? "" : `.${CSS.escape(firstClass)}`;
    const siblings = [...(element.parentElement?.children ?? [])];
    const sameTagSiblings = siblings.filter(
      (sibling) => sibling.tagName === element.tagName,
    );
    const position = sameTagSiblings.indexOf(element) + 1;
    return `${tagName}${classPart}:nth-of-type(${position})`;
  };
  const describeElement = (element: Element) => {
    const path: string[] = [];
    let node: Element | null = element;
    while (node !== null && node !== document.body) {
      const isPathFull = path.length >= SELECTOR_DEPTH;
      if (isPathFull) break;
      path.unshift(describeNode(node));
      node = node.parentElement;
    }
    return path.join(" > ");
  };
  const isInsideScroller = (element: Element) => {
    let ancestor = element.parentElement;
    while (ancestor !== null) {
      const { overflowX } = getComputedStyle(ancestor);
      const isScroller = overflowX === "auto" || overflowX === "scroll";
      if (isScroller) return true;
      ancestor = ancestor.parentElement;
    }
    return false;
  };
  const hasOwnText = (element: Element) =>
    [...element.childNodes].some((childNode) => {
      const isTextNode = childNode.nodeType === Node.TEXT_NODE;
      const hasLetters = (childNode.textContent ?? "").trim().length > 0;
      return isTextNode && hasLetters;
    });

  const everyElement = [...document.querySelectorAll("body *")];
  const measured = everyElement.map((element) => ({
    selector: describeElement(element),
    style: getComputedStyle(element),
    box: element.getBoundingClientRect(),
    element,
  }));

  const pastEdge = measured
    .filter(({ element }) => !isInsideScroller(element))
    .map(({ selector, box }) => ({
      selector,
      overflowPx: Math.round(box.right - viewportWidth),
    }))
    .filter((pastEdgeBox) => pastEdgeBox.overflowPx > 0)
    .sort((first, second) => second.overflowPx - first.overflowPx);

  const clippedSelectors = measured
    .filter(({ style, element }) => {
      const hidesOverflow =
        style.overflowX === "hidden" || style.textOverflow === "ellipsis";
      const isWiderThanBox = element.scrollWidth > element.clientWidth;
      return hidesOverflow && isWiderThanBox && hasOwnText(element);
    })
    .map((clippedBox) => clippedBox.selector);

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
    .filter(({ element, style, box }) => {
      const isHidden =
        style.display === "none" || style.visibility === "hidden";
      const hasNoSize = box.width === 0 || box.height === 0;
      const parentLength = element.parentElement?.textContent?.length ?? 0;
      const ownLength = element.textContent?.length ?? 0;
      const isInlineLink =
        element.tagName === "A" &&
        style.display === "inline" &&
        parentLength > ownLength;
      const isTapTarget = element.matches(tapTags);
      return isTapTarget && !isHidden && !hasNoSize && !isInlineLink;
    })
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
    tapTargets,
  };
};

export const measurePage = (page: Page): Promise<PageMeasurements> =>
  page.evaluate(readMeasurements, TAP_TAGS);
