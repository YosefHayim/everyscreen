import type { ReactElement } from "react";
export const LogoMark = (): ReactElement => (
  <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="9" className="fill-cobalt" />
    <rect x="6" y="10" width="5" height="13" rx="1.5" className="fill-card" />
    <rect x="13.5" y="7" width="6" height="16" rx="1.5" className="fill-card" />
    <rect
      x="22"
      y="13"
      width="4.5"
      height="10"
      rx="1.5"
      className="fill-pink"
    />
  </svg>
);
