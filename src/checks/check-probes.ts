import type { Page } from "playwright";
import type { DeviceViewport } from "@/devices/devices-logic";

interface PinnedBox {
  selector: string;
  top: number;
  bottom: number;
  paddingTop: number;
  paddingBottom: number;
  cssSafeAreaSides: { top: boolean; bottom: boolean };
}

export interface PageMeasurements {
  viewportWidth: number;
  viewportHeight: number;
  widestPastEdge: { selector: string; overflowPx: number } | null;
  clippedSelectors: string[];
  pinnedBoxes: PinnedBox[];
  tapTargets: { selector: string; width: number; height: number }[];
  isViewportCover: boolean;
}

interface MeasureRequest {
  tapTags: string;
  deviceViewport: DeviceViewport;
}

const TAP_TAGS = "a[href], button, input, [role=button]";

// Runs inside the page (page.evaluate): it can use nothing outside itself.
const readMeasurements = (measureRequest: MeasureRequest): PageMeasurements => {
  const SELECTOR_DEPTH = 3;
  // Mobile emulation widens window.innerWidth to fit the content, so the device size comes from the caller.
  const { tapTags, deviceViewport } = measureRequest;
  const { width: viewportWidth, height: viewportHeight } = deviceViewport;

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

  const readSheetRules = (sheet: CSSStyleSheet): CSSRule[] => {
    try {
      return [...sheet.cssRules];
    } catch (error) {
      // A cross-origin sheet hides its rules from the page, so it is skipped.
      const isCrossOriginSheet =
        error instanceof DOMException && error.name === "SecurityError";
      if (isCrossOriginSheet) return [];
      throw error;
    }
  };
  const listStyleRules = (rules: CSSRule[]): CSSStyleRule[] =>
    rules.flatMap((rule) => {
      const isStyleRule = rule instanceof CSSStyleRule;
      if (isStyleRule) return [rule];
      const isGroupRule = rule instanceof CSSGroupingRule;
      return isGroupRule ? listStyleRules([...rule.cssRules]) : [];
    });
  const isRuleMatching = (rule: CSSStyleRule, element: Element) => {
    try {
      return element.matches(rule.selectorText);
    } catch (error) {
      // A selector this browser cannot parse matches nothing.
      const isUnparseableSelector =
        error instanceof DOMException && error.name === "SyntaxError";
      if (isUnparseableSelector) return false;
      throw error;
    }
  };
  const styleRules = listStyleRules(
    [...document.styleSheets].flatMap(readSheetRules),
  );
  const listOwnDeclarations = (element: Element) => {
    const inlineStyle = element.getAttribute("style");
    const hasInlineStyle = inlineStyle !== null;
    const ruleDeclarations = styleRules
      .filter((rule) => isRuleMatching(rule, element))
      .map((rule) => rule.style.cssText);
    return hasInlineStyle
      ? [inlineStyle, ...ruleDeclarations]
      : ruleDeclarations;
  };
  const isTiedToSafeArea = (element: Element, side: "top" | "bottom") =>
    listOwnDeclarations(element).some((declarations) =>
      declarations.includes(`safe-area-inset-${side}`),
    );

  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const viewportContent = viewportMeta?.getAttribute("content") ?? null;
  const hasViewportContent = viewportContent !== null;
  const isViewportCover =
    hasViewportContent && /viewport-fit\s*=\s*cover/i.test(viewportContent);

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
    .map(({ selector, box, style, element }) => ({
      selector,
      top: box.top,
      bottom: box.bottom,
      paddingTop: Number.parseFloat(style.paddingTop),
      paddingBottom: Number.parseFloat(style.paddingBottom),
      cssSafeAreaSides: {
        top: isTiedToSafeArea(element, "top"),
        bottom: isTiedToSafeArea(element, "bottom"),
      },
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
    isViewportCover,
  };
};

export const measurePage = (
  page: Page,
  deviceViewport: DeviceViewport,
): Promise<PageMeasurements> =>
  page.evaluate(readMeasurements, { tapTags: TAP_TAGS, deviceViewport });
