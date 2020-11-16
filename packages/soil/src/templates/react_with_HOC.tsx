/* eslint-disable import/no-extraneous-dependencies, react/no-unused-state */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { compose } from 'redux';
import { ConnectedProps } from 'react-redux';
import { connect } from 'dva';
import { Form } from '@ant-design/compatible';
import type { FormComponentProps } from '@ant-design/compatible/lib/form/Form.d';

// dva store
type Store = {
  model1: {
    state1: number;
  };
  model2: {
    state2: string;
  };
};

type TestStates = { state1: number };

type PropsNeeded = {
  props1: number;
};

type PropsFromForm = FormComponentProps<PropsNeeded>;

// 不同 props 的获取
type PropsFromDva = ConnectedProps<typeof connector>;

// 组件基础信息
type PropsCanGet = PropsNeeded & PropsFromDva & PropsFromForm;

class Test extends React.PureComponent<PropsCanGet, TestStates> {
  state: TestStates = {
    state1: 1,
  };

  async componentDidMount() {
    await this.props.dispatch({ type: 'test' });
    this.props.form.validateFields();
  }

  method() {
    this.props.form.getFieldsError();
  }
}

export { Test };

// HOCs
const formWrapper = Form.create<FormComponentProps<PropsNeeded>>({
  name: 'flow_edit_form',
});

const mapState = ({ model1 }: Store) => ({ model1 });
const connector = connect(mapState, null, null, {
  forwardRef: true,
});

const WrappedComponent = compose<
  React.ComponentClass<
    PropsNeeded & {
      // wrappedComponentRef: React.ClassAttributes<Test>['ref'];
      wrappedComponentRef: React.Ref<Test>;
    }
  >
>(
  formWrapper,
  connector,
)(Test);

export default WrappedComponent;

// type PropsRef<T> = NonNullable<T> extends React.Ref<infer Instance>
//   ? Instance
//   : never;

// * 仿造 ElementRef 实现 从泛型传递的 props 中获取 ref的类型
type PropsForwardElementRef<
  C extends
    | React.ForwardRefExoticComponent<any>
    | { new (props: any): React.Component<any> }
    | ((props: any, context?: any) => React.ReactElement | null)
    | keyof JSX.IntrinsicElements,
  T
> = T extends keyof React.ComponentPropsWithoutRef<C>
  ? NonNullable<React.ComponentPropsWithoutRef<C>[T]> extends React.Ref<
      infer Instance
    >
    ? Instance
    : never
  : never;

// 使用当前组件的 ref
const Demo = () => {
  const componentRef = React.useRef<
    PropsForwardElementRef<typeof WrappedComponent, 'wrappedComponentRef'>
  >(null!);

  React.useEffect(() => {
    // 可以正常获取所有的 ref 内容
    componentRef.current.props.dispatch({ type: 'test' });
    componentRef.current.props.form.validateFields();
    componentRef.current.props.form.resetFields();
    componentRef.current.method();
    const { state1 } = componentRef.current.state;
  }, []);

  return <WrappedComponent wrappedComponentRef={componentRef} props1={1} />;
};

export { Demo };
