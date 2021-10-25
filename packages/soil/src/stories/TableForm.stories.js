import React from 'react';
import 'antd/es/input-number/style/index';
import TableFromTest from '../components/TableForm/Table';

export default {
  title: 'Example/MyFormTable',
  component: TableFromTest,
};

const Template = (args) => {
  return (
    <div style={args}>
      <TableFromTest />
    </div>
  );
};
export const FormTable = Template.bind({});
FormTable.args = {
  // bordered: false,
  // columns,
  height: 400, // TODO 容器监听
  width: 596, // TODO 容器监听
};
