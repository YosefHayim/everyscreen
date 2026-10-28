import { useSyncExternalStore } from "react";
import {
  changeSearchQuery,
  getSearchQuery,
  subscribeToSearchQuery,
} from "@/dashboard/grid/device-search-store";

interface DeviceSearch {
  searchQuery: string;
  changeSearchQuery: (searchQuery: string) => void;
}

export const useDeviceSearch = (): DeviceSearch => {
  const searchQuery = useSyncExternalStore(
    subscribeToSearchQuery,
    getSearchQuery,
  );

  return { searchQuery, changeSearchQuery };
};
