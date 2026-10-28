import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { hubApi } from "@/dashboard/hub-api";

export const useUpdateGrid = (): UseMutationResult<void, Error, string[]> =>
  // No onSuccess: the MutationCache refreshes the device list.
  useMutation({
    mutationFn: async (deviceIds: string[]) => {
      const gridReply = await hubApi.api.devices.grid.$put({
        json: { deviceIds },
      });
      const isReplyBad = !gridReply.ok;
      if (isReplyBad) throw new Error(`Update grid: ${gridReply.status}`);
    },
  });
