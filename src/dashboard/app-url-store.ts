let appUrl: string | null = null;

const listeners = new Set<() => void>();

export const subscribeToAppUrl = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getAppUrl = (): string | null => appUrl;

export const saveAppUrl = (openedUrl: string): void => {
  appUrl = openedUrl;
  for (const listener of listeners) listener();
};
