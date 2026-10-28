import { useTranslation } from "react-i18next";
import type { WaitingDevice } from "@/dashboard/grid/waiting-devices";

const WAITING_SCALE = 0.24;

interface WaitingFrameProps {
  device: WaitingDevice;
}

export const WaitingFrame = ({ device }: WaitingFrameProps) => {
  const { t } = useTranslation();
  const { name, viewportWidth, viewportHeight, cornerRadius } = device;
  const width = Math.round(viewportWidth * WAITING_SCALE);
  const height = Math.round(viewportHeight * WAITING_SCALE);

  return (
    <figure className="m-0 flex flex-col gap-2" style={{ width }}>
      <div
        className="flex flex-col items-center justify-center gap-2 border-[1.5px] border-muted px-2 text-center"
        style={{ width, height, borderRadius: cornerRadius }}
      >
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full border-[1.5px] border-muted"
        />
        <span className="text-xs leading-4 text-ink-2">
          {t("grid.waiting")}
        </span>
      </div>
      <figcaption className="flex flex-col gap-px">
        <span className="text-[12.5px] font-medium">{name}</span>
        <span className="font-mono text-[11px] text-ink-3">
          {viewportWidth}&times;{viewportHeight}
        </span>
      </figcaption>
    </figure>
  );
};
