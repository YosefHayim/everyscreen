import type { InputHTMLAttributes, ReactElement } from "react";

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Toggle = (toggleAttributes: ToggleProps): ReactElement => (
  <input
    type="checkbox"
    className="relative h-6 w-10 flex-none cursor-pointer appearance-none rounded-full bg-line transition-colors duration-200 before:absolute before:start-0.5 before:top-0.5 before:size-5 before:rounded-full before:bg-card before:transition-[translate] before:duration-200 checked:bg-cobalt checked:before:translate-x-4"
    {...toggleAttributes}
  />
);
