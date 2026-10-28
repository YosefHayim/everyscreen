import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageSection } from "@/site/page-section";
import { SectionHeading } from "@/site/section-heading";
import { CodeBlock } from "@/site/ui/code-block";
import { SiteIcon } from "@/site/ui/site-icon";
import { FailureShot } from "./failure-shot";

const PASSED_DEVICE_IDS = ["iphone-15", "pixel-8", "ipad-mini", "laptop-1440"];
const FAILED_LINE_NUMBER = 4;
const TEST_CODE_LINES = [
  'test("adds the linen shirt to the cart", async ({ page }) => {',
  '  await page.goto("/shop/linen-shirt");',
  '  await page.getByRole("button", { name: "M" }).click();',
  '  await page.getByRole("button", { name: "Add to cart" }).click();',
  '  await expect(page.getByText("1 item in your cart")).toBeVisible();',
  "});",
];

export const ProofSection = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <PageSection className="flex flex-col gap-10">
      <SectionHeading
        alignment="centered"
        title={t("proof.title")}
        subtitle={t("proof.subtitle")}
      />
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-5">
          <span className="grid size-9 flex-none place-items-center rounded-full bg-failed-soft text-failed">
            <SiteIcon name="close" size={16} strokeWidth={2.4} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="m-0 text-[15px] font-medium">{t("proof.testName")}</p>
            <p className="m-0 font-mono text-xs text-ink-3">
              {t("proof.testFile")}
            </p>
          </div>
          <span className="rounded-full bg-failed-soft px-3 py-1 text-[13px] text-failed">
            {t("proof.failedOn")}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-soft px-3 py-1 font-mono text-xs text-ink-2">
            <SiteIcon name="clock" size={12} />
            {t("proof.stepTime")}
          </span>
        </div>
        <div className="grid md:grid-cols-[auto_1fr]">
          <div className="grid place-items-center bg-paper p-6 md:px-14">
            <FailureShot />
          </div>
          <div className="flex min-w-0 flex-col gap-4 p-5">
            <div className="scroll-sideways rounded-lg bg-[#0f1220]">
              <div className="flex justify-between border-b border-code-rule px-4 py-2.5 font-mono text-xs text-code-muted">
                <span>{t("proof.testFile")}</span>
                <span className="text-code-line-number">
                  {t("proof.codeLine")}
                </span>
              </div>
              <CodeBlock
                isNumbered
                className="px-4 py-3"
                codeLines={TEST_CODE_LINES}
                failedLineNumber={FAILED_LINE_NUMBER}
              />
            </div>
            <div className="rounded-lg bg-failed-soft p-4 font-mono text-xs leading-5 text-failed">
              <p className="m-0">{t("proof.errorTitle")}</p>
              <p className="m-0 break-words">{t("proof.errorWaiting")}</p>
              <p className="m-0 break-words">{t("proof.errorIntercept")}</p>
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-2">
              <p className="m-0 me-1 text-[13px] text-ink-2">
                {t("proof.elsewhere")}
              </p>
              {PASSED_DEVICE_IDS.map((deviceId) => (
                <span
                  key={deviceId}
                  className="flex items-center gap-1.5 rounded-full bg-ok-soft px-3 py-1 text-[13px] text-ok"
                >
                  <SiteIcon name="tick" size={13} strokeWidth={2.4} />
                  {t(`proof.passedOn.${deviceId}`)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageSection>
  );
};
