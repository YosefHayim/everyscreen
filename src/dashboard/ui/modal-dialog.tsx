import type { KeyboardEvent, MouseEvent, ReactElement, ReactNode } from "react";
import { cn } from "@/dashboard/ui/cn";
import { useModalDialog } from "@/dashboard/ui/use-modal-dialog";

interface ModalDialogProps {
  isOpen: boolean;
  label: string;
  className: string;
  onClose: () => void;
  onKeyDown: ((keyboardEvent: KeyboardEvent<HTMLDialogElement>) => void) | null;
  children: ReactNode;
}

export const ModalDialog = ({
  isOpen,
  label,
  className,
  onClose,
  onKeyDown,
  children,
}: ModalDialogProps): ReactElement => {
  const dialogRef = useModalDialog(isOpen);

  // A click that lands on the dialog itself, not its content, hit the backdrop.
  const closeOnBackdropClick = (clickEvent: MouseEvent<HTMLDialogElement>) => {
    const isBackdropClicked = clickEvent.target === clickEvent.currentTarget;
    if (isBackdropClicked) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={onClose}
      onClick={closeOnBackdropClick}
      onKeyDown={onKeyDown ?? undefined}
      className={cn(
        "m-auto max-h-[96dvh] max-w-[96vw] rounded-xl border border-line bg-card p-0 text-ink shadow-lift backdrop:bg-ink/60",
        className,
      )}
    >
      {isOpen && children}
    </dialog>
  );
};
