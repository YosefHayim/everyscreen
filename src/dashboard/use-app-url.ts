import { useSyncExternalStore } from "react";
import { getAppUrl, subscribeToAppUrl } from "@/dashboard/app-url-store";

export const useAppUrl = (): string | null =>
  useSyncExternalStore(subscribeToAppUrl, getAppUrl);
