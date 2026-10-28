import { describe, expect, test } from "vitest";
import type { Flow } from "@/flows/flow-schema";
import { listFlowBatches, listFlowCommands } from "@/flows/flows-logic";

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
  test("makes one batch of every flow when a batch holds one flow more than needed", () => {
    const batches = listFlowBatches(["a.yaml", "b.yaml"], 5);

    expect(batches).toEqual([["a.yaml", "b.yaml"]]);
  });

  test("makes one batch per flow when a batch holds one flow", () => {
    const batches = listFlowBatches(["a.yaml", "b.yaml"], 1);

    expect(batches).toEqual([["a.yaml"], ["b.yaml"]]);
  });

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
