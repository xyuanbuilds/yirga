import React from 'react';
import Table from '../components/VirtualTable';

export default {
  title: 'Example/MyTable',
  component: Table,
};

const Template = (args) => {
  return (
    <div style={{ height: args.height, width: args.width }}>
      <Table {...args} />
    </div>
  );
};

const columns = Array(100)
  .fill({})
  .map((i, index) => ({ name: `name${index}` }));
const dataSource = Array(1000)
  .fill(null)
  .map((i, lineIndex) => {
    const curData = columns
      .map((column) => column.name)
      .reduce((pre, cur) => {
        pre[cur] = '';
        return pre;
      }, {});
    Object.keys(curData).forEach((key) => {
      curData[key] = lineIndex;
    });
    return curData;
  });

export const Virtualized = Template.bind({});
Virtualized.title = '虚拟滚动';
Virtualized.args = {
  columnWidth: (i) => 100 + i,
  rowHeight: 48,
  height: 488 + 2, // TODO 容器监听
  width: 1000, // TODO 容器监听
  columns,
  dataSource,
};
