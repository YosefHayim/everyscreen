import { cva } from "class-variance-authority";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { INSTALL_COMMAND } from "@/site/site-links";
import { SiteIcon } from "./site-icon";
import { useCopyCommand } from "./use-copy-command";

const commandPillVariants = cva(
  "inline-flex h-14 items-center gap-3.5 rounded-full py-0 pr-1.5 pl-[22px]",
  {
    variants: {
      tone: {
        dark: "bg-ink text-card shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]",
        light: "bg-card text-ink",
      },
    },
  },
);

const promptVariants = cva("", {
  variants: { tone: { dark: "text-muted", light: "text-ink-3" } },
});

interface CommandPillProps {
  tone: "dark" | "light";
}

export const CommandPill = ({ tone }: CommandPillProps): ReactElement => {
  const { t } = useTranslation();
  const { copyStatus, copyCommand } = useCopyCommand(INSTALL_COMMAND);
  const isCopied = copyStatus === "copied";
  const copyLabelKey = isCopied ? "command.copied" : "command.copy";

  return (
    <div className={commandPillVariants({ tone })}>
      <span className="whitespace-nowrap font-mono text-[13px] md:text-[15px]">
        <span className={promptVariants({ tone })}>$ </span>
        {INSTALL_COMMAND}
      </span>
      <button
        type="button"
        aria-label={t("command.copyLabel")}
        onClick={copyCommand}
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-0 bg-pink px-4 text-sm font-semibold text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)] transition-translate duration-200 hover:-translate-y-0.5"
      >
        <SiteIcon name="copy" />
        {t(copyLabelKey)}
      </button>
    </div>
  );
};
