export const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  focusThrottleInterval: 10000,
  errorRetryInterval: 10000,
  errorRetryCount: 2,
  keepPreviousData: true,
  provider: () => new Map(),
};
