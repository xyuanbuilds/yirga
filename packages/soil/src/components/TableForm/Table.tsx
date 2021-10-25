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
import useIndexColumns from './hooks/useIndexColumn';
import useSortableColumn, {
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
      width: 100,
      component: [TestField],
      valueType: 'string',
    },
    {
      dataIndex: 'c',
      title: 'c',
      width: 100,
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

// * 表单功能添加
function FormContainer({ children }) {
  return (
    <Form form={form}>
      <ArrayField>{children}</ArrayField>
    </Form>
  );
}

interface BodyProps {
  columns: ColumnProps[];
  dataSource: any;
  size: {
    width: number;
    height: number;
  };
  scrollInfoRef: React.Ref<{ scrollLeft: number }>;
  onScroll?: (info: { scrollLeft: number }) => void;
}

// * 虚拟滚动表体的链接层
const BodyContainer = ({
  columns,
  dataSource,
  size,
  onScroll,
  scrollInfoRef,
}: BodyProps) => {
  const listSize = {
    rowHeight: 45,
    container: {
      width: size.width,
      height: size.height - 87, // TODO 当前减去操作栏与表头
    },
  };

  const { moveUp, moveDown, remove } = useField<ArrayFieldInstance>();

  const listRef = React.useRef<React.ElementRef<typeof List>>(null);

  const obj = {} as { scrollLeft: number };
  Object.defineProperty(obj, 'scrollLeft', {
    get: () => null,
    set: (scrollLeft: number) => {
      if (listRef.current) {
        listRef.current.scrollTo({ scrollLeft });
      }
    },
  });
  if (
    scrollInfoRef !== null &&
    typeof scrollInfoRef === 'object' &&
    'current' in scrollInfoRef
  ) {
    (scrollInfoRef as {
      current: { scrollLeft: number };
    }).current = obj;
  }

  const arrayField = useField<ArrayFieldInstance>();
  const c = useTableFormColumns(columns, { remove, moveUp, moveDown });

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
            useDragHandle // 需要整行拖动，则为false
            onSortEnd={onSortEnd(arrayField.move)}
            {...props}
          >
            {content}
          </SortableContainer>
        );
      }}
      ref={listRef}
      onScroll={onScroll}
      columns={c}
      dataSource={dataSource}
    />
  );
};

// * 表单 与 表格的链接层
type Operator = Pick<
  ArrayFieldInstance,
  'push' | 'remove' | 'move' | 'moveDown' | 'moveUp'
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

function TableEnhanced<RecordType extends object>({
  size,
  dataSource,
  columns: originColumns,
  selectable,
  sortable,
}) {
  const { selectedItems, toggleSelection, isSelected } = useSelectable();

  const indexedColumns = useIndexColumns(originColumns);
  const selectableColumns = useSelectableColumns(
    indexedColumns,
    dataSource.map((i) => i[ROW_ID_KEY]),
    selectable,
  );
  const columns = useSortableColumn(selectableColumns, sortable);

  const renderList: CustomizeScrollBody<RecordType> = (
    rawData: readonly RecordType[],
    { ref, onScroll },
  ) => {
    return (
      <BodyContainer
        onScroll={({ scrollLeft }) => onScroll({ scrollLeft })}
        scrollInfoRef={ref}
        size={size}
        dataSource={rawData}
        columns={columns}
      />
    );
  };

  return (
    <SelectableItemContext.Provider
      value={{
        toggleSelection,
        isSelected,
        selectedItems,
      }}
    >
      <Table<RecordType>
        tableLayout="fixed"
        rowKey={ROW_ID_KEY}
        dataSource={dataSource}
        columns={columns.concat({
          title: '操作',
          dataIndex: 'sssss',
        })}
        scroll={{ y: size.height, x: size.width }}
        pagination={false}
        components={{
          body: renderList,
        }}
      />
    </SelectableItemContext.Provider>
  );
}

// TODO 表头高度？
function TableContainer<RecordType extends object>({
  columns,
  selectable = true,
  sortable = true,
}) {
  const [size, setTableInfo] = React.useState({
    width: 0,
    height: 0,
  });

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
                  <TableEnhanced<RecordType>
                    size={size}
                    selectable={selectable}
                    sortable={sortable}
                    dataSource={dataSource}
                    columns={columns}
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
