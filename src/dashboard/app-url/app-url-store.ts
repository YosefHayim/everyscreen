import { DEFAULT_APP_URL } from "@/dashboard/grid/use-open-app";

let currentAppUrl = DEFAULT_APP_URL;
const listeners = new Set<() => void>();

export const getAppUrl = (): string => currentAppUrl;

export const subscribeToAppUrl = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const changeAppUrl = (appUrl: string): void => {
  currentAppUrl = appUrl;
  for (const listener of listeners) listener();
};
