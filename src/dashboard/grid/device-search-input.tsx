import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceSearch } from "@/dashboard/grid/use-device-search";
import { Icon } from "@/dashboard/ui/icon";

export const DeviceSearchInput = (): ReactElement => {
  const { t } = useTranslation();
  const { searchQuery, changeSearchQuery } = useDeviceSearch();

  return (
    <label className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-line bg-soft px-3 text-ink-2 md:h-9 md:w-48">
      <Icon name="search" size={16} />
      <input
        type="search"
        value={searchQuery}
        onChange={(changeEvent) => changeSearchQuery(changeEvent.target.value)}
        placeholder={t("shell.searchPlaceholder")}
        aria-label={t("shell.searchLabel")}
        className="min-w-0 flex-1 border-0 bg-transparent text-xs text-ink outline-offset-4"
      />
    </label>
  );
};
