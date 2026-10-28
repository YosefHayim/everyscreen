export type ReportHubTrouble = (error: unknown) => void;

// A hub that is down must never fail the user's tests, so the trouble is logged one time.
export const createHubTroubleReporter = (): ReportHubTrouble => {
  const reporting = { isReported: false };
  return (error) => {
    if (reporting.isReported) return;
    reporting.isReported = true;
    console.error({
      message:
        "Everyscreen could not reach the hub, so the tests run on without live updates",
      error,
    });
  };
};
