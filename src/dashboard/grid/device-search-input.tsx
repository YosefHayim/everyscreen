import { type ReactElement, useRef } from "react";
import { useTranslation } from "react-i18next";
import { pickShortcutHintKey } from "@/dashboard/grid/device-search-logic";
import { useDeviceSearch } from "@/dashboard/grid/use-device-search";
import { useSearchShortcut } from "@/dashboard/grid/use-search-shortcut";
import { Icon } from "@/dashboard/ui/icon";

export const DeviceSearchInput = (): ReactElement => {
  const { t } = useTranslation();
  const { searchQuery, changeSearchQuery } = useDeviceSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);
  useSearchShortcut(searchInputRef);
  const shortcutHintKey = pickShortcutHintKey(navigator.userAgent);
  const isSearchEmpty = searchQuery === "";

  return (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-soft px-3 text-ink-2 md:h-9 md:w-56 md:flex-none">
      <Icon name="search" size={16} />
      <input
        ref={searchInputRef}
        type="search"
        value={searchQuery}
        onChange={(changeEvent) => changeSearchQuery(changeEvent.target.value)}
        placeholder={t("shell.searchPlaceholder")}
        aria-label={t("shell.searchLabel")}
        className="min-w-0 flex-1 border-0 bg-transparent text-xs text-ink outline-offset-4"
      />
      {isSearchEmpty && (
        <kbd className="hidden flex-none rounded border border-line bg-card px-1.5 font-mono text-[10px] text-ink-2 md:inline">
          {t(shortcutHintKey)}
        </kbd>
      )}
    </label>
  );
};
