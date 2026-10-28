export type CodeSegmentKind = "plain" | "string" | "comment" | "prompt";

export interface CodeSegment {
  kind: CodeSegmentKind;
  code: string;
  start: number;
}

const COMMENT_PREFIXES = ["#", "//"];
const PROMPT = "$ ";
const QUOTED_STRING = /("[^"]*")/;

const isCommentLine = (line: string): boolean => {
  const trimmedLine = line.trimStart();
  return COMMENT_PREFIXES.some((prefix) => trimmedLine.startsWith(prefix));
};

const splitQuotedStrings = (line: string, offset: number): CodeSegment[] => {
  const parts = line.split(QUOTED_STRING);
  const segments = parts.map((part, index): CodeSegment => {
    const isStringPart = index % 2 === 1;
    const kind = isStringPart ? "string" : "plain";
    const start = offset + parts.slice(0, index).join("").length;
    return { kind, code: part, start };
  });
  return segments.filter((segment) => segment.code !== "");
};

export const splitCodeLine = (line: string): CodeSegment[] => {
  const isComment = isCommentLine(line);
  if (isComment) return [{ kind: "comment", code: line, start: 0 }];

  const hasPrompt = line.startsWith(PROMPT);
  const isPlainLine = !hasPrompt;
  if (isPlainLine) return splitQuotedStrings(line, 0);

  const promptSegment: CodeSegment = { kind: "prompt", code: PROMPT, start: 0 };
  const commandSegments = splitQuotedStrings(
    line.slice(PROMPT.length),
    PROMPT.length,
  );
  return [promptSegment, ...commandSegments];
};
