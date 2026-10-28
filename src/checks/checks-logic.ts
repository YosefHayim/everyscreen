export const MIN_TAP_SIZE = 44;

export type FindingKind =
  | "overflow"
  | "clipped-text"
  | "safe-area"
  | "tap-target"
  | "console-error"
  | "failed-request";

export type Severity = "fail" | "warn";

export interface Finding {
  kind: FindingKind;
  severity: Severity;
  deviceId: string;
  selector: string | null;
  message: string;
}

export interface CheckDevice {
  id: string;
  hasTouch: boolean;
}
