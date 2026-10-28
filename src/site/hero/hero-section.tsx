import type { CSSProperties, ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { GITHUB_URL } from "@/site/site-links";
import { CommandPill } from "@/site/ui/command-pill";
import { LinkButton } from "@/site/ui/link-button";
import { HeroPreview } from "./hero-preview";

export const HeroSection = (): ReactElement => {
  const { t } = useTranslation();
  const titleWords = t("hero.title").split(" ");

  return (
    <section className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 px-[clamp(16px,3vw,40px)] pt-[clamp(48px,7vw,96px)] pb-[clamp(48px,6vw,80px)]">
      <h1 className="m-0 max-w-[880px] text-center text-[clamp(38px,6.4vw,76px)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
        {titleWords.map((word, index) => (
          <span
            key={`${word}-${index.toString()}`}
            className="rise inline-block pe-[0.25em]"
            style={{ "--step": index } as CSSProperties}
          >
            {word}
          </span>
        ))}
      </h1>
      <p className="m-0 max-w-[640px] text-center text-[clamp(16px,1.6vw,19px)] leading-[1.55] text-ink-2">
        {t("hero.subtitle")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <CommandPill tone="dark" />
        <LinkButton href={GITHUB_URL} icon="star" tone="light">
          {t("header.star")}
        </LinkButton>
      </div>
      <HeroPreview />
    </section>
  );
};
