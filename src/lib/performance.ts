/**
 * Performance utilities to improve INP (Interaction to Next Paint)
 */

type SchedulerLike = {
  yield?: () => Promise<void>;
};

type IdleDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type RequestIdleCallback = (
  callback: (deadline: IdleDeadline) => void,
  options?: { timeout: number },
) => number;

/**
 * Yields to the main thread to allow the browser to paint.
 * Use this to break up long tasks and improve responsiveness.
 *
 * @example
 * async function handleClick() {
 *   // Critical UI update
 *   setLoading(true);
 *
 *   // Yield to allow browser to paint the loading state
 *   await yieldToMain();
 *
 *   // Heavy work
 *   await fetchData();
 * }
 */
export async function yieldToMain(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const scheduler = (globalThis as { scheduler?: SchedulerLike }).scheduler;
  if (scheduler?.yield) {
    await scheduler.yield();
    return;
  }

  await new Promise<void>(resolve => {
    requestAnimationFrame(() => resolve());
  });
}

/**
 * Defers non-critical work to improve perceived performance.
 * Work is executed after a short delay to allow urgent UI updates to complete.
 *
 * @param callback - The work to defer
 * @param delayMs - Delay in milliseconds (default: 50ms)
 *
 * @example
 * async function handleSave() {
 *   // Critical: close dialog immediately
 *   closeDialog();
 *
 *   // Non-critical: reload data in background
 *   deferWork(() => {
 *     loadData();
 *     mutateCache();
 *   });
 * }
 */
export function deferWork(callback: () => void | Promise<void>, delayMs = 50): void {
  const runCallback = () => {
    void Promise.resolve(callback());
  };

  if (typeof window === 'undefined') {
    setTimeout(runCallback, delayMs);
    return;
  }

  const requestIdle = (window as Window & { requestIdleCallback?: RequestIdleCallback })
    .requestIdleCallback;
  if (requestIdle) {
    setTimeout(() => {
      requestIdle(runCallback, { timeout: 500 });
    }, delayMs);
    return;
  }

  setTimeout(runCallback, delayMs);
}

/**
 * Wraps a function to automatically defer its execution.
 * Useful for event handlers that do heavy work.
 *
 * @param fn - The function to wrap
 * @param delayMs - Delay in milliseconds (default: 50ms)
 * @returns A wrapped function that defers execution
 *
 * @example
 * const handleClick = deferFn(async () => {
 *   await heavyWork();
 * });
 */
export function deferFn<TArgs extends unknown[], TResult extends void | Promise<void>>(
  fn: (...args: TArgs) => TResult,
  delayMs = 50,
): (...args: TArgs) => void {
  return (...args: TArgs) => {
    deferWork(() => fn(...args), delayMs);
  };
}
