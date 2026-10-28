import type { ReactElement } from "react";
import { cn } from "@/dashboard/ui/cn";
import { type CodeSegmentKind, splitCodeLine } from "./code-line-logic";

const SEGMENT_CLASS_NAMES = {
  plain: "",
  string: "text-code-string",
  comment: "text-muted",
  prompt: "text-muted",
} satisfies Record<CodeSegmentKind, string>;

interface CodeBlockProps {
  codeLines: string[];
  failedLineNumber?: number | null;
  isNumbered?: boolean;
  className?: string;
}

export const CodeBlock = ({
  codeLines,
  failedLineNumber = null,
  isNumbered = false,
  className,
}: CodeBlockProps): ReactElement => {
  const numberedLines = codeLines.map((codeLine, index) => ({
    codeLine,
    lineNumber: index + 1,
  }));

  return (
    <div
      className={cn(
        "font-mono text-[11.5px] leading-[21px] text-[#e6e8f0] md:text-[12.5px]",
        className,
      )}
    >
      {numberedLines.map(({ codeLine, lineNumber }) => {
        const isFailedLine = lineNumber === failedLineNumber;
        const segments = splitCodeLine(codeLine);
        return (
          <div
            key={lineNumber}
            className={cn(
              "flex min-h-[21px] whitespace-pre-wrap md:whitespace-pre",
              isFailedLine && "bg-[rgb(224_87_60/0.24)]",
            )}
          >
            {isNumbered && (
              <span
                className={cn(
                  "w-8 flex-none text-muted",
                  isFailedLine && "text-code-line-number",
                )}
              >
                {lineNumber}
              </span>
            )}
            <span>
              {segments.map((segment) => (
                <span
                  key={segment.start}
                  className={SEGMENT_CLASS_NAMES[segment.kind]}
                >
                  {segment.code}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
};
