import { type RefObject, useEffect } from "react";
import { isSearchShortcut } from "@/dashboard/grid/device-search-logic";

export const useSearchShortcut = (
  searchInputRef: RefObject<HTMLInputElement | null>,
): void => {
  useEffect(() => {
    const focusSearchInput = (keyboardEvent: KeyboardEvent) => {
      const isShortcutPressed = isSearchShortcut(keyboardEvent);
      if (!isShortcutPressed) return;
      keyboardEvent.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", focusSearchInput);
    return () => window.removeEventListener("keydown", focusSearchInput);
  }, [searchInputRef]);
};
