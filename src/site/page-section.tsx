import type { ReactElement, ReactNode } from "react";
import { cn } from "@/dashboard/ui/cn";

interface PageSectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

export const PageSection = ({
  id,
  className,
  children,
}: PageSectionProps): ReactElement => (
  <section
    id={id}
    className={cn(
      "mx-auto w-full max-w-[1180px] px-[clamp(16px,3vw,40px)] py-[clamp(40px,5vw,64px)]",
      className,
    )}
  >
    {children}
  </section>
);
