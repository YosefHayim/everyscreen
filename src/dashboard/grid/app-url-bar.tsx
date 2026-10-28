import { type FormEvent, type ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { DEFAULT_APP_URL, useOpenApp } from "@/dashboard/grid/use-open-app";
import { Icon } from "@/dashboard/ui/icon";

export const AppUrlBar = (): ReactElement => {
  const { t } = useTranslation();
  const openApp = useOpenApp();
  const [appUrl, setAppUrl] = useState(DEFAULT_APP_URL);

  const openTypedUrl = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    openApp.mutate(appUrl);
  };

  return (
    <form onSubmit={openTypedUrl} className="min-w-0 flex-1 md:max-w-96">
      <label className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-line bg-soft px-3 text-ink-2 md:h-9">
        <Icon name="open-url" size={16} />
        <input
          name="url"
          type="url"
          required
          value={appUrl}
          onChange={(changeEvent) => setAppUrl(changeEvent.target.value)}
          aria-label={t("shell.urlLabel")}
          aria-invalid={openApp.isError}
          className="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs text-ink outline-offset-4"
        />
      </label>
    </form>
  );
};
