/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Performance utilities to improve INP (Interaction to Next Paint)
 */

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
  return new Promise(resolve => {
    setTimeout(resolve, 0);
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
  setTimeout(() => {
    void Promise.resolve(callback());
  }, delayMs);
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
export function deferFn<T extends (...args: any[]) => any>(
  fn: T,
  delayMs = 50,
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    deferWork(() => fn(...args), delayMs);
  };
}
