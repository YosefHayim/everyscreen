import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { hubApi } from "@/dashboard/hub-api";

export const useRemoveDevice = (): UseMutationResult<void, Error, string> =>
  // No onSuccess: the MutationCache refreshes the device list.
  useMutation({
    mutationFn: async (deviceId: string) => {
      const removeReply = await hubApi.api.devices[":deviceId"].$delete({
        param: { deviceId },
      });
      const isReplyBad = !removeReply.ok;
      if (isReplyBad) throw new Error(`Remove device: ${removeReply.status}`);
    },
  });
