import * as React from 'react';

// 如有可能不被初始化的值，需要置为可选
export interface TestContextProps {
  props1: number;
  props2: string;
}

const TestContext = React.createContext<TestContextProps>(null!);
TestContext.displayName = 'TestContext';

// context 发布
const Wrapper = () => {
  // * 尽量给不常更新或发布处经常 reRender 的 ContextValue 使用 memo https://reactjs.org/docs/context.html#caveats
  const TestContextValue = React.useMemo(
    () => ({
      props1: 1,
      props2: '1',
    }),
    [],
  );
  return (
    <TestContext.Provider value={TestContextValue}>11</TestContext.Provider>
  );
};

// Function 用法
const Demo = () => {
  const { props1, props2 } = React.useContext(TestContext);
  return props1 || props2;
};
// class 用法
// * PropTypes 的用法已经 legacy，使用新的格式 https://reactjs.org/docs/context.html#classcontexttype
class DemoClass extends React.PureComponent {
  static contextType = TestContext;

  declare context: React.ContextType<typeof TestContext>;

  render() {
    const { props2, props1 } = this.context;

    return props1 || props2;
  }
}
// render-props用法
const DemoRenderProps = () => {
  return (
    <TestContext.Consumer>
      {({ props1, props2 }) => props1 || props2}
    </TestContext.Consumer>
  );
};

export { Demo, DemoClass, DemoRenderProps };
