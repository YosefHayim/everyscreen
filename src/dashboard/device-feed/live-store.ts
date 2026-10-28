import type { Finding } from "@/checks/checks-logic";
import {
  addDeviceStep,
  type DeviceStep,
  pickStepTotalToKeep,
} from "@/dashboard/device-feed/step-progress-logic";
import {
  type DeviceTest,
  pickTileTest,
} from "@/dashboard/device-feed/tile-test-logic";
import { LIVE_PATH } from "@/environment";
import type { DeviceLoad } from "@/estimates/estimates-logic";
import type { LiveMessage } from "@/live/live-feed";
import type { RunTotals } from "@/live/live-test-schema";

export type ConnectionStatus = "connecting" | "open" | "closed";

const FIRST_RETRY_DELAY_MS = 1000;
const LAST_RETRY_DELAY_MS = 30000;
const MAX_FINDINGS = 20;
const IS_PAGE_SECURE = location.protocol === "https:";
const LIVE_SCHEME = IS_PAGE_SECURE ? "wss:" : "ws:";
const LIVE_URL = `${LIVE_SCHEME}//${location.host}${LIVE_PATH}`;

interface Connection {
  status: ConnectionStatus;
  socket: WebSocket | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
  retryDelayMs: number;
}

const NO_STEPS: DeviceStep[] = [];

interface LiveFeed {
  deviceTests: ReadonlyMap<string, DeviceTest>;
  testSteps: ReadonlyMap<string, DeviceStep[]>;
  stepTotals: ReadonlyMap<string, number>;
  latestTest: DeviceTest | null;
  runTotals: RunTotals | null;
  screenImageUrls: ReadonlyMap<string, string>;
  deviceLoads: ReadonlyMap<string, DeviceLoad>;
  findings: Finding[];
}

const connection: Connection = {
  status: "closed",
  socket: null,
  retryTimer: null,
  retryDelayMs: FIRST_RETRY_DELAY_MS,
};

const liveFeed: LiveFeed = {
  deviceTests: new Map(),
  testSteps: new Map(),
  stepTotals: new Map(),
  latestTest: null,
  runTotals: null,
  screenImageUrls: new Map(),
  deviceLoads: new Map(),
  findings: [],
};

const listeners = new Set<() => void>();

const notifyListeners = (): void => {
  for (const listener of listeners) listener();
};

const readLiveMessage = (messageLine: string): LiveMessage | null => {
  try {
    return JSON.parse(messageLine) as LiveMessage;
  } catch (error) {
    console.error({ error });
    return null;
  }
};

type TestMessage = Extract<LiveMessage, { kind: "test" }>;

const forgetRunTests = (): void => {
  liveFeed.deviceTests = new Map();
  liveFeed.testSteps = new Map();
  liveFeed.stepTotals = new Map();
  liveFeed.latestTest = null;
};

// A late dashboard gets the finished test before its steps, so the total is learned from either.
const learnStepTotal = (testId: string): void => {
  const deviceTest = liveFeed.deviceTests.get(testId);
  const isTestUnknown = deviceTest === undefined;
  if (isTestUnknown) return;

  const testSteps = liveFeed.testSteps.get(testId) ?? NO_STEPS;
  const stepTotal = pickStepTotalToKeep(deviceTest.status, testSteps);
  const isStepTotalUnknown = stepTotal === null;
  if (isStepTotalUnknown) return;
  liveFeed.stepTotals = new Map(liveFeed.stepTotals).set(
    deviceTest.title,
    stepTotal,
  );
};

const applyTestMessage = (testMessage: TestMessage): void => {
  const { kind: _kind, ...deviceTest } = testMessage;
  const { testId, status } = deviceTest;
  const otherTests = new Map(liveFeed.deviceTests);
  otherTests.delete(testId);
  liveFeed.deviceTests = otherTests.set(testId, deviceTest);
  liveFeed.latestTest = deviceTest;

  const isTestStarting = status === "running";
  if (isTestStarting) {
    liveFeed.testSteps = new Map(liveFeed.testSteps).set(testId, NO_STEPS);
    return;
  }
  learnStepTotal(testId);
};

type StepMessage = Extract<LiveMessage, { kind: "step" }>;

const applyStepMessage = (stepMessage: StepMessage): void => {
  const { testId } = stepMessage;
  const testSteps = liveFeed.testSteps.get(testId) ?? NO_STEPS;
  const nextSteps = addDeviceStep(testSteps, stepMessage);
  liveFeed.testSteps = new Map(liveFeed.testSteps).set(testId, nextSteps);
  learnStepTotal(testId);
};

const applyLiveMessage = (liveMessage: LiveMessage): void => {
  switch (liveMessage.kind) {
    case "screen": {
      const imageUrl = `data:image/jpeg;base64,${liveMessage.imageBase64}`;
      liveFeed.screenImageUrls = new Map(liveFeed.screenImageUrls).set(
        liveMessage.deviceId,
        imageUrl,
      );
      return;
    }
    case "estimate":
      liveFeed.deviceLoads = new Map(liveFeed.deviceLoads).set(
        liveMessage.deviceId,
        liveMessage.deviceLoad,
      );
      return;
    case "test":
      applyTestMessage(liveMessage);
      return;
    case "step":
      applyStepMessage(liveMessage);
      return;
    case "run-totals": {
      const isRunStarting = liveMessage.phase === "start";
      if (isRunStarting) forgetRunTests();
      liveFeed.runTotals = liveMessage;
      return;
    }
    case "finding":
      liveFeed.findings = [liveMessage.finding, ...liveFeed.findings].slice(
        0,
        MAX_FINDINGS,
      );
      return;
    case "run":
      return;
  }
};

const markConnectionClosed = (): void => {
  connection.status = "closed";
  connection.socket = null;
  liveFeed.screenImageUrls = new Map();
  liveFeed.deviceLoads = new Map();
  forgetRunTests();
  liveFeed.runTotals = null;
  notifyListeners();
};

const connect = (): void => {
  const socket = new WebSocket(LIVE_URL);
  connection.socket = socket;
  connection.status = "connecting";
  notifyListeners();

  socket.onopen = () => {
    connection.status = "open";
    connection.retryDelayMs = FIRST_RETRY_DELAY_MS;
    notifyListeners();
  };
  socket.onmessage = (messageEvent) => {
    const liveMessage = readLiveMessage(messageEvent.data);
    const isMessageUnreadable = liveMessage === null;
    if (isMessageUnreadable) return;
    applyLiveMessage(liveMessage);
    notifyListeners();
  };
  socket.onclose = () => {
    markConnectionClosed();
    connection.retryTimer = setTimeout(connect, connection.retryDelayMs);
    connection.retryDelayMs = Math.min(
      connection.retryDelayMs * 2,
      LAST_RETRY_DELAY_MS,
    );
  };
};

const disconnect = (): void => {
  const { socket, retryTimer } = connection;
  const isRetryWaiting = retryTimer !== null;
  if (isRetryWaiting) clearTimeout(retryTimer);
  connection.retryTimer = null;
  connection.retryDelayMs = FIRST_RETRY_DELAY_MS;
  const hasSocket = socket !== null;
  if (hasSocket) {
    socket.onclose = null;
    socket.close();
  }
  markConnectionClosed();
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  const isFirstListener = listeners.size === 1;
  if (isFirstListener) connect();

  return () => {
    listeners.delete(listener);
    const isLastListenerGone = listeners.size === 0;
    if (isLastListenerGone) disconnect();
  };
};

export const getConnectionStatus = (): ConnectionStatus => connection.status;

export const getScreenImageUrl = (deviceId: string): string | null =>
  liveFeed.screenImageUrls.get(deviceId) ?? null;

export const getDeviceLoad = (deviceId: string): DeviceLoad | null =>
  liveFeed.deviceLoads.get(deviceId) ?? null;

export const getDeviceTest = (deviceId: string): DeviceTest | null => {
  const allTests = [...liveFeed.deviceTests.values()];
  const deviceTests = allTests.filter(
    (deviceTest) => deviceTest.deviceId === deviceId,
  );
  return pickTileTest(deviceTests);
};

export const getTestSteps = (testId: string): DeviceStep[] =>
  liveFeed.testSteps.get(testId) ?? NO_STEPS;

export const getStepTotal = (testTitle: string): number | null =>
  liveFeed.stepTotals.get(testTitle) ?? null;

export const getRunTotals = (): RunTotals | null => liveFeed.runTotals;

export const getLatestTest = (): DeviceTest | null => liveFeed.latestTest;

export const getRunningTestCount = (): number =>
  [...liveFeed.deviceTests.values()].filter(
    ({ status }) => status === "running",
  ).length;

export const getFindings = (): Finding[] => liveFeed.findings;

export const hasAnyScreenImage = (): boolean =>
  liveFeed.screenImageUrls.size > 0;
