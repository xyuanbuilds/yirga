// Inspired by react-window https://github.com/bvaughn/react-window/blob/master/src/timer.js
const hasNativePerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

const now = hasNativePerformanceNow
  ? () => performance.now()
  : () => Date.now();

export type TimeoutID = {
  id: number;
};

export function cancelTimeout(timeoutID: TimeoutID) {
  cancelAnimationFrame(timeoutID.id);
}

export function requestTimeout(callback: () => void, delay: number): TimeoutID {
  const start = now();

  const timeoutID: TimeoutID = {
    id: requestAnimationFrame(tick),
  };

  function tick() {
    if (now() - start >= delay) {
      callback.call(null);
    } else {
      timeoutID.id = requestAnimationFrame(tick);
    }
  }

  return timeoutID;
}
