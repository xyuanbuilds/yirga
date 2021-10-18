/* eslint-disable no-param-reassign */
import { createContext, useContext, useState } from 'react';
import { Button } from 'antd';
import { observer } from '@formily/reactive-react';
import List from '../VirtualList/List';
import TestField from './TestField';
import TestSelect from './TestFieldSelect';
import ArrayField from './ArrayField';
import Form from './Form';
import Field from './Field';
import { useField } from './context/Field';
import createForm from './models/Form';
import { onFormInit, onFieldValueChange } from './models/LifeCycle';

import type { ArrayField as ArrayFieldInstance } from './types/Field';

type ValueType =
  | 'array'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'number'
  | 'object'
  | 'string';
interface ColumnProps {
  dataIndex: string;
  valueType: ValueType;
  width?: number;
  component: [React.FunctionComponent<any>, Record<string, any>?];
  linkages?: string[];
  linkageReaction?: (field: any, value: any) => void;
  deduplicate?: boolean;
}

const size = {
  height: 400, // TODO 容器监听
  width: 700, // TODO 容器监听
  rowHeight: 45,
  container: {
    height: 400,
    width: 700,
  },
};

// const ArrayBaseContext = createContext<IArrayBaseContext>(null);
// ArrayBaseContext.displayName = 'ArrayBaseContext';
// const useArray = () => {
//   return useContext(ArrayBaseContext);
// };

export interface IArrayBaseItemProps {
  index: number;
}
const ItemContext = createContext<IArrayBaseItemProps>(null!);
ItemContext.displayName = 'ArrayItemContext';
const Item = ({ children, index, ...props }) => {
  const field = useField();
  return (
    <ItemContext.Provider value={index}>
      {children({ basePath: field.address.concat(index), ...props })}
    </ItemContext.Provider>
  );
};

export const useIndex = (index?: number) => {
  const ctx = useContext(ItemContext);
  return ctx ? ctx.index : index;
};

const getDefaultValue = (valueType: ValueType, defaultValue?: any) => {
  if (defaultValue !== undefined && defaultValue !== null) return defaultValue;
  if (valueType === 'array') return [];
  if (valueType === 'boolean') return true;
  if (valueType === 'date') return '';
  if (valueType === 'datetime') return '';
  if (valueType === 'number') return 0;
  if (valueType === 'object') return {};
  if (valueType === 'string') return '';
  return null;
};

function useTableFormColumns(
  columns,
  dataSource,
  { remove, moveUp, moveDown },
) {
  return columns
    .reduce(
      (
        buf,
        {
          name,
          dataIndex,
          component,
          linkages,
          linkageReaction,
          deduplicate,
          ...extra
        },
        key,
      ) => {
        return buf.concat({
          ...extra,
          key,
          dataIndex,
          render: (_: any, record: any) => {
            const index = dataSource.indexOf(record);
            const children = (
              <Item index={index}>
                {({ basePath }) => (
                  <Field
                    // !应该 Form initial 最高
                    // defaultValue={dataIndex === 'b' ? 'yyyy' : undefined}
                    component={component}
                    basePath={basePath}
                    name={name || dataIndex}
                    linkages={linkages}
                    linkageReaction={linkageReaction}
                    deduplicate={deduplicate}
                  />
                )}
              </Item>
            );
            return children;
          },
        });
      },
      [],
    )
    .concat({
      key: 'array_action_column',
      dataIndex: 'array_action_column',
      width: 200,
      render: (_: any, record: any) => {
        const index = dataSource.indexOf(record);
        return (
          <>
            {' '}
            <Button onClick={() => moveUp(index)}>向上</Button>
            <Button onClick={() => moveDown(index)}>向下</Button>
            <Button onClick={() => remove(index)}>删除</Button>
          </>
        );
      },
    });
}

interface TableProps {
  columns: ColumnProps[];
}

const Table = observer(({ columns }: TableProps) => {
  const arrayField = useField<ArrayFieldInstance>();
  const dataSource = Array.isArray(arrayField.value)
    ? arrayField.value.slice()
    : [];

  const { remove, moveUp, moveDown } = arrayField;
  const operator = {
    remove,
    moveUp,
    moveDown,
  };

  const formColumns = useTableFormColumns(columns, dataSource, operator);
  return <List {...size} columns={formColumns} dataSource={dataSource} />;
});

const aOptions = [
  { label: 'aaa', value: 'aaa' },
  { label: 'bbb', value: 'bbb' },
  { label: 'ccc', value: 'ccc' },
];
const bOptions = [
  { label: 'aaa1', value: 'aaa1' },
  { label: 'bbb1', value: 'bbb1' },
  { label: 'ccc1', value: 'ccc1' },
];

const TableContainer = () => {
  const arrayField = useField<ArrayFieldInstance>();

  const [options, setOptions] = useState(aOptions);

  const testColumns: ColumnProps[] = [
    {
      dataIndex: 'a',
      width: 100,
      component: [TestField],
      valueType: 'string',
      linkages: ['b', 'c'],
      linkageReaction: (field, values) => {
        const [b, c] = values;
        field.value = b + c ? b + c : field.value;
      },
    },
    {
      dataIndex: 'b',
      width: 200,
      component: [TestField],
      valueType: 'string',
    },
    {
      dataIndex: 'c',
      width: 200,
      component: [TestSelect, { options }],
      valueType: 'string',
      deduplicate: true,
    },
  ];

  const getDefaultLineData = () =>
    testColumns.reduce((obj, column) => {
      obj[column.dataIndex] = getDefaultValue(column.valueType);
      return obj;
    }, {});

  return (
    <div>
      <div style={{ height: 400, width: 700 }}>
        <Table columns={testColumns} />
      </div>
      <Button onClick={() => arrayField.push(getDefaultLineData())}>Add</Button>
      <Button
        onClick={() =>
          setOptions((v) => (v === aOptions ? bOptions : aOptions))
        }
      >
        options change
      </Button>
    </div>
  );
};

const a = [{}, { a: 'testData1', b: 'ssss1', c: '' }];
const b = [{ a: 'testData2', b: 'ssss2', c: '' }];

const form = createForm({
  effects() {
    onFormInit((curForm) => {
      console.log(curForm.values);
    });

    onFieldValueChange('array,0,b', (field) => {
      if (field.value === '777') field.value = '999';
    });
  },
});

function FormContainer({ children }) {
  const [defaultValue, toggle] = useState<any[]>(b);
  const [visible, setVisible] = useState(true);
  return (
    <>
      {visible && (
        <Form form={form}>
          <ArrayField defaultValue={defaultValue}>{children}</ArrayField>
          <Button onClick={() => toggle((v) => (v === a ? b : a))}>
            改变初始值(但不会生效)
          </Button>
        </Form>
      )}

      <Button onClick={() => setVisible((v) => !v)}>
        表单{visible ? '隐藏' : '展示'}
      </Button>
    </>
  );
}

const Test = () => {
  return (
    <FormContainer>
      <TableContainer />
    </FormContainer>
  );
};

export default Test;
