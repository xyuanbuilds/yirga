/* eslint-disable no-param-reassign */
import * as React from 'react';
import { Table, Button } from 'antd';
import ResizeObserver from 'rc-resize-observer';
import { observer } from '@formily/reactive-react';

import type { CustomizeScrollBody } from 'rc-table/lib/interface.d';

import List from '../VirtualList/List';

import ArrayField from '../Form/ArrayField';
import Form from '../Form/Form';
import { useField } from '../Form/context/Field';
import createForm from '../Form/models/Form';
import { ROW_ID_KEY } from '../Form/models/ArrayField';
import { isValid } from '../Form/predicate';

import TestField from '../Form/TestField';
import TestSelect from '../Form/TestFieldSelect';

import useTableFormColumns from './hooks/useTableFormColumns';
import useSelectableColumns, {
  useSelectable,
  SelectableItemContext,
} from './hooks/useSelectableColumn';
import {
  // DragHandle,
  SortableContainer,
  SortableRow,
  onSortEnd,
} from './hooks/useSortableColumn';
import type { ArrayField as ArrayFieldInstance } from '../Form/types/Field';

const form = createForm();

type ValueType =
  | 'array'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'number'
  | 'object'
  | 'string';

// TODO 标准化组件 columns 类型
interface ColumnProps {
  dataIndex: string;
  title: string;
  valueType: ValueType;
  width?: number;
  component: [React.FunctionComponent<any>, Record<string, any>?];
  linkages?: string[];
  linkageReaction?: (field: any, value: any) => void;
  deduplicate?: boolean;
}

// * 测试实际使用环境
function Test() {
  const testColumns: ColumnProps[] = [
    {
      dataIndex: 'a',
      title: 'a',
      width: 100,
      component: [TestField],
      valueType: 'string',
      linkages: ['b', 'c'],
      linkageReaction: (field, values) => {
        const [b, c] = values;
        field.value = (isValid(b) ? b : '') + (isValid(c) ? c : '');
      },
    },
    {
      dataIndex: 'b',
      title: 'b',
      width: 200,
      component: [TestField],
      valueType: 'string',
    },
    {
      dataIndex: 'c',
      title: 'c',
      width: 200,
      component: [
        TestSelect,
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

  return <TableContainer columns={testColumns} />;
}
// * 测试实际使用环境

function FormContainer({ children }) {
  return (
    <Form form={form}>
      <ArrayField>{children}</ArrayField>
    </Form>
  );
}

interface TableProps {
  columns: ColumnProps[];
  dataSource: any;
  operator: any;
  size: {
    width: number;
    height: number;
  };
  selectable?: boolean;
  onScroll: (info: { scrollLeft: number }) => void;
}
const BodyContainer = React.forwardRef<unknown, TableProps>(
  (
    { columns, dataSource, operator, selectable, size, onScroll }: TableProps,
    ref,
  ) => {
    const listSize = {
      rowHeight: 45,
      container: {
        width: size.width,
        height: size.height - 87, // TODO 当前减去操作栏与表头
      },
    };

    const arrayField = useField<ArrayFieldInstance>();
    const selectableColumn = useSelectableColumns(columns, selectable);
    const c = useTableFormColumns(selectableColumn, operator);

    return (
      <List
        {...listSize}
        renderRow={(props, index, content) => {
          return (
            <SortableRow index={index} {...props}>
              {content}
            </SortableRow>
          );
        }}
        renderContainer={(props, content) => {
          return (
            <SortableContainer
              lockAxis="y"
              onSortEnd={onSortEnd(arrayField.move)}
              {...props}
            >
              {content}
            </SortableContainer>
          );
        }}
        ref={ref}
        onScroll={onScroll}
        columns={c}
        dataSource={dataSource}
      />
    );
  },
);

type Operator = Pick<
  ArrayFieldInstance,
  'push' | 'remove' | 'move' | 'moveDown' | 'moveUp'
>;
type ColumnNeedOperator = Pick<
  ArrayFieldInstance,
  'moveUp' | 'moveDown' | 'remove'
>;

const LinkComponent = observer(
  ({
    children,
  }: {
    children: (dataSource: any[], operator: Operator) => JSX.Element;
  }) => {
    const arrayField = useField<ArrayFieldInstance>();
    const dataSource = Array.isArray(arrayField.value)
      ? arrayField.value.slice()
      : [];

    const { remove, moveUp, moveDown, push, move } = arrayField;
    const operator = {
      remove,
      moveUp,
      moveDown,
      push,
      move,
    };

    return children(dataSource, operator);
  },
);

// TODO 表头高度？
function TableContainer<RecordType extends object>({
  columns,
  selectable = true,
}) {
  const [size, setTableInfo] = React.useState({
    width: 0,
    height: 0,
  });

  const {
    setSelected,
    selectedIndexes,
    toggleSelection,
    isSelected,
  } = useSelectable();

  const renderList = (
    operator: ColumnNeedOperator,
  ): CustomizeScrollBody<RecordType> => (
    rawData: readonly RecordType[],
    { ref, onScroll },
  ) => {
    return (
      <SelectableItemContext.Provider
        value={{
          toggleSelection,
          isSelected,
        }}
      >
        <BodyContainer
          selectable={selectable}
          onScroll={onScroll}
          ref={ref}
          size={size}
          dataSource={rawData}
          operator={operator}
          columns={columns}
        />
      </SelectableItemContext.Provider>
    );
  };

  return (
    <ResizeObserver
      onResize={({ width, height }) => {
        setTableInfo({
          width,
          height,
        });
      }}
    >
      <div style={{ height: '100%', width: '100%' }}>
        <FormContainer>
          <LinkComponent>
            {(dataSource, operator) => {
              return (
                <>
                  <Table<RecordType>
                    rowKey={ROW_ID_KEY}
                    rowSelection={{
                      onChange: setSelected,
                      selectedRowKeys: selectedIndexes,
                      columnWidth: selectable ? 32 : 0,
                    }}
                    dataSource={dataSource}
                    columns={columns.concat({
                      title: '操作',
                      dataIndex: 'sssss',
                      width: 200,
                    })}
                    scroll={{ y: size.height, x: size.width }}
                    pagination={false}
                    components={{
                      body: renderList(operator),
                    }}
                  />
                  <Button
                    onClick={() =>
                      operator.push({
                        a: undefined,
                        b: undefined,
                        c: undefined,
                      })
                    }
                  >
                    增加
                  </Button>
                </>
              );
            }}
          </LinkComponent>
        </FormContainer>
      </div>
    </ResizeObserver>
  );
}

export default Test;
