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
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICON_PATHS;
