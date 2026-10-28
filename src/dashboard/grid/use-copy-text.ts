import { type MutationStatus, useMutation } from "@tanstack/react-query";

const COPIED_LABEL_MS = 1500;

type CopyStatus = "idle" | "copied" | "failed";

const COPY_STATUSES = {
  idle: "idle",
  pending: "idle",
  success: "copied",
  error: "failed",
} satisfies Record<MutationStatus, CopyStatus>;

export const useCopyText = (text: string) => {
  const copyMutation = useMutation({
    mutationFn: () => navigator.clipboard.writeText(text),
    onSuccess: () => {
      setTimeout(() => copyMutation.reset(), COPIED_LABEL_MS);
    },
  });

  return {
    copyStatus: COPY_STATUSES[copyMutation.status],
    copyText: () => copyMutation.mutate(),
  };
};
