import {
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useOpenAppUrl } from "@/dashboard/app-url/use-open-app-url";
import { useOpenApp } from "@/dashboard/grid/use-open-app";
import { Icon } from "@/dashboard/ui/icon";

export const AppUrlBar = (): ReactElement => {
  const { t } = useTranslation();
  const openApp = useOpenApp();
  const openAppUrl = useOpenAppUrl();
  // Null until the user types, so the bar shows the url the devices have open.
  const [typedUrl, setTypedUrl] = useState<string | null>(null);
  const shownAppUrl = typedUrl ?? openAppUrl;

  const openTypedUrl = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const isThereNoUrlToOpen = shownAppUrl === null;
    if (isThereNoUrlToOpen) return;

    openApp.mutate(shownAppUrl, { onSuccess: () => setTypedUrl(null) });
  };

  const handleUrlChange = (changeEvent: ChangeEvent<HTMLInputElement>) => {
    setTypedUrl(changeEvent.target.value);
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
          value={shownAppUrl ?? ""}
          onChange={handleUrlChange}
          placeholder={t("shell.urlPlaceholder")}
          aria-label={t("shell.urlLabel")}
          aria-invalid={openApp.isError}
          className="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs text-ink outline-offset-4"
        />
      </label>
    </form>
  );
};
