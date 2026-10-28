export const ICON_PATHS = {
  tick: ["M5 12.5l4.5 4.5L19 7.5"],
  close: ["M6 6l12 12M18 6L6 18"],
  finding: ["M12 4l9 16H3z", "M12 10v4M12 17.5v.01"],
  "open-url": [
    "M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0z",
    "M2.5 12h19M12 2.5c2.7 2.6 4 5.8 4 9.5s-1.3 6.9-4 9.5c-2.7-2.6-4-5.8-4-9.5s1.3-6.9 4-9.5z",
  ],
  copy: [
    "M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z",
    "M5 15V6a2 2 0 0 1 2-2h8",
  ],
  "chevron-left": ["M15 5l-7 7 7 7"],
  "chevron-right": ["M9 5l7 7-7 7"],
  search: ["M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14z", "M20 20l-4-4"],
  refresh: ["M20 11a8 8 0 1 0-2.3 5.7", "M20 4.5V11h-6.5"],
  plus: ["M12 5v14M5 12h14"],
  minus: ["M5 12h14"],
  expand: ["M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"],
  trash: ["M4 7h16", "M9 7V4h6v3", "M6 7l1 13h10l1-13"],
  "device-add": [
    "M12 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5",
    "M18 3v6M15 6h6",
  ],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICON_PATHS;
