let currentSearchQuery = "";
const listeners = new Set<() => void>();

export const getSearchQuery = (): string => currentSearchQuery;

export const subscribeToSearchQuery = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const changeSearchQuery = (searchQuery: string): void => {
  currentSearchQuery = searchQuery;
  for (const listener of listeners) listener();
};
