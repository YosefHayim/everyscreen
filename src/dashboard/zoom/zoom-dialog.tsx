import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { ModalDialog } from "@/dashboard/ui/modal-dialog";
import {
  useZoomDialog,
  type ZoomRequest,
} from "@/dashboard/zoom/use-zoom-dialog";
import { ZoomBody } from "@/dashboard/zoom/zoom-body";

export const ZoomDialog = (zoomRequest: ZoomRequest): ReactElement => {
  const { t } = useTranslation();
  const zoomControls = useZoomDialog(zoomRequest);
  const { zoomView, zoomMode } = zoomControls;
  const isOpen = zoomView !== null;

  return (
    <ModalDialog
      isOpen={isOpen}
      label={t("zoom.label")}
      className="w-[min(96vw,1600px)]"
      onClose={zoomControls.closeZoom}
      onKeyDown={zoomControls.moveWithArrowKey}
    >
      {zoomView !== null && (
        <ZoomBody
          zoomView={zoomView}
          zoomMode={zoomMode}
          onZoomModeChange={zoomControls.changeZoomMode}
          onClose={zoomControls.closeZoom}
        />
      )}
    </ModalDialog>
  );
};
