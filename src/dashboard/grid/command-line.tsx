import { useTranslation } from "react-i18next";
import { useCopyText } from "@/dashboard/grid/use-copy-text";
import { Button } from "@/dashboard/ui/button";

interface CommandLineProps {
  command: string;
  copyLabel: string;
}

export const CommandLine = ({ command, copyLabel }: CommandLineProps) => {
  const { t } = useTranslation();
  const { copyStatus, copyText } = useCopyText(command);

  return (
    <div className="flex items-center justify-between gap-3 rounded-full bg-ink py-1 pr-1 pl-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]">
      <span className="min-w-0 overflow-x-auto font-mono text-[13px] whitespace-nowrap text-card">
        <span className="text-muted">$ </span>
        {command}
      </span>
      <Button
        icon="copy"
        variant="accent"
        aria-label={copyLabel}
        onClick={copyText}
        className="h-11 rounded-full px-4 text-sm"
      >
        {t(`grid.copy.${copyStatus}`)}
      </Button>
    </div>
  );
};
