import React from 'react';
import 'antd/es/input-number/style/index';
import { Input, Checkbox, Select, Button } from 'antd';
import ResizableObserver from 'rc-resize-observer';
import TableFrom, { Form } from '../components/TableForm';
import { validator1, validator2 } from './test/validator';

const { useForm } = TableFrom;

function Test() {
  const [form] = useForm();
  const [rules, setRules] = React.useState(validator1);

  const [scroll, setScroll] = React.useState({ x: 0, y: 0 });

  const [onlyDelete, toggleOnlyDelete] = React.useState(false);
  const [selectable, toggleSelectable] = React.useState(true);
  const [sortable, toggleSortable] = React.useState(true);
  const [hasIndex, toggleIndex] = React.useState(true);

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      <div>
        <Button
          onClick={() => {
            toggleSelectable((v) => !v);
          }}
        >
          切换选择列{`(${selectable ? '有' : '无'})`}
        </Button>
        <Button
          onClick={() => {
            toggleSortable((v) => !v);
          }}
        >
          切换排序列{`(${sortable ? '有' : '无'})`}
        </Button>
        <Button
          onClick={() => {
            toggleIndex((v) => !v);
          }}
        >
          切换序号列{`(${hasIndex ? '有' : '无'})`}
        </Button>
        <Button
          onClick={() => {
            toggleOnlyDelete((v) => !v);
          }}
        >
          切换操作栏{`(${onlyDelete ? '只有删除' : '正常'})`}
        </Button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Form form={form}>
          {({ push }) => (
            <>
              <div>
                <Button
                  onClick={() =>
                    setRules((v) =>
                      v === validator2 ? validator1 : validator2,
                    )
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
                <Button
                  onClick={() => {
                    form.removeSelected();
                  }}
                >
                  选中删除
                </Button>
                <Button onClick={() => push({})}>增加</Button>
              </div>
              <ResizableObserver
                onResize={({ width, height }) => {
                  setScroll({
                    x: width,
                    y: height,
                  });
                }}
              >
                <div style={{ flex: 1 }}>
                  <TableFrom
                    scroll={scroll}
                    onlyDelete={onlyDelete}
                    selectable={selectable}
                    hasIndex={hasIndex}
                    sortable={sortable}
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
                </div>
              </ResizableObserver>
            </>
          )}
        </Form>
      </div>
    </div>
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
