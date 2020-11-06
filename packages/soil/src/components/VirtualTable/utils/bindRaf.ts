const globalThis = window as Window;

// const frame =
//   typeof globalThis.requestIdleCallback === 'function'
//     ? globalThis.requestIdleCallback
//     : globalThis.requestAnimationFrame;

function bindRaf(
  fn: (...args: any) => void,
  // useIdle = true,
  throttle?: boolean,
) {
  if (!globalThis.requestAnimationFrame) return fn;
  let isRunning = false;
  let args: Parameters<typeof fn>;
  const request = globalThis.requestAnimationFrame;

  return (...params) => {
    args = params;

    if (isRunning || throttle) {
      return;
    }

    isRunning = true;
    request(() => {
      // console.log('run');
      fn.call(null, ...args);
      isRunning = false;
    });
  };
}

export default bindRaf;
