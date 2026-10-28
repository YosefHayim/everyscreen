import { type RefObject, useEffect, useRef } from "react";

export const useModalDialog = (
  isOpen: boolean,
): RefObject<HTMLDialogElement | null> => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogElement = dialogRef.current;
    const isDialogMissing = dialogElement === null;
    if (isDialogMissing) return;
    const isShownNow = dialogElement.open;
    const mustShow = isOpen && !isShownNow;
    const mustHide = !isOpen && isShownNow;
    if (mustShow) dialogElement.showModal();
    if (mustHide) dialogElement.close();
  }, [isOpen]);

  return dialogRef;
};
