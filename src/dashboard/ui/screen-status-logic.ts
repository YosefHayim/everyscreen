import type { ScreenStatus } from "@/dashboard/ui/screen-boundary";

export type QueryStatus = "pending" | "error" | "success";

export const pickScreenStatus = (
  queryStatus: QueryStatus,
  isEmpty: boolean,
): ScreenStatus => {
  if (queryStatus === "pending") return "loading";
  if (queryStatus === "error") return "failed";
  return isEmpty ? "empty" : "ready";
};
