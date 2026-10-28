import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PageSection } from "@/site/page-section";
import { SectionHeading } from "@/site/section-heading";
import { CheckRow, type CheckRowEntry } from "./check-row";
import { ShopPreview } from "./shop-preview";

const CHECK_ROWS: CheckRowEntry[] = [
  { id: "edge", icon: "screen-edge" },
  { id: "clipped", icon: "text-lines" },
  { id: "notch", icon: "phone" },
  { id: "tap", icon: "tap-target" },
  { id: "console", icon: "terminal" },
  { id: "request", icon: "broken-link" },
];

export const ChecksSection = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <PageSection
      id="checks"
      className="grid items-start gap-10 md:grid-cols-[1fr_1.05fr] md:gap-12"
    >
      <div className="flex flex-col gap-8">
        <SectionHeading
          title={t("checks.title")}
          subtitle={t("checks.subtitle")}
        />
        <ul className="m-0 flex list-none flex-col border-t border-line p-0">
          {CHECK_ROWS.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </ul>
      </div>
      <ShopPreview />
    </PageSection>
  );
};
