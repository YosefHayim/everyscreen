import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useCommandNotices } from "@/dashboard/device-feed/use-command-notices";
import { listActivityLines } from "@/dashboard/grid/agent-activity-logic";
import { cn } from "@/dashboard/ui/cn";

export const AgentActivityPanel = (): ReactElement => {
  const { t } = useTranslation();
  const commandNotices = useCommandNotices();
  const activityLines = listActivityLines(commandNotices);
  const hasNoActivity = activityLines.length === 0;

  return (
    <aside
      aria-label={t("grid.activity.label")}
      className="flex flex-col gap-2 rounded-lg border border-line bg-card p-3"
    >
      <h2 className="m-0 text-xs font-semibold tracking-wide text-ink-2 uppercase">
        {t("grid.activity.title")}
      </h2>
      {hasNoActivity && (
        <p className="m-0 text-xs text-ink-3">{t("grid.activity.empty")}</p>
      )}
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {activityLines.map((activityLine) => (
          <li
            key={activityLine.key}
            className="flex flex-col gap-0.5 border-line border-t pt-2 first:border-t-0 first:pt-0"
          >
            <span className="flex items-center gap-2 font-mono text-[11px] text-ink-2">
              <span>{activityLine.clock}</span>
              <span className="font-semibold text-ink">
                {activityLine.commandName}
              </span>
            </span>
            <span
              className={cn(
                "text-xs leading-4 break-words",
                activityLine.isFailed && "text-failed",
                !activityLine.isFailed && "text-ink-2",
              )}
            >
              {activityLine.line}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
};
