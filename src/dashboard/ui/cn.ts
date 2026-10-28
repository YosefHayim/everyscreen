import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...classNames: ClassValue[]): string => {
  const joinedClassNames = clsx(classNames);
  return twMerge(joinedClassNames);
};
