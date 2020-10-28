import * as React from 'react';
import useForceUpdate from './useForceUpdate';

export type Updater<State> = (prev: State) => State;

/**
 * Execute code before next frame but async
 */
export function useLayoutState<State>(
  defaultState: State,
): [State, (updater: Updater<State>) => void] {
  const stateRef = React.useRef(defaultState);
  const forceUpdate = useForceUpdate();

  const lastPromiseRef = React.useRef<Promise<void>>();
  const updateBatchRef = React.useRef<Updater<State>[]>([]);

  function setFrameState(updater: Updater<State>) {
    updateBatchRef.current.push(updater);

    const promise = Promise.resolve();
    lastPromiseRef.current = promise;

    promise.then(() => {
      if (lastPromiseRef.current === promise) {
        const prevBatch = updateBatchRef.current;
        const prevState = stateRef.current;
        updateBatchRef.current = [];

        prevBatch.forEach((batchUpdater) => {
          stateRef.current = batchUpdater(stateRef.current);
        });

        lastPromiseRef.current = undefined;

        if (prevState !== stateRef.current) {
          forceUpdate();
        }
      }
    });
  }

  React.useEffect(
    () => () => {
      lastPromiseRef.current = undefined;
    },
    [],
  );

  return [stateRef.current, setFrameState];
}
