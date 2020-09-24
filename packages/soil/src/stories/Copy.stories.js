import React from 'react';
import Grid from '../components/Copy/Grid';

export default {
  title: 'Example/Grid',
  component: Grid,
};

const Template = (args) => {
  return (
    <div style={{ height: 300, width: 300 }}>
      <Grid {...args} />
    </div>
  );
};

const columns = Array(100)
  .fill({})
  .map((i, index) => ({ name: `name${index}` }));
const dataSource = Array(100).fill(
  columns
    .map((i) => i.name)
    .reduce((pre, cur) => {
      pre[cur] = '1111';
      return pre;
    }, {}),
);

export const Virtualized = Template.bind({});
Virtualized.args = {
  columnWidth: (index) => index + 100,
  rowHeight: 48,
  height: 300, // TODO 容器监听
  width: 300, // TODO 容器监听
  columns,
  dataSource,
};
