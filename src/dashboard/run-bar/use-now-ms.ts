import { useEffect, useState } from "react";

const TICK_MS = 1000;

export const useNowMs = (isTicking: boolean): number => {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!isTicking) return;
    const tickTimer = setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => clearInterval(tickTimer);
  }, [isTicking]);

  return nowMs;
};
