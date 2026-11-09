import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageSection } from "@/site/page-section";
import { SectionHeading } from "@/site/section-heading";
import { WorkflowCard, type WorkflowCardEntry } from "./workflow-card";

const WORKFLOW_CARDS: WorkflowCardEntry[] = [
  {
    id: "agent",
    codeLines: [
      "$ everyscreen open --url http://localhost:5173",
      '$ everyscreen tap --role link --name "Shop"',
      "$ everyscreen fill --role searchbox --name Search --with linen",
      "$ everyscreen check",
      "5 devices · 5 ok · report run-0412",
    ],
  },
  {
    id: "flows",
    codeLines: [
      "# flows/checkout.yaml",
      "name: Checkout with a coupon",
      "devices: [iphone-se, iphone-15, pixel-8]",
      "steps:",
      "  - open: http://localhost:5173/cart",
      "  - fill: { role: textbox, name: Coupon, with: SPRING }",
      "  - tap: { role: button, name: Apply }",
      '  - expect: { text: "Coupon applied" }',
    ],
  },
  {
    id: "suite",
    codeLines: [
      "// playwright.config.ts",
      'import { defineConfig } from "@playwright/test";',
      'import { listDevices } from "everyscreen/playwright";',
      "",
      "export default defineConfig({",
      '  projects: listDevices(["iphone-se", "pixel-8"]),',
      '  reporter: [["list"], ["everyscreen/reporter"]],',
      "});",
    ],
  },
];

export const WorkflowsSection = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <PageSection className="flex flex-col gap-12">
      <SectionHeading
        alignment="split"
        title={t("workflows.title")}
        subtitle={t("workflows.subtitle")}
      />
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {WORKFLOW_CARDS.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
      </ul>
    </PageSection>
  );
};
