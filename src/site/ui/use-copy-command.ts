import { useEffect, useState } from "react";

const COPIED_LABEL_MS = 1800;

export type CopyStatus = "idle" | "copied";

export const useCopyCommand = (command: string) => {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    const isCopied = copyStatus === "copied";
    if (!isCopied) return;
    const timerId = window.setTimeout(
      () => setCopyStatus("idle"),
      COPIED_LABEL_MS,
    );
    return () => window.clearTimeout(timerId);
  }, [copyStatus]);

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
    } catch (error) {
      console.error({ command, error });
      return;
    }
    setCopyStatus("copied");
  };

  return { copyStatus, copyCommand };
};
