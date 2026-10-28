import type { FormEvent, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useAppUrl } from "@/dashboard/app-url/use-app-url";
import { useOpenApp } from "@/dashboard/grid/use-open-app";
import { Icon } from "@/dashboard/ui/icon";

export const AppUrlBar = (): ReactElement => {
  const { t } = useTranslation();
  const openApp = useOpenApp();
  const { appUrl, changeAppUrl } = useAppUrl();

  const openTypedUrl = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    openApp.mutate(appUrl);
  };

  return (
    <form
      onSubmit={openTypedUrl}
      className="order-last w-full md:order-none md:w-auto md:max-w-96 md:min-w-56 md:flex-1"
    >
      <label className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-line bg-soft px-3 text-ink-2 md:h-9">
        <Icon name="open-url" size={16} />
        <input
          name="url"
          type="url"
          required
          value={appUrl}
          onChange={(changeEvent) => changeAppUrl(changeEvent.target.value)}
          aria-label={t("shell.urlLabel")}
          aria-invalid={openApp.isError}
          className="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs text-ink outline-offset-4"
        />
      </label>
    </form>
  );
};
