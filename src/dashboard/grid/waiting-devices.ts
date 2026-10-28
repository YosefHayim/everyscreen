export interface WaitingDevice {
  deviceId: string;
  name: string;
  viewportWidth: number;
  viewportHeight: number;
  cornerRadius: number;
}

// The default grid, drawn before any app is open. The device list hook replaces it in wave 2.
export const WAITING_DEVICES: WaitingDevice[] = [
  {
    deviceId: "iphone-se",
    name: "iPhone SE",
    viewportWidth: 375,
    viewportHeight: 667,
    cornerRadius: 12,
  },
  {
    deviceId: "iphone-15",
    name: "iPhone 15",
    viewportWidth: 393,
    viewportHeight: 852,
    cornerRadius: 16,
  },
  {
    deviceId: "galaxy-s24",
    name: "Galaxy S24",
    viewportWidth: 360,
    viewportHeight: 780,
    cornerRadius: 14,
  },
  {
    deviceId: "pixel-8",
    name: "Pixel 8",
    viewportWidth: 412,
    viewportHeight: 915,
    cornerRadius: 14,
  },
  {
    deviceId: "ipad-mini",
    name: "iPad mini",
    viewportWidth: 744,
    viewportHeight: 1133,
    cornerRadius: 12,
  },
  {
    deviceId: "laptop-1440",
    name: "Laptop 1440",
    viewportWidth: 1440,
    viewportHeight: 900,
    cornerRadius: 8,
  },
];
