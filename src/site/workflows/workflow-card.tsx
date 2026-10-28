import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { CodeBlock } from "@/site/ui/code-block";

export interface WorkflowCardEntry {
  id: string;
  codeLines: string[];
}

interface WorkflowCardProps {
  workflow: WorkflowCardEntry;
}

export const WorkflowCard = ({ workflow }: WorkflowCardProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <li className="grid items-center gap-5 rounded-xl border border-line bg-card p-5 md:grid-cols-[2fr_3fr] md:gap-10">
      <div className="flex flex-col gap-2 md:ps-5">
        <h3 className="m-0 text-base font-semibold">
          {t(`workflows.cards.${workflow.id}.title`)}
        </h3>
        <p className="m-0 text-sm leading-[21px] text-ink-2">
          {t(`workflows.cards.${workflow.id}.detail`)}
        </p>
      </div>
      <div className="scroll-sideways rounded-lg bg-[#0f1220] p-4">
        <CodeBlock codeLines={workflow.codeLines} />
      </div>
    </li>
  );
};
