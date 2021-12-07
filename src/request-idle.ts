/**
 * A Promise wrapper for requestIdleCallback with fallback to setTimeout for
 * browsers without support (aka Safari)
 */
export function requestIdle(timeout: number): Promise<void> {
  return new Promise(resolve => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve(), {timeout});
    } else {
      setTimeout(() => resolve(), timeout);
    }
  });
}
