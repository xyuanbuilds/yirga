import * as React from 'react';

export default function useTimeoutLock<State>(defaultState?: State) {
  const frameRef = React.useRef<State | null>(defaultState || null);
  const timeoutRef = React.useRef<number>();

  function cleanUp() {
    window.clearTimeout(timeoutRef.current);
  }

  function setState(newState: State) {
    frameRef.current = newState;
    cleanUp();

    timeoutRef.current = window.setTimeout(() => {
      frameRef.current = null;
      timeoutRef.current = undefined;
    }, 100);
  }

  function getState() {
    return frameRef.current;
  }

  React.useEffect(() => cleanUp, []);

  return [setState, getState] as const;
}
