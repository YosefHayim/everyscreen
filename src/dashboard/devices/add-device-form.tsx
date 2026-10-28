import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { useAddDevice } from "@/dashboard/devices/use-add-device";
import { Button } from "@/dashboard/ui/button";
import { FormField } from "@/dashboard/ui/form-field";
import { Toggle } from "@/dashboard/ui/toggle";
import { customDeviceSchema } from "@/devices/device-schema";

const BROWSER_NAMES = customDeviceSchema.shape.browserName.unwrap().options;
const FRAME_SHAPES = customDeviceSchema.shape.frameShape.unwrap().options;
const NUMBER_FIELDS = ["width", "height", "pixelRatio"] as const;
const INPUT_CLASS_NAME =
  "h-11 w-full min-w-0 rounded-lg border border-line bg-card px-3 text-sm text-ink";

export const AddDeviceForm = (): ReactElement => {
  const { t } = useTranslation();
  const { form, addDevice, isSaving, hasFailed, errorMessages } =
    useAddDevice();
  const submitLabel = isSaving
    ? t("devices.add.saving")
    : t("devices.add.submit");

  return (
    <form onSubmit={addDevice} noValidate className="flex flex-col gap-4">
      <h2 className="m-0 text-lg font-medium">{t("devices.add.title")}</h2>
      <FormField fieldId="name" label={t("devices.add.name")}>
        <input
          id="name"
          className={INPUT_CLASS_NAME}
          {...form.register("name")}
        />
      </FormField>
      <div className="flex gap-3">
        {NUMBER_FIELDS.map((numberField) => (
          <FormField
            key={numberField}
            fieldId={numberField}
            label={t(`devices.add.${numberField}`)}
          >
            <input
              id={numberField}
              type="number"
              step="any"
              className={INPUT_CLASS_NAME}
              {...form.register(numberField, { valueAsNumber: true })}
            />
          </FormField>
        ))}
      </div>
      <div className="flex gap-3">
        <FormField fieldId="browserName" label={t("devices.add.browserName")}>
          <select
            id="browserName"
            className={INPUT_CLASS_NAME}
            {...form.register("browserName")}
          >
            {BROWSER_NAMES.map((browserName) => (
              <option key={browserName} value={browserName}>
                {t(`tile.engines.${browserName}`)}
              </option>
            ))}
          </select>
        </FormField>
        <FormField fieldId="frameShape" label={t("devices.add.frameShape")}>
          <select
            id="frameShape"
            className={INPUT_CLASS_NAME}
            {...form.register("frameShape")}
          >
            {FRAME_SHAPES.map((frameShape) => (
              <option key={frameShape} value={frameShape}>
                {t(`devices.add.frames.${frameShape}`)}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="flex min-h-11 items-center justify-between gap-3 text-sm">
        <label htmlFor="hasTouch">{t("devices.add.touch")}</label>
        <Toggle id="hasTouch" {...form.register("hasTouch")} />
      </div>
      {errorMessages.map((errorMessage) => (
        <p key={errorMessage} role="alert" className="m-0 text-sm text-failed">
          {errorMessage}
        </p>
      ))}
      {hasFailed && (
        <p role="alert" className="m-0 text-sm text-failed">
          {t("devices.add.failed")}
        </p>
      )}
      <Button
        icon="plus"
        type="submit"
        variant="dark"
        disabled={isSaving}
        className="w-full"
      >
        {submitLabel}
      </Button>
    </form>
  );
};
