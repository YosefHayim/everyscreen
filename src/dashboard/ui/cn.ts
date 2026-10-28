import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...classNames: ClassValue[]) => {
  const joinedClassNames = clsx(classNames);
  return twMerge(joinedClassNames);
};
