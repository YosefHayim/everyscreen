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
