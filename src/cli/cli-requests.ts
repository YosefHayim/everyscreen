import {
  type CliRequest,
  createDeviceListLine,
  createHubDownReply,
  createReply,
  createRunningLine,
} from "@/cli/cli-logic";
import {
  callHub,
  createHubUrl,
  readHubFile,
  readProblemReply,
  sendHubCommand,
} from "@/cli/hub-client";
import {
  startHubInBackground,
  startHubInForeground,
  stopHub,
} from "@/cli/hub-process";
import type { CommandReply } from "@/commands/commands-logic";
import type { CustomDevice } from "@/devices/device-schema";
import { listFlowPaths, runFlows } from "@/flows/flow-runner";
import { summarizeFlows } from "@/flows/flows-logic";
import { installSkill, type SkillAgent } from "@/skill/skill-install";

const RESTART_HINT = "restart the hub to apply";

const showHubStatus = async (rootFolder: string): Promise<CommandReply> => {
  const hubFile = await readHubFile(rootFolder);
  const isHubFileMissing = hubFile === null;
  if (isHubFileMissing) return createHubDownReply();
  return callHub(rootFolder, async (hubClient) => {
    const devicesResponse = await hubClient.api.devices.$get();
    const isDevicesRefused = !devicesResponse.ok;
    if (isDevicesRefused) return readProblemReply(devicesResponse);
    const devices = await devicesResponse.json();
    const hubUrl = createHubUrl(hubFile);
    return createReply("ok", createRunningLine(hubUrl, devices.length));
  });
};

const listDevices = (rootFolder: string): Promise<CommandReply> =>
  callHub(rootFolder, async (hubClient) => {
    const devicesResponse = await hubClient.api.devices.$get();
    const isDevicesRefused = !devicesResponse.ok;
    if (isDevicesRefused) return readProblemReply(devicesResponse);
    const devices = await devicesResponse.json();
    const deviceIds = devices.map(({ id }) => id);
    return createReply("ok", createDeviceListLine(deviceIds));
  });

const addDevice = (
  rootFolder: string,
  customDevice: CustomDevice,
): Promise<CommandReply> =>
  callHub(rootFolder, async (hubClient) => {
    const addResponse = await hubClient.api.devices.$post({
      json: customDevice,
    });
    const isAddRefused = !addResponse.ok;
    if (isAddRefused) return readProblemReply(addResponse);
    const devicePreset = await addResponse.json();
    return createReply(
      "ok",
      `device added · ${devicePreset.id} · ${RESTART_HINT}`,
    );
  });

const removeDevice = (
  rootFolder: string,
  deviceId: string,
): Promise<CommandReply> =>
  callHub(rootFolder, async (hubClient) => {
    const removeResponse = await hubClient.api.devices[":deviceId"].$delete({
      param: { deviceId },
    });
    const isRemoveRefused = !removeResponse.ok;
    if (isRemoveRefused) return readProblemReply(removeResponse);
    return createReply("ok", `device removed · ${deviceId} · ${RESTART_HINT}`);
  });

const runFlowFiles = async (
  rootFolder: string,
  flowsGlob: string,
  parallel: number,
): Promise<CommandReply> => {
  const hubFile = await readHubFile(rootFolder);
  const isHubFileMissing = hubFile === null;
  if (isHubFileMissing) return createHubDownReply();
  const flowPaths = await listFlowPaths(rootFolder, flowsGlob);
  const flowAnswers = await runFlows(rootFolder, flowPaths, parallel);
  return summarizeFlows(flowAnswers);
};

const installAgentSkill = async (
  agent: SkillAgent,
  rootFolder: string,
): Promise<CommandReply> => {
  const installedFile = await installSkill(agent, rootFolder);
  return createReply("ok", `skill installed · ${installedFile}`);
};

const startHubFor = (
  rootFolder: string,
  port: number,
  isForeground: boolean,
): Promise<CommandReply> => {
  if (isForeground) return startHubInForeground(rootFolder, port);
  return startHubInBackground(rootFolder, port);
};

export const runCliRequest = (
  cliRequest: CliRequest,
  rootFolder: string,
): Promise<CommandReply> => {
  switch (cliRequest.kind) {
    case "send-command":
      return sendHubCommand(rootFolder, cliRequest.hubCommand);
    case "start":
      return startHubFor(rootFolder, cliRequest.port, cliRequest.isForeground);
    case "stop":
      return stopHub(rootFolder);
    case "status":
      return showHubStatus(rootFolder);
    case "list-devices":
      return listDevices(rootFolder);
    case "add-device":
      return addDevice(rootFolder, cliRequest.customDevice);
    case "remove-device":
      return removeDevice(rootFolder, cliRequest.deviceId);
    case "run-flows":
      return runFlowFiles(
        rootFolder,
        cliRequest.flowsGlob,
        cliRequest.parallel,
      );
    case "install-skill":
      return installAgentSkill(cliRequest.agent, rootFolder);
  }
};
