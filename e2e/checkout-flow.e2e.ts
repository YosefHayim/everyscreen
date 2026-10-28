import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";
import { hubCommandSchema } from "@/commands/commands-schema";
import { flowSchema } from "@/flows/flow-schema";
import { listFlowCommands } from "@/flows/flows-logic";

const CHECKOUT_FLOW_PATH = new URL("./checkout.yaml", import.meta.url);

test("checkout.yaml becomes four valid hub commands on three devices", async () => {
  const flowText = await readFile(CHECKOUT_FLOW_PATH, "utf8");
  const flow = flowSchema.parse(parse(flowText));

  const commands = listFlowCommands(flow);

  const deviceIds = ["iphone-se", "iphone-15", "pixel-8"];
  expect(commands).toEqual([
    { commandName: "open", url: "http://localhost:5173", deviceIds },
    {
      commandName: "fill",
      role: "textbox",
      name: "Coupon",
      with: "SPRING",
      deviceIds,
    },
    { commandName: "tap", role: "button", name: "Apply", deviceIds },
    { commandName: "expect", text: "Total $66", deviceIds },
  ]);
  for (const command of commands) {
    expect(hubCommandSchema.safeParse(command).success).toBe(true);
  }
});
