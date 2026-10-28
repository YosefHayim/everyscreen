import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { LIVE_CLIENT_ID } from "@/dashboard/device-feed/live-client-id";
import { hubApi } from "@/dashboard/hub-api";

// Tells the hub which device streams at full size; null puts every device back.
export const useZoomStream = (): UseMutationResult<
  void,
  Error,
  string | null
> =>
  useMutation({
    mutationFn: async (deviceId: string | null) => {
      const zoomReply = await hubApi.api.zoom.$put({
        json: { deviceId, clientId: LIVE_CLIENT_ID },
      });
      const isReplyBad = !zoomReply.ok;
      if (isReplyBad) throw new Error(`Zoom device: ${zoomReply.status}`);
    },
  });
