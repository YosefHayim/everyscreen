import type { CommandNotice } from "@/live/live-command-schema";

const CLOCK_PART_WIDTH = 2;

export interface ActivityLine {
  key: string;
  clock: string;
  commandName: string;
  line: string;
  isFailed: boolean;
}

const padClockPart = (clockPart: number): string =>
  String(clockPart).padStart(CLOCK_PART_WIDTH, "0");

export const pickClock = (sentAt: number): string => {
  const sentDate = new Date(sentAt);
  const hours = padClockPart(sentDate.getHours());
  const minutes = padClockPart(sentDate.getMinutes());
  const seconds = padClockPart(sentDate.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
};

export const listActivityLines = (
  commandNotices: CommandNotice[],
): ActivityLine[] =>
  commandNotices.map((commandNotice) => ({
    key: `${commandNotice.sentAt}-${commandNotice.commandName}-${commandNotice.line}`,
    clock: pickClock(commandNotice.sentAt),
    commandName: commandNotice.commandName,
    line: commandNotice.line,
    isFailed: commandNotice.status === "failed",
  }));
