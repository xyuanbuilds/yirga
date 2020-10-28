import { useRef, useEffect } from 'react';

function useTimeoutLock<State>(
  defaultState?: State,
): [(state: State) => void, () => State | null] {
  const frameRef = useRef<State | null>(defaultState || null);
  const timeoutRef = useRef<number>();

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

  useEffect(() => cleanUp, []);

  return [setState, getState];
}

export default useTimeoutLock;
