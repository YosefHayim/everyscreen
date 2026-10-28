import {
  DEFAULT_GRID_VIEW,
  type GridView,
  pickGridView,
} from "@/dashboard/grid/grid-view-logic";

const GRID_VIEW_STORAGE_KEY = "everyscreen.gridView";

let currentGridView: GridView | null = null;
const listeners = new Set<() => void>();

// Browser storage can be blocked or empty, so the page works on the default view without it.
const readStoredGridView = (): GridView => {
  try {
    const storedLine = localStorage.getItem(GRID_VIEW_STORAGE_KEY);
    const isNothingStored = storedLine === null;
    if (isNothingStored) return DEFAULT_GRID_VIEW;
    const storedGridView: unknown = JSON.parse(storedLine);
    return pickGridView(storedGridView);
  } catch (error) {
    console.error({ error });
    return DEFAULT_GRID_VIEW;
  }
};

const writeStoredGridView = (gridView: GridView): void => {
  try {
    localStorage.setItem(GRID_VIEW_STORAGE_KEY, JSON.stringify(gridView));
  } catch (error) {
    console.error({ error });
  }
};

export const getGridView = (): GridView => {
  const isNotReadYet = currentGridView === null;
  if (isNotReadYet) currentGridView = readStoredGridView();
  return currentGridView ?? DEFAULT_GRID_VIEW;
};

export const subscribeToGridView = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const changeGridView = (changes: Partial<GridView>): void => {
  const changedGridView = { ...getGridView(), ...changes };
  currentGridView = changedGridView;
  writeStoredGridView(changedGridView);
  for (const listener of listeners) listener();
};
