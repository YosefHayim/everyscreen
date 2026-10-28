import { cva, type VariantProps } from "class-variance-authority";
import type { ReactElement, ReactNode } from "react";
import { SiteIcon } from "./site-icon";
import type { SiteIconName } from "./site-icon-paths";

const linkButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium no-underline transition-[translate,background-color,box-shadow] duration-200 hover:-translate-y-0.5",
  {
    variants: {
      tone: {
        dark: "bg-ink text-card shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] hover:bg-ink",
        light:
          "border border-line bg-card text-ink shadow-[inset_0_-2px_0_var(--color-paper)]",
        white: "bg-card text-ink",
        outline: "border border-card/45 text-card",
      },
      size: {
        small: "h-11 px-[18px] text-sm",
        large: "h-14 px-[22px] text-[15px]",
      },
    },
    defaultVariants: { size: "large" },
  },
);

interface LinkButtonProps extends VariantProps<typeof linkButtonVariants> {
  href: string;
  icon: SiteIconName;
  children: ReactNode;
}

export const LinkButton = ({
  href,
  icon,
  tone,
  size,
  children,
}: LinkButtonProps): ReactElement => {
  const className = linkButtonVariants({ tone, size });

  return (
    <a href={href} className={className}>
      <SiteIcon name={icon} size={17} />
      {children}
    </a>
  );
};
