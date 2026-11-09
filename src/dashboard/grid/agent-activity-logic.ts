import type { CommandNotice } from "@/live/live-command-schema";

const CLOCK_PART_WIDTH = 2;

interface LineSegment {
  key: number;
  text: string;
  isRunId: boolean;
}

export interface ActivityLine {
  key: string;
  clock: string;
  commandName: string;
  segments: LineSegment[];
  isFailed: boolean;
}

const padClockPart = (clockPart: number): string =>
  String(clockPart).padStart(CLOCK_PART_WIDTH, "0");

// A split with a capture group puts each run id at an odd position.
const splitLineAroundRunIds = (line: string): LineSegment[] => {
  const pieces = line.split(/(run-\d+)/);
  return pieces
    .map((piece, pieceIndex) => ({
      key: pieces.slice(0, pieceIndex).join("").length,
      text: piece,
      isRunId: pieceIndex % 2 === 1,
    }))
    .filter((segment) => segment.text !== "");
};

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
    segments: splitLineAroundRunIds(commandNotice.line),
    isFailed: commandNotice.status === "failed",
  }));
