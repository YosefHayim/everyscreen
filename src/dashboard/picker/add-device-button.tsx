import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { PickerDialog } from "@/dashboard/picker/picker-dialog";
import { useDevicePicker } from "@/dashboard/picker/use-device-picker";
import { Button } from "@/dashboard/ui/button";

export const AddDeviceButton = (): ReactElement => {
  const { t } = useTranslation();
  const devicePicker = useDevicePicker();

  return (
    <>
      <Button
        icon="device-add"
        variant="dark"
        size="small"
        onClick={devicePicker.openPicker}
      >
        {t("picker.open")}
      </Button>
      <PickerDialog devicePicker={devicePicker} />
    </>
  );
};
