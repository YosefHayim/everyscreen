import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "@/dashboard/ui/cn";
import { Icon } from "@/dashboard/ui/icon";
import type { IconName } from "@/dashboard/ui/icon-paths";

const BUTTON_ICON_SIZE = 18;

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 font-medium transition-[translate,background-color] duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
  {
    variants: {
      variant: {
        dark: "bg-ink text-card shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]",
        accent:
          "bg-pink text-ink font-semibold shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)]",
      },
      size: {
        large: "h-12 rounded-full px-6 text-[15px]",
      },
    },
    defaultVariants: { size: "large" },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon: IconName;
}

export const Button = ({
  icon,
  variant,
  size,
  className,
  children,
  ...buttonAttributes
}: ButtonProps): ReactElement => {
  const variantClassName = buttonVariants({ variant, size });

  return (
    <button
      type="button"
      className={cn(variantClassName, className)}
      {...buttonAttributes}
    >
      <Icon name={icon} size={BUTTON_ICON_SIZE} />
      {children}
    </button>
  );
};
