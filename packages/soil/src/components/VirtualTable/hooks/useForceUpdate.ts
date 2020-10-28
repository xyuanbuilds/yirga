import * as React from 'react';
// export default function useForceUpdate() {
//   const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
//   return forceUpdate;
// }

// Creates an empty object, but one that doesn't inherent from Object.prototype
const newValue = () => Object.create(null);

export default () => {
  const setState = React.useState(newValue())[1];

  const forceUpdate = React.useRef(() => {
    setState(newValue());
  }).current;

  return forceUpdate;
};
