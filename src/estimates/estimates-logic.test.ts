import { describe, expect, test } from "vitest";
import {
  estimateDeviceLoad,
  pickSampleWindow,
  type Sample,
} from "@/estimates/estimates-logic";

const createSample = (overrides: Partial<Sample>): Sample => ({
  takenAt: 0,
  taskSeconds: 0,
  layoutSeconds: 0,
  heapBytes: 0,
  frames: 0,
  layoutShift: 0,
  ...overrides,
});

describe("estimateDeviceLoad", () => {
  test("returns an idle load for no samples", () => {
    const samples: Sample[] = [];

    const deviceLoad = estimateDeviceLoad(samples);

    expect(deviceLoad).toEqual({
      label: "est.",
      fps: 0,
      cpuPercent: 0,
      memoryMegabytes: 0,
      layoutShift: 0,
      status: "ok",
    });
  });

  test("returns an idle load for one sample", () => {
    const samples = [createSample({ takenAt: 1000, frames: 90 })];

    const deviceLoad = estimateDeviceLoad(samples);

    expect(deviceLoad.fps).toBe(0);
    expect(deviceLoad.status).toBe("ok");
  });

  test("returns an idle load when two samples share one time", () => {
    const samples = [
      createSample({ takenAt: 1000 }),
      createSample({ takenAt: 1000, frames: 60 }),
    ];

    const deviceLoad = estimateDeviceLoad(samples);

    expect(deviceLoad.fps).toBe(0);
  });

  test("works out fps, cpu, memory and layout shift over the window", () => {
    const samples = [
      createSample({ takenAt: 0, frames: 0, taskSeconds: 0 }),
      createSample({
        takenAt: 2000,
        frames: 120,
        taskSeconds: 0.5,
        heapBytes: 12_000_000,
        layoutShift: 0.05,
      }),
    ];

    const deviceLoad = estimateDeviceLoad(samples);

    expect(deviceLoad).toEqual({
      label: "est.",
      fps: 60,
      cpuPercent: 25,
      memoryMegabytes: 12,
      layoutShift: 0.05,
      status: "ok",
    });
  });

  test("warns when fps is under the minimum", () => {
    const samples = [
      createSample({ takenAt: 0 }),
      createSample({ takenAt: 1000, frames: 10 }),
    ];

    const deviceLoad = estimateDeviceLoad(samples);

    expect(deviceLoad.status).toBe("warn");
  });

  test("warns when cpu is over the maximum", () => {
    const samples = [
      createSample({ takenAt: 0 }),
      createSample({ takenAt: 1000, frames: 60, taskSeconds: 0.9 }),
    ];

    const deviceLoad = estimateDeviceLoad(samples);

    expect(deviceLoad.status).toBe("warn");
  });

  test("warns when layout shift is over the maximum", () => {
    const samples = [
      createSample({ takenAt: 0 }),
      createSample({ takenAt: 1000, frames: 60, layoutShift: 0.3 }),
    ];

    const deviceLoad = estimateDeviceLoad(samples);

    expect(deviceLoad.status).toBe("warn");
  });

  test("caps cpu at one hundred percent", () => {
    const samples = [
      createSample({ takenAt: 0 }),
      createSample({ takenAt: 1000, frames: 60, taskSeconds: 3 }),
    ];

    const deviceLoad = estimateDeviceLoad(samples);

    expect(deviceLoad.cpuPercent).toBe(100);
  });
});

describe("pickSampleWindow", () => {
  test("starts a window from the first sample", () => {
    const firstSample = createSample({ takenAt: 1 });

    const sampleWindow = pickSampleWindow([], firstSample, 3);

    expect(sampleWindow).toEqual([firstSample]);
  });

  test("keeps only the newest samples up to the window size", () => {
    const recentSamples = [1, 2, 3].map((takenAt) =>
      createSample({ takenAt, frames: takenAt }),
    );
    const newSample = createSample({ takenAt: 4, frames: 4 });

    const sampleWindow = pickSampleWindow(recentSamples, newSample, 3);

    expect(sampleWindow.map((sample) => sample.takenAt)).toEqual([2, 3, 4]);
  });

  test("clears the window when the frame counter goes down", () => {
    const recentSamples = [createSample({ takenAt: 1, frames: 90 })];
    const newSample = createSample({ takenAt: 2, frames: 3 });

    const sampleWindow = pickSampleWindow(recentSamples, newSample, 5);

    expect(sampleWindow).toEqual([newSample]);
  });
});
