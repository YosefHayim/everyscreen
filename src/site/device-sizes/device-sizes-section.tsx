import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageSection } from "@/site/page-section";
import { SectionHeading } from "@/site/section-heading";
import { CodeBlock } from "@/site/ui/code-block";
import { AddDeviceForm } from "./add-device-form";
import { SizeRow } from "./size-row";

const CLI_CODE_LINES = [
  '$ everyscreen device add --name "Store kiosk" \\',
  "    --width 1080 --height 1920 --touch",
  "added store-kiosk · 6 devices in the grid",
];
const YAML_CODE_LINES = [
  "# everyscreen.yaml",
  "devices:",
  "  - name: Store kiosk",
  "    width: 1080",
  "    height: 1920",
  "    hasTouch: true",
];

export const DeviceSizesSection = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <PageSection className="flex flex-col gap-12">
      <SectionHeading
        alignment="left"
        title={t("device-sizes.title")}
        subtitle={t("device-sizes.subtitle")}
      />
      <SizeRow />
      <div className="grid items-stretch gap-4 md:grid-cols-2">
        <AddDeviceForm />
        <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-card p-6">
          <h3 className="m-0 text-lg font-medium">
            {t("device-sizes.agent.title")}
          </h3>
          <p className="m-0 text-sm leading-[21px] text-ink-2">
            {t("device-sizes.agent.subtitle")}
          </p>
          <div className="scroll-sideways rounded-lg bg-[#0f1220] p-4">
            <CodeBlock codeLines={CLI_CODE_LINES} />
          </div>
          <div className="scroll-sideways rounded-lg bg-[#0f1220] p-4">
            <CodeBlock codeLines={YAML_CODE_LINES} />
          </div>
        </div>
      </div>
    </PageSection>
  );
};
