const globalThis = window as Window;

function bindRaf<T extends []>(
  fn: (...args: T) => void,
  // useIdle = true,
  throttle?: boolean,
) {
  if (!globalThis.requestAnimationFrame) return fn;
  let isRunning = false;
  let args: Parameters<typeof fn>;
  const request = globalThis.requestAnimationFrame;

  return (...params: typeof args) => {
    args = params;

    if (isRunning || throttle) {
      return;
    }

    isRunning = true;
    request(() => {
      fn.call(null, ...args);
      isRunning = false;
    });
  };
}

export default bindRaf;
