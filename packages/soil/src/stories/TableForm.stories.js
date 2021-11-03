import React from 'react';
import 'antd/es/input-number/style/index';
import { Input, Checkbox, Select, Button } from 'antd';
import TableFrom, { Form } from '../components/TableForm';
import { validator1, validator2 } from './test/validator';

const { useForm } = TableFrom;

function Test() {
  const [form] = useForm();
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
        if (b !== undefined && c !== undefined) {
          field.value = b + c;
        }
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
      align: 'center',
      width: 56,
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
      deduplicate: '相同了, 请重命名',
    },
  ];

  return (
    <Form form={form}>
      {({ push }) => (
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
          <Button onClick={() => push({})}>增加</Button>
          <TableFrom
            scroll={{ y: 500 }}
            // onlyDelete
            initialValues={[
              { a: 'aaa', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'xxxx', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'bbbb', b: 'cccc' },
              { a: 'aaa', b: 'cccc' },
            ]}
            form={form}
            columns={testColumns}
          />
        </>
      )}
    </Form>
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
