import { describe, expect, test } from "vitest";
import type { Flow } from "@/flows/flow-schema";
import {
  listFlowBatches,
  listFlowCommands,
  summarizeFlows,
} from "@/flows/flows-logic";

describe("listFlowCommands", () => {
  test("turns every step kind into one command with the flow devices", () => {
    const flow: Flow = {
      name: "All steps",
      devices: ["iphone-se", "pixel-8"],
      steps: [
        { open: "http://localhost:5173" },
        { tap: { role: "button", name: "Apply" } },
        { fill: { role: "textbox", name: "Coupon", with: "SPRING" } },
        { scroll: { to: "top" } },
        { expect: { text: "Total $66" } },
        { check: null },
        { shot: null },
      ],
    };
    const deviceIds = ["iphone-se", "pixel-8"];

    const commands = listFlowCommands(flow);

    expect(commands).toEqual([
      { commandName: "open", url: "http://localhost:5173", deviceIds },
      { commandName: "tap", role: "button", name: "Apply", deviceIds },
      {
        commandName: "fill",
        role: "textbox",
        name: "Coupon",
        with: "SPRING",
        deviceIds,
      },
      { commandName: "scroll", to: "top", deviceIds },
      { commandName: "expect", text: "Total $66", deviceIds },
      { commandName: "check", deviceIds },
      { commandName: "shot", deviceIds },
    ]);
  });

  test("targets every device in the grid when the flow names none", () => {
    const flow: Flow = {
      name: "One step",
      devices: null,
      steps: [{ check: null }],
    };

    const commands = listFlowCommands(flow);

    expect(commands).toEqual([{ commandName: "check", deviceIds: null }]);
  });

  test("returns no commands for a flow without steps", () => {
    const flow: Flow = { name: "Empty", devices: null, steps: [] };

    const commands = listFlowCommands(flow);

    expect(commands).toEqual([]);
  });
});

describe("listFlowBatches", () => {
  test("returns no batches for no flows", () => {
    const batches = listFlowBatches([], 2);

    expect(batches).toEqual([]);
  });

  test("puts one flow in one batch", () => {
    const batches = listFlowBatches(["a.yaml"], 3);

    expect(batches).toEqual([["a.yaml"]]);
  });

  test("splits many flows into batches and keeps the short last batch", () => {
    const batches = listFlowBatches(
      ["a.yaml", "b.yaml", "c.yaml", "d.yaml", "e.yaml"],
      2,
    );

    expect(batches).toEqual([
      ["a.yaml", "b.yaml"],
      ["c.yaml", "d.yaml"],
      ["e.yaml"],
    ]);
  });
});

describe("summarizeFlows", () => {
  test("replies ok when every flow passes", () => {
    const reply = summarizeFlows(["pass", "pass"]);

    expect(reply).toEqual({
      status: "ok",
      line: "2 flows, 0 failed",
      runId: null,
      failures: [],
    });
  });

  test("replies failed when one flow fails", () => {
    const reply = summarizeFlows(["pass", "fail", "pass"]);

    expect(reply.status).toBe("failed");
    expect(reply.line).toBe("3 flows, 1 failed");
  });

  test("replies ok for no flows", () => {
    const reply = summarizeFlows([]);

    expect(reply.line).toBe("0 flows, 0 failed");
  });
});
