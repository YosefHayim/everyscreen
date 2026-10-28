import { describe, expect, test } from "vitest";
import type { CommandReply, DeviceFailure } from "@/commands/commands-logic";
import type { Flow } from "@/flows/flow-schema";
import {
  createFailedFlowAnswer,
  createFlowAnswer,
  listFlowBatches,
  listFlowCommands,
  summarizeFlows,
} from "@/flows/flows-logic";

describe("listFlowCommands", () => {
  test("adds the flow devices to every step", () => {
    const flow: Flow = {
      name: "All steps",
      devices: ["iphone-se", "pixel-8"],
      steps: [
        { commandName: "open", url: "http://localhost:5173" },
        { commandName: "tap", role: "button", name: "Apply" },
        {
          commandName: "fill",
          role: "textbox",
          name: "Coupon",
          with: "SPRING",
        },
        { commandName: "scroll", to: "top" },
        { commandName: "expect", text: "Total $66" },
        { commandName: "check" },
        { commandName: "shot" },
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
      steps: [{ commandName: "check" }],
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
  test("puts every flow in one batch when the batch size is larger than the flow count", () => {
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

const okReply: CommandReply = {
  status: "ok",
  line: "1 device · 1 ok · report run-0001",
  runId: "run-0001",
  failures: [],
};

const deviceFailure: DeviceFailure = {
  status: "failed",
  deviceId: "iphone-se",
  durationMs: 12,
  message: "cookie bar covers Apply",
  shotPath: null,
};

describe("createFlowAnswer", () => {
  test("is ok when every step is ok and keeps the last run id", () => {
    const flowAnswer = createFlowAnswer("flows/a.yaml", [okReply, okReply]);

    expect(flowAnswer).toEqual({
      flowPath: "flows/a.yaml",
      status: "ok",
      runId: "run-0001",
      failures: [],
      problemLine: null,
    });
  });

  test("is ok with no run id when the flow has no steps", () => {
    const flowAnswer = createFlowAnswer("flows/empty.yaml", []);

    expect(flowAnswer.status).toBe("ok");
    expect(flowAnswer.runId).toBeNull();
  });

  test("fails with the device failures of the failed step", () => {
    const failedReply: CommandReply = {
      ...okReply,
      status: "failed",
      failures: [deviceFailure],
    };

    const flowAnswer = createFlowAnswer("flows/a.yaml", [okReply, failedReply]);

    expect(flowAnswer.status).toBe("failed");
    expect(flowAnswer.failures).toEqual([deviceFailure]);
    expect(flowAnswer.problemLine).toBeNull();
  });

  test("fails with the reply line when no device failure came back", () => {
    const refusedReply: CommandReply = {
      status: "failed",
      line: "No device nope",
      runId: null,
      failures: [],
    };

    const flowAnswer = createFlowAnswer("flows/a.yaml", [refusedReply]);

    expect(flowAnswer.failures).toEqual([]);
    expect(flowAnswer.problemLine).toBe("No device nope");
  });
});

describe("createFailedFlowAnswer", () => {
  test("fails with no run and carries the problem line", () => {
    const flowAnswer = createFailedFlowAnswer("flows/a.yaml", "bad flow file");

    expect(flowAnswer).toEqual({
      flowPath: "flows/a.yaml",
      status: "failed",
      runId: null,
      failures: [],
      problemLine: "bad flow file",
    });
  });
});

describe("summarizeFlows", () => {
  test("counts two ok flows and names the last run", () => {
    const flowAnswers = [
      {
        flowPath: "a.yaml",
        status: "ok" as const,
        runId: "run-0001",
        failures: [],
        problemLine: null,
      },
      {
        flowPath: "b.yaml",
        status: "ok" as const,
        runId: "run-0002",
        failures: [],
        problemLine: null,
      },
    ];

    const commandReply = summarizeFlows(flowAnswers);

    expect(commandReply.status).toBe("ok");
    expect(commandReply.line).toBe("2 flows · 2 ok · report run-0002");
  });

  test("fails and lists the failures when one flow failed", () => {
    const flowAnswers = [
      {
        flowPath: "a.yaml",
        status: "ok" as const,
        runId: "run-0001",
        failures: [],
        problemLine: null,
      },
      {
        flowPath: "b.yaml",
        status: "failed" as const,
        runId: "run-0001",
        failures: [deviceFailure],
        problemLine: null,
      },
    ];

    const commandReply = summarizeFlows(flowAnswers);

    expect(commandReply.status).toBe("failed");
    expect(commandReply.line).toBe(
      "2 flows · 1 ok · 1 failed · report run-0001",
    );
    expect(commandReply.failures).toEqual([deviceFailure]);
  });

  test("adds the problem line of a flow that could not run to the reply line", () => {
    const flowAnswers = [createFailedFlowAnswer("b.yaml", "bad flow file")];

    const commandReply = summarizeFlows(flowAnswers);

    expect(commandReply.status).toBe("failed");
    expect(commandReply.line).toBe(
      "1 flow · 0 ok · 1 failed · b.yaml: bad flow file",
    );
  });

  test("fails when no flow was found", () => {
    const commandReply = summarizeFlows([]);

    expect(commandReply.status).toBe("failed");
    expect(commandReply.line).toBe("0 flows · no flow answered");
    expect(commandReply.runId).toBeNull();
  });
});
