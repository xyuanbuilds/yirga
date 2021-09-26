import Form from './Form';
import ArrayField from './ArrayField';
import TestComponent from './TestField';
import List from '../VirtualList/List';

// TODO columns 写法固定
const columns = (extraDependencies) => [
  {
    name: 'test1',
    component: TestComponent,
    render(field) {
      return <ArrayField>{field}</ArrayField>;
    },
    checkDuplicate: true,
  },
  {
    name: 'test2',
    component: TestComponent,
    render(field) {
      return <ArrayField>{field}</ArrayField>;
    },
    dependencies: ['test2', ...extraDependencies],
    checkDuplicate: true,
  },
];

// * 实现一个中间处理组件 根据 component 填充 field
// * 根据 dependencies 设置 reaction
const Test = () => {
  return (
    <Form>
      <List />
    </Form>
  );
};

export default Test;
