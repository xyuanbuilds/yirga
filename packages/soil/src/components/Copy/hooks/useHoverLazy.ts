/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';

const { useState } = React;

const noop = () => {};

export type Element =
  | ((state: boolean) => React.ReactElement<any>)
  | React.ReactElement<any>;

const useHover = (element: Element): [React.ReactElement<any>, boolean] => {
  const [state, setState] = useState(false);

  const onMouseOver = (originalOnMouseEnter?: any) => (event: any) => {
    (originalOnMouseEnter || noop)(event);
    setState(true);
  };

  if (typeof element === 'function') {
    element = element(state); // eslint-disable-line no-param-reassign
  }

  const el: React.ReactElement = React.cloneElement(element, {
    onMouseOver: onMouseOver(element.props.onMouseEnter),
  });

  return [el, state];
};

export default useHover;
