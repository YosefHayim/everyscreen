import { describe, expect, test } from "vitest";
import { splitCodeLine } from "./code-line-logic";

describe("splitCodeLine", () => {
  test("returns one plain segment for a line with no quotes", () => {
    const line = "name: Checkout";

    const segments = splitCodeLine(line);

    expect(segments).toEqual([{ kind: "plain", code: line, start: 0 }]);
  });

  test("marks quoted text as a string between plain parts", () => {
    const line = 'tap("Apply");';

    const segments = splitCodeLine(line);

    expect(segments).toEqual([
      { kind: "plain", code: "tap(", start: 0 },
      { kind: "string", code: '"Apply"', start: 4 },
      { kind: "plain", code: ");", start: 11 },
    ]);
  });

  test("keeps two equal strings apart by their start", () => {
    const line = '"M", "M"';

    const segments = splitCodeLine(line);

    const starts = segments.map((segment) => segment.start);
    expect(starts).toEqual([0, 3, 5]);
  });

  test("marks a hash line as one comment", () => {
    const segments = splitCodeLine("# flows/checkout.yaml");

    expect(segments).toEqual([
      { kind: "comment", code: "# flows/checkout.yaml", start: 0 },
    ]);
  });

  test("marks a slash line as one comment", () => {
    const segments = splitCodeLine("// playwright.config.ts");

    expect(segments).toEqual([
      { kind: "comment", code: "// playwright.config.ts", start: 0 },
    ]);
  });

  test("splits the prompt from the command and keeps string offsets", () => {
    const segments = splitCodeLine('$ tap --name "Apply"');

    expect(segments).toEqual([
      { kind: "prompt", code: "$ ", start: 0 },
      { kind: "plain", code: "tap --name ", start: 2 },
      { kind: "string", code: '"Apply"', start: 13 },
    ]);
  });

  test("returns no segments for an empty line", () => {
    const segments = splitCodeLine("");

    expect(segments).toEqual([]);
  });
});
