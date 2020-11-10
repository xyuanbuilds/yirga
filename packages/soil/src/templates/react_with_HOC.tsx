/* eslint-disable import/no-extraneous-dependencies, react/no-unused-state */
import * as React from 'react';
import { compose } from 'redux';
import { ConnectedProps } from 'react-redux';
import { connect } from 'dva';
import { Form } from '@ant-design/compatible';

// dva store
type Store = {
  model1: {
    state1: number;
  };
};

// HOC
const connector = connect(
  ({ model1 }: Store) => ({
    model1,
  }),
  null,
  null,
  { forwardRef: true },
);
const formWrapper = Form.create({
  name: 'flow_edit_form',
});

// 不同 props 的获取
type PropsFromForm = import('@ant-design/compatible/lib/form').FormComponentProps;
type PropsFromDva = ConnectedProps<typeof connector>;
type PropsNeeded = {
  props1: number;
};

// 组件基础信息
type PropsCanGet = PropsNeeded & PropsFromDva & PropsFromForm;
type TestStates = { state1: number };

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

const WrappedComponent = compose<
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<PropsNeeded> & React.RefAttributes<Test>
  >
>(
  connector,
  formWrapper,
)(Test);

export default WrappedComponent;

// 使用当前组件的 ref
const Demo = () => {
  const componentRef = React.useRef<React.ElementRef<typeof WrappedComponent>>(
    null!,
  );
  React.useEffect(() => {
    // 可以正常获取所有的 ref 内容
    componentRef.current.props.dispatch({ type: 'test' });
    componentRef.current.props.form.validateFields();
    componentRef.current.method();
    const { state1 } = componentRef.current.state;
    console.log(state1);
  }, []);
  return <WrappedComponent ref={componentRef} props1={1} />;
};

export { Demo };
