export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30000,
  focusThrottleInterval: 60000,
  errorRetryInterval: 10000,
  errorRetryCount: 2,
  keepPreviousData: true,
  provider: () => new Map(),
};
