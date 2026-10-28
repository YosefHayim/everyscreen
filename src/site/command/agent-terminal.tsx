import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/dashboard/ui/cn";
import { SiteIcon } from "@/site/ui/site-icon";

const LINE_DELAY_MS = 260;

type AnswerStatus = "ok" | "warn";

interface DeviceAnswer {
  deviceId: string;
  status: AnswerStatus;
}

const DEVICE_ANSWERS: DeviceAnswer[] = [
  { deviceId: "iphone-15", status: "ok" },
  { deviceId: "iphone-se", status: "warn" },
  { deviceId: "pixel-8", status: "ok" },
  { deviceId: "ipad-mini", status: "ok" },
  { deviceId: "macbook-air-13", status: "ok" },
];

export const AgentTerminal = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-xl bg-card text-ink shadow-lift">
      <div className="flex items-center gap-2 border-b border-line-soft px-4 py-3 text-ink-3">
        <SiteIcon name="terminal" size={16} />
        <span className="font-mono text-xs">
          {t("command-section.windowTitle")}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-4 font-mono text-[12.5px] leading-[21px]">
        <p className="m-0 mb-1.5 px-2">
          <span className="text-ink-3">$ </span>
          {t("command-section.command")}
        </p>
        {DEVICE_ANSWERS.map((answer, index) => {
          const isWarning = answer.status === "warn";
          const statusClassName = isWarning ? "text-warn" : "text-ok";
          const lineDelay = { animationDelay: `${index * LINE_DELAY_MS}ms` };
          return (
            <div
              key={answer.deviceId}
              className={cn(
                "loop-line grid grid-cols-[1fr_auto_auto] gap-x-3 rounded-md px-2 md:grid-cols-[104px_48px_1fr_auto]",
                isWarning && "bg-warn-soft",
              )}
              style={lineDelay}
            >
              <span>{answer.deviceId}</span>
              <span className={statusClassName}>
                {t(`command-section.answers.${answer.deviceId}.status`)}
              </span>
              <span className="order-last col-span-3 min-w-0 break-words text-ink-2 md:order-none md:col-span-1 md:text-ink">
                {t(`command-section.answers.${answer.deviceId}.line`)}
              </span>
              <span className="text-ink-3">
                {t(`command-section.answers.${answer.deviceId}.time`)}
              </span>
            </div>
          );
        })}
        <p className="m-0 mx-2 mt-2 border-t border-dashed border-line pt-3 text-ink-2">
          {t("command-section.summary")}
        </p>
      </div>
    </div>
  );
};
