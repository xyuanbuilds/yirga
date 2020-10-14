function bindRaf(fn: (...args: any) => void, throttle?: boolean) {
  let isRunning = false;
  let args: any[];

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
    requestAnimationFrame(run);
  };
}

export default bindRaf;
