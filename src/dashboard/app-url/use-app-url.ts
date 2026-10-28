import { useSyncExternalStore } from "react";
import {
  changeAppUrl,
  getAppUrl,
  subscribeToAppUrl,
} from "@/dashboard/app-url/app-url-store";

interface AppUrl {
  appUrl: string;
  changeAppUrl: (appUrl: string) => void;
}

export const useAppUrl = (): AppUrl => {
  const appUrl = useSyncExternalStore(subscribeToAppUrl, getAppUrl);

  return { appUrl, changeAppUrl };
};
