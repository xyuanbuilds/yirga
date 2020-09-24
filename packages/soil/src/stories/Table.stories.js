import React from 'react';
import Table from '../components/Table/ResizableTable';

export default {
  title: 'Example/Table',
  component: Table,
};

const Template = (args) => <Table {...args} />;

export const Virtualized = Template.bind({});
Virtualized.args = {
  virtualized: true,
};
export const Resizable = Template.bind({});
Resizable.args = {
  resizable: true,
};
export const All = Template.bind({});
All.args = {
  virtualized: true,
  resizable: true,
  fixed: true,
};
