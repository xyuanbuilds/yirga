import React from 'react';
import 'antd/es/input-number/style/index';
import { Input, Checkbox, Select, Button } from 'antd';
import TableFrom from '../components/TableForm';
import { validator1, validator2 } from './test/validator';

function Test() {
  const [form] = TableFrom.useForm();
  const [rules, setRules] = React.useState(validator1);
  const testColumns = [
    {
      dataIndex: 'a',
      title: 'a',
      width: 100,
      component: [Input],
      valueType: 'string',
      linkages: ['b', 'c'],
      rules,
      linkageReaction: (field, values) => {
        const [b, c] = values;
        field.value = b !== undefined && c !== undefined ? b + c : field.value;
      },
    },
    {
      dataIndex: 'b',
      title: 'b',
      width: 100,
      component: [Input],
      valueType: 'string',
      rules,
    },
    {
      dataIndex: 'cc',
      title: 'cc',
      width: 32,
      keep: true,
      component: [Checkbox],
      valueType: 'boolean',
    },
    {
      dataIndex: 'c',
      title: 'c',
      width: 100,
      component: [
        Select,
        {
          options: [
            { label: 'aaa', value: 'aaa' },
            { label: 'bbb', value: 'bbb' },
            { label: 'ccc', value: 'ccc' },
          ],
        },
      ],
      valueType: 'string',
      deduplicate: true,
    },
  ];

  return (
    <>
      <Button
        onClick={() =>
          setRules((v) => (v === validator2 ? validator1 : validator2))
        }
      >
        切换validator
      </Button>
      <Button
        onClick={async () => {
          const res = await form.getFieldsValue();
          console.log(res);
        }}
      >
        获得
      </Button>
      <Button
        onClick={() => {
          form.reset();
        }}
      >
        重置
      </Button>
      <Button
        onClick={async () => {
          const res = await form.validateFields();
          console.log(res);
        }}
      >
        验证
      </Button>
      <TableFrom
        onlyDelete
        initialValues={[
          { a: 'aaa', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: 'aaa', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: 'aaa', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: 'aaa', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: 'aaa', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: 'aaa', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: 'aaa', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: 'aaa', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
          { a: '1111', b: 'cccc' },
        ]}
        form={form}
        columns={testColumns}
      />
    </>
  );
}

export default {
  title: 'Example/MyFormTable',
  component: TableFrom,
};

const Template = (args) => {
  return (
    <div style={args}>
      <Test />
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
