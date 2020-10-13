import React from 'react';
import { Select, Input, Checkbox } from 'antd';
import Table from '../components/EditableTable';

export default {
  title: 'Example/EditableTable',
  component: Table,
};

const Template = (args) => {
  return (
    <div style={{ height: 500, width: '100%' }}>
      <Table {...args} />
    </div>
  );
};
const columns = [
  {
    title: '序号',
    width: 30,
    dataIndex: 'index',
  },
  {
    title: '字段名',
    // width: 200,
    dataIndex: 'field',
    checkDuplicate: true,
    // forCheckDuplicate: fields,
    renderForm: () => <Input placeholder="请输入字段名" />,
    skipCheckEmpty: true,
  },
  {
    title: '类型',
    dataIndex: 'type',
    required: true,
    renderForm: () => (
      <Select
        getPopupContainer={() => {
          // @ts-ignore
          return document.body;
        }}
        placeholder="请选择字段类型"
      >
        {[1, 2, 3].map((d) => (
          <Select.Option value={d} key={d}>
            {d}
          </Select.Option>
        ))}
      </Select>
    ),
    skipCheckEmpty: true,
  },
  {
    title: '字段注释',
    dataIndex: 'fieldNotes',
    renderForm: () => <Input placeholder="请输入字段注释" />,
    skipCheckEmpty: true,
  },
  {
    title: '主键',
    dataIndex: 'mainKey',
    width: 100,
    valuePropName: 'checked',
    renderForm: () => <Checkbox>主键</Checkbox>,
    skipCheckEmpty: true,
  },
];

export const Editable = Template.bind({});
Editable.args = {
  columns,
  height: 500,
};
