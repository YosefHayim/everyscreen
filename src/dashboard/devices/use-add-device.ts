import { useMutation } from "@tanstack/react-query";
import type { z } from "zod";
import { hubApi } from "@/dashboard/hub-api";
import { useZodForm } from "@/dashboard/use-zod-form";
import { customDeviceSchema } from "@/devices/device-schema";

type NewDevice = z.output<typeof customDeviceSchema>;

const NEW_DEVICE_DEFAULTS = {
  name: "",
  width: 390,
  height: 844,
  pixelRatio: 2,
  hasTouch: true,
  frameShape: "dynamic-island",
  browserName: "chromium",
} satisfies NewDevice;

export const useAddDevice = () => {
  const form = useZodForm({
    schema: customDeviceSchema,
    mode: "onBlur",
    defaultValues: NEW_DEVICE_DEFAULTS,
  });

  // No onSuccess: the MutationCache refreshes the device list.
  const addDeviceMutation = useMutation({
    mutationFn: async (newDevice: NewDevice) => {
      const addReply = await hubApi.api.devices.$post({ json: newDevice });
      const isReplyBad = !addReply.ok;
      if (isReplyBad) throw new Error(`Add device: ${addReply.status}`);
    },
    onSuccess: () => form.reset(),
  });

  const addDevice = form.handleSubmit((newDevice) => {
    const isAlreadySaving = addDeviceMutation.isPending;
    if (isAlreadySaving) return;
    addDeviceMutation.mutate(newDevice);
  });

  const errorMessages = Object.values(form.formState.errors).map(
    (fieldError) => fieldError.message,
  );

  return {
    form,
    addDevice,
    isSaving: addDeviceMutation.isPending,
    hasFailed: addDeviceMutation.isError,
    errorMessages,
  };
};
