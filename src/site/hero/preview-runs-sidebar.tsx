import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { type PreviewRun, PreviewRunLine } from "./preview-run-line";

const FINISHED_RUNS: PreviewRun[] = [
  { id: "checkout", status: "running", railIndex: null },
  { id: "signup", status: "passed", railIndex: 0 },
  { id: "cart", status: "failed", railIndex: 1 },
  { id: "search", status: "passed", railIndex: 2 },
];

const QUEUED_RUNS: PreviewRun[] = [
  { id: "settings", status: "waiting", railIndex: null },
  { id: "profile", status: "waiting", railIndex: null },
];

const HEADING_CLASS_NAME =
  "m-0 mx-2 font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase";

export const PreviewRunsSidebar = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <aside className="hidden w-58 flex-none flex-col gap-1 border-r border-line-soft px-3 py-[18px] md:flex">
      <p className={`${HEADING_CLASS_NAME} mb-2`}>{t("preview.runsHeading")}</p>
      {FINISHED_RUNS.map((run) => (
        <PreviewRunLine key={run.id} run={run} />
      ))}
      <p className={`${HEADING_CLASS_NAME} mt-4 mb-2`}>
        {t("preview.queueHeading")}
      </p>
      {QUEUED_RUNS.map((run) => (
        <PreviewRunLine key={run.id} run={run} />
      ))}
    </aside>
  );
};
