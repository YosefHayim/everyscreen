import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { SiteIcon } from "@/site/ui/site-icon";
import type { SiteIconName } from "@/site/ui/site-icon-paths";

interface ToolChip {
  id: string;
  icon: SiteIconName;
}

const TOOL_CHIPS: ToolChip[] = [
  { id: "claude-code", icon: "terminal" },
  { id: "codex", icon: "code" },
  { id: "cursor", icon: "laptop" },
  { id: "playwright", icon: "shield" },
  { id: "chromium", icon: "monitor" },
  { id: "webkit", icon: "phone" },
  { id: "firefox", icon: "globe" },
  { id: "github-actions", icon: "git-branch" },
  { id: "yaml", icon: "play-window" },
];

export const ToolStrip = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-5 px-[clamp(16px,3vw,40px)] py-10">
      <p className="m-0 text-center text-sm text-ink-3">{t("tools.intro")}</p>
      <ul className="m-0 flex list-none flex-wrap justify-center gap-x-8 gap-y-4 p-0">
        {TOOL_CHIPS.map((tool) => (
          <li key={tool.id} className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg border border-line bg-card text-cobalt">
              <SiteIcon name={tool.icon} size={18} />
            </span>
            <span className="text-base font-medium text-ink-2">
              {t(`tools.${tool.id}`)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
