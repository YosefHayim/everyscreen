import { useEffect, useState } from "react";

const COPIED_LABEL_MS = 1500;

type CopyStatus = "idle" | "copied" | "failed";

interface CopyTextControl {
  copyStatus: CopyStatus;
  copyText: () => Promise<void>;
}

export const useCopyText = (copiedLine: string): CopyTextControl => {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    const isIdle = copyStatus === "idle";
    if (isIdle) return;
    const resetTimer = setTimeout(() => setCopyStatus("idle"), COPIED_LABEL_MS);
    return () => clearTimeout(resetTimer);
  }, [copyStatus]);

  const copyText = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(copiedLine);
      setCopyStatus("copied");
    } catch (error) {
      console.error({ error });
      setCopyStatus("failed");
    }
  };

  return { copyStatus, copyText };
};
