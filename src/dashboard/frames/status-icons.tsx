import type { ReactElement } from "react";

interface StatusIconShape {
  name: string;
  viewBox: string;
  widthInEm: number;
  path: string;
}

const STATUS_ICON_SHAPES = [
  {
    name: "signal",
    viewBox: "0 0 16 11",
    widthInEm: 1.1,
    path: "M1 8h2.4v3H1zM5.2 6h2.4v5H5.2zM9.4 3.5h2.4V11H9.4zM13.6 1H16v10h-2.4z",
  },
  {
    name: "wifi",
    viewBox: "0 0 16 11",
    widthInEm: 1.1,
    path: "M8 10.5 5.7 8a3.3 3.3 0 0 1 4.6 0zM3.9 5.9a6.2 6.2 0 0 1 8.2 0l-1.2 1.3a4.4 4.4 0 0 0-5.8 0zM1.6 3.6a9.4 9.4 0 0 1 12.8 0l-1.2 1.3a7.6 7.6 0 0 0-10.4 0z",
  },
  {
    name: "battery",
    viewBox: "0 0 26 12",
    widthInEm: 1.8,
    path: "M2.5.5h18A2.5 2.5 0 0 1 23 3v6a2.5 2.5 0 0 1-2.5 2.5h-18A2.5 2.5 0 0 1 0 9V3A2.5 2.5 0 0 1 2.5.5zm0 1.6a.9.9 0 0 0-.9.9v6a.9.9 0 0 0 .9.9h18a.9.9 0 0 0 .9-.9V3a.9.9 0 0 0-.9-.9zM3 3.4h17v5.2H3zM24.2 4.2v3.6c.8-.3 1.4-1 1.4-1.8s-.6-1.5-1.4-1.8z",
  },
] satisfies StatusIconShape[];

const STATUS_ICON_GAP_IN_EM = 0.35;

export const StatusIcons = (): ReactElement => (
  <span
    aria-hidden="true"
    className="inline-flex items-center"
    style={{ gap: `${STATUS_ICON_GAP_IN_EM}em` }}
  >
    {STATUS_ICON_SHAPES.map((statusIconShape) => (
      <svg
        key={statusIconShape.name}
        aria-hidden="true"
        viewBox={statusIconShape.viewBox}
        fill="currentColor"
        fillRule="evenodd"
        style={{ height: "0.8em", width: `${statusIconShape.widthInEm}em` }}
      >
        <path d={statusIconShape.path} />
      </svg>
    ))}
  </span>
);
