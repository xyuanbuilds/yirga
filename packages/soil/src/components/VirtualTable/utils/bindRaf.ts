const globalThis = window as Window;

// const frame =
//   typeof globalThis.requestIdleCallback === 'function'
//     ? globalThis.requestIdleCallback
//     : globalThis.requestAnimationFrame;

function bindRaf(fn: (...args: unknown[]) => void, throttle?: boolean) {
  if (!globalThis.requestAnimationFrame) return fn;
  let isRunning = false;
  let args: unknown[];

  const run = () => {
    isRunning = false;
    fn.call(null, ...args);
  };

  return (...params) => {
    args = params;

    if (isRunning && throttle) {
      return;
    }

    isRunning = true;
    globalThis.requestAnimationFrame(run);
    // frame(run);
  };
}

export default bindRaf;
