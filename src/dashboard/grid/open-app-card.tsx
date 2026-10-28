import { type FormEvent, type ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";
import { CommandLine } from "@/dashboard/grid/command-line";
import { useOpenApp } from "@/dashboard/grid/use-open-app";
import { Button } from "@/dashboard/ui/button";
import { Icon } from "@/dashboard/ui/icon";
import { HUB_URL } from "@/environment";

const DEFAULT_APP_URL = "http://localhost:5173";
const SKILL_INSTALL_COMMAND = "npx everyscreen skill install";

export const OpenAppCard = (): ReactElement => {
  const { t } = useTranslation();
  const openApp = useOpenApp();
  const [appUrl, setAppUrl] = useState(DEFAULT_APP_URL);
  const openCommand = `everyscreen open --url ${appUrl}`;
  const hasOpenFailed = openApp.isError;

  const openTypedUrl = (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    openApp.mutate(appUrl);
  };

  return (
    <section
      aria-label={t("grid.empty.title")}
      className="flex w-full max-w-160 flex-col gap-4 rounded-[20px] border border-line bg-card px-4 py-5 md:px-8 md:py-6 shadow-lift"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 text-[28px] leading-[34px] font-medium tracking-[-0.025em]">
          {t("grid.empty.title")}
        </h1>
        <p className="m-0 text-sm leading-5 text-ink-2">
          {t("grid.empty.hubRunning", { hubUrl: HUB_URL })}
        </p>
      </div>
      <form onSubmit={openTypedUrl} className="flex flex-col gap-2 md:flex-row">
        <label className="flex h-12 min-w-0 items-center md:flex-1 gap-2.5 rounded-xl border border-line bg-soft px-3.5 text-ink-2">
          <Icon name="open-url" size={18} />
          <input
            name="url"
            type="url"
            required
            value={appUrl}
            onChange={(changeEvent) => setAppUrl(changeEvent.target.value)}
            aria-label={t("grid.empty.urlLabel")}
            className="min-w-0 flex-1 border-0 bg-transparent font-mono text-sm text-ink outline-offset-4"
          />
        </label>
        <Button
          type="submit"
          icon="open-url"
          variant="dark"
          size="large"
          disabled={openApp.isPending}
        >
          {t("grid.empty.open")}
        </Button>
      </form>
      {hasOpenFailed && (
        <p role="alert" className="m-0 text-[13px] text-failed">
          {t("grid.empty.openFailed")}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <p className="m-0 text-[13px] text-ink-2">
          {t("grid.empty.terminalHint")}
        </p>
        <CommandLine
          command={openCommand}
          copyLabel={t("grid.empty.copyOpenCommand")}
        />
      </div>
      <hr className="m-0 h-px border-0 bg-line" />
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg leading-[25px] font-semibold">
          {t("grid.empty.agentTitle")}
        </h2>
        <CommandLine
          command={SKILL_INSTALL_COMMAND}
          copyLabel={t("grid.empty.copySkillCommand")}
        />
        <p className="m-0 text-[13.5px] leading-5 text-ink-2">
          {t("grid.empty.agentHint")}
        </p>
      </div>
    </section>
  );
};
