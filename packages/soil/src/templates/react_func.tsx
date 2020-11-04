/* eslint-disable import/no-extraneous-dependencies, react/no-unused-state */
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'dva';

// dva store
type Store = {
  model1: {
    state1: number;
  };
};

export interface PropsForTest {
  props1: number;
  props2: string;
}

// ref 结构
export type TestRef = {
  method: () => void;
  state1: number;
};

function Test(props: PropsForTest, ref: React.Ref<TestRef>) {
  const { state1 } = useSelector((state: Store) => state.model1);
  const effectDispatch = useDispatch<Dispatch>();

  const asyncCB = React.useCallback(async () => {
    const res = await effectDispatch({ type: 'some' });
    return res;
  }, []);

  React.useImperativeHandle<TestRef, TestRef>(
    ref,
    () => ({
      method: asyncCB,
      state1,
    }),
    [],
  );

  React.useEffect(() => {}, [props.props1]);

  return <div>11</div>;
}
const WrappedComponent = React.memo(
  React.forwardRef<TestRef, PropsForTest>(Test),
);

export default WrappedComponent;

// type RefType<T> = T extends React.RefObject<any>
//   ? T extends { current: infer R }
//     ? NonNullable<R>
//     : never
//   : never;

// type NoNeedImportRef = RefType<
//   React.ComponentPropsWithRef<typeof WrappedComponent>['ref']
// >;

const Demo = () => {
  const test = React.useRef<React.ElementRef<typeof WrappedComponent>>(null!);

  React.useEffect(() => {
    const { state1 } = test.current;
    test.current.method();
  });
  return <WrappedComponent props2="1" props1={1} ref={test} />;
};

export { Demo };
