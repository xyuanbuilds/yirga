/* eslint-disable no-param-reassign */
import { createContext, useContext } from 'react';
import { Button } from 'antd';
import { observer } from '@formily/reactive-react';
import List from '../VirtualList/List';
import TestField from './TestField';
import ArrayField from './ArrayField';
import Form from './Form';
import Field from './Field';
import { useField } from './context/Field';
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
  component: [React.FunctionComponent<any>];
  linkages?: string[];
  linkageReaction?: (field: any, value: any) => void;
  deduplicate?: boolean;
}

const testColumns: ColumnProps[] = [
  {
    dataIndex: 'a',
    width: 100,
    component: [TestField],
    valueType: 'string',
    linkages: ['b'],
    linkageReaction: (field, values) => {
      const [one] = values;
      field.value = one;
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
    component: [TestField],
    valueType: 'string',
    deduplicate: true,
  },
];

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
                    defaultValue={dataIndex === 'b' ? 'yyyy' : undefined}
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

const Table = observer(() => {
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

  const formColumns = useTableFormColumns(testColumns, dataSource, operator);
  return <List {...size} columns={formColumns} dataSource={dataSource} />;
});

const TableContainer = () => {
  const arrayField = useField<ArrayFieldInstance>();

  const getDefaultLineData = () =>
    testColumns.reduce((obj, column) => {
      obj[column.dataIndex] = getDefaultValue(column.valueType);
      return obj;
    }, {});

  return (
    <div>
      <div style={{ height: 400, width: 700 }}>
        <Table />
      </div>
      <Button onClick={() => arrayField.push(getDefaultLineData())}>Add</Button>
    </div>
  );
};

function FormContainer({ children }) {
  return (
    <Form>
      <ArrayField defaultValue={[{ a: 'testData', b: 'ssss', c: '' }]}>
        {children}
      </ArrayField>
    </Form>
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
