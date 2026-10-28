import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { DevicePicker } from "@/dashboard/picker/use-device-picker";
import { cn } from "@/dashboard/ui/cn";
import { ModalDialog } from "@/dashboard/ui/modal-dialog";

interface PickerDialogProps {
  devicePicker: DevicePicker;
}

export const PickerDialog = ({
  devicePicker,
}: PickerDialogProps): ReactElement => {
  const { t } = useTranslation();
  const { isOpen, makerGroups, gridDeviceIds, isSaving, hasFailed } =
    devicePicker;

  return (
    <ModalDialog
      isOpen={isOpen}
      label={t("picker.title")}
      className="w-[min(96vw,520px)]"
      onClose={devicePicker.closePicker}
      onKeyDown={null}
    >
      <div className="flex max-h-[90dvh] flex-col gap-3 p-4">
        <header className="flex items-center justify-between gap-2">
          <h2 className="m-0 text-base font-semibold">{t("picker.title")}</h2>
          <button
            type="button"
            onClick={devicePicker.closePicker}
            className="min-h-11 cursor-pointer rounded-full border border-line bg-card px-4 text-sm"
          >
            {t("picker.close")}
          </button>
        </header>
        {hasFailed && (
          <p role="alert" className="m-0 text-[13px] text-failed">
            {t("picker.failed")}
          </p>
        )}
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          {makerGroups.map((makerGroup) => (
            <section
              key={makerGroup.maker}
              aria-label={t(`picker.makers.${makerGroup.maker}`)}
              className="flex flex-col gap-1"
            >
              <h3 className="m-0 text-xs font-semibold tracking-wide text-ink-2 uppercase">
                {t(`picker.makers.${makerGroup.maker}`)}
              </h3>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {makerGroup.choices.map((choice) => {
                  const isInGrid = gridDeviceIds.includes(choice.id);
                  return (
                    <li key={choice.id}>
                      <button
                        type="button"
                        aria-pressed={isInGrid}
                        disabled={isSaving}
                        onClick={() => devicePicker.toggleDevice(choice.id)}
                        className={cn(
                          "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 text-start text-sm disabled:cursor-wait",
                          isInGrid && "border-ink bg-soft font-medium",
                          !isInGrid && "border-line bg-card",
                        )}
                      >
                        <span>{choice.name}</span>
                        <span className="font-mono text-xs text-ink-2">
                          {isInGrid && t("picker.inGrid")}
                          {!isInGrid && t("picker.add")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </ModalDialog>
  );
};
