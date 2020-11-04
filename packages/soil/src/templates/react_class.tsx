import * as React from 'react';

interface PropsForTest {
  props1: number | string;
}

interface TestState {
  state1: number;
  state2: string;
}

export default class Test extends React.PureComponent<PropsForTest, TestState> {
  static prototypeVariable = 'variable in cur prototype'; // 静态属性

  private InnerVariable = 'inner value'; // 私有属性

  domRef = React.createRef<HTMLDivElement>(); // domRef

  domStyle?: HTMLDivElement['style']; // 实例属性（默认公有）

  constructor(props: PropsForTest) {
    super(props);

    console.log(this.InnerVariable);
    console.log(Test.prototypeVariable);
  }

  static getDerivedStateFromProps(
    nextProps: PropsForTest,
    prevState: TestState,
  ) {
    if (
      typeof nextProps.props1 === 'number' &&
      nextProps.props1 !== prevState.state1
    ) {
      return { state1: nextProps.props1 };
    }
    return { state2: nextProps.props1 };
  }

  componentDidMount() {
    this.domStyle = this.domRef.current?.style;
    this.domRef.current!.focus(); // 强制不判断 null
  }

  render() {
    return <div ref={this.domRef} />;
  }
}

// 使用当前组件的 ref
const Demo = () => {
  const test = React.useRef<React.ElementRef<typeof Test>>(null!);

  return <Test props1={1} ref={test} />;
};

export { Demo };
