import React from 'react';
import List from '../components/VirtualList/List';

export default {
  title: 'Example/MyTable',
  component: List,
};

const columns = [
  {
    dataIndex: 'a',
    width: 100,
  },
  {
    dataIndex: 'b',
    width: 100,
  },
  {
    dataIndex: 'c',
    width: 100,
  },
];
const Template = (args) => {
  return (
    <div style={{ height: 200, width: 300 }}>
      <List {...args} />
    </div>
  );
};
export const Virtualized1 = Template.bind({});
Virtualized1.args = {
  // bordered: false,
  columns,
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  rowHeight: (i) => 15 + i,
  container: {
    height: 200,
    width: 300,
  },
  dataSource: Array(100)
    .fill(1)
    .map((_, index) => ({ a: index, b: index, c: index })),
};
