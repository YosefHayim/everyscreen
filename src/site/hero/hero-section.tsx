import { Fragment, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { GITHUB_URL } from "@/site/site-links";
import { CommandPill } from "@/site/ui/command-pill";
import { LinkButton } from "@/site/ui/link-button";
import { HeroPreview } from "./hero-preview";

const WORD_DELAY_MS = 80;

export const HeroSection = (): ReactElement => {
  const { t } = useTranslation();
  const titleWords = t("hero.title").split(" ");

  return (
    <section className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 px-[clamp(16px,3vw,40px)] pt-[clamp(48px,7vw,96px)] pb-[clamp(48px,6vw,80px)]">
      <h1 className="m-0 max-w-[880px] text-center text-[clamp(38px,6.4vw,76px)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
        {titleWords.map((word, index) => {
          const wordDelay = { animationDelay: `${index * WORD_DELAY_MS}ms` };
          return (
            <Fragment key={`${word}-${index.toString()}`}>
              <span className="rise inline-block" style={wordDelay}>
                {word}
              </span>{" "}
            </Fragment>
          );
        })}
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
