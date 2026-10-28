import type { ReactElement, ReactNode } from "react";

interface FormFieldProps {
  fieldId: string;
  label: string;
  children: ReactNode;
}

export const FormField = ({
  fieldId,
  label,
  children,
}: FormFieldProps): ReactElement => (
  <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs text-ink-2">
    <label htmlFor={fieldId}>{label}</label>
    {children}
  </div>
);
