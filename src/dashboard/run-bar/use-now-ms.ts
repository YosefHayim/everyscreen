import { useEffect, useState } from "react";

const TICK_MS = 1000;

export const useNowMs = (isTicking: boolean): number => {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const isNotTicking = !isTicking;
    if (isNotTicking) return;
    const tickTimer = setInterval(() => {
      const tickMs = Date.now();
      setNowMs(tickMs);
    }, TICK_MS);
    return () => clearInterval(tickTimer);
  }, [isTicking]);

  return nowMs;
};
