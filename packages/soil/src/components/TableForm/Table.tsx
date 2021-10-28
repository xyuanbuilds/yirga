/* eslint-disable no-param-reassign */
import * as React from 'react';
import { Table, Button } from 'antd';
import ResizeObserver from 'rc-resize-observer';
import { observer } from '@formily/reactive-react';
import type { CustomizeScrollBody } from 'rc-table/lib/interface.d';
import type { ColumnType as AntdColumnType } from 'antd/lib/table';
/* List */
import List from '../VirtualList/List';
/* Form */
import ArrayField from '../Form/ArrayField';
import Form from '../Form/Form';
import { useField } from '../Form/context/Field';
import { ROW_ID_KEY } from '../Form/models/ArrayField';
import { isValid } from '../Form/predicate';
import useForm from '../Form/useForm';
/* Enhanced */
import useTableFormColumns from './hooks/useTableFormColumns';
import useSelectableColumns, {
  useSelectable,
  SelectableItemContext,
} from './hooks/useSelectableColumn';
import useIndexColumns from './hooks/useIndexColumn';
import useSortableColumn, {
  SortableContainer,
  SortableRow,
  onSortEnd,
} from './hooks/useSortableColumn';

import type { ArrayField as ArrayFieldInstance } from '../Form/types/Field';
import type { ColumnType } from './type';

// * Test
import TestField from '../Form/TestField';
import TestSelect from '../Form/TestFieldSelect';
import { validator1, validator2 } from './test/validator';

// * 测试实际使用环境
function Test() {
  const [form] = useForm();
  const [rules, setRules] = React.useState(validator1);
  const testColumns: ColumnType<any>[] = [
    {
      dataIndex: 'a',
      title: 'a',
      width: 100,
      component: [TestField],
      valueType: 'string',
      linkages: ['b', 'c'],
      rules,
      linkageReaction: (field, values) => {
        const [b, c] = values;
        field.value = isValid(b) && isValid(c) ? b + c : field.value;
      },
    },
    {
      dataIndex: 'b',
      title: 'b',
      width: 100,
      component: [TestField],
      valueType: 'string',
      rules,
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
      <TableContainer
        initialValues={{
          array: [
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
          ],
        }}
        form={form}
        columns={testColumns}
      />
    </>
  );
}

// * 表单功能添加
function FormContainer({ initialValues, children, form }) {
  return (
    <Form initialValues={initialValues} form={form}>
      <ArrayField>{children}</ArrayField>
    </Form>
  );
}

interface BodyProps<RecordType extends object> {
  columns: ColumnType<RecordType>[];
  dataSource: any;
  size: {
    width: number;
    height: number;
  };
  scrollInfoRef: React.Ref<{ scrollLeft: number }>;
  onScroll?: (info: { scrollLeft: number }) => void;
}

// * 虚拟滚动表体的链接层
const BodyContainer = <RecordType extends object = any>({
  columns,
  dataSource,
  size,
  onScroll,
  scrollInfoRef,
}: BodyProps<RecordType>) => {
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
    <List<RecordType>
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

function TableEnhanced<RecordType extends object = any>({
  size,
  dataSource,
  columns: originColumns,
  selectable,
  sortable,
}: {
  size: { width: number; height: number };
  dataSource: RecordType[];
  columns: ColumnType<RecordType>[];
  selectable: boolean;
  sortable: boolean;
}) {
  // * 3 line index
  const indexedColumns = useIndexColumns(originColumns);

  // * 2 selectable
  const { selectedItems, toggleSelection, isSelected } = useSelectable();
  const options = dataSource.map((i: object) => i[ROW_ID_KEY]) as string[];
  const selectableColumns = useSelectableColumns(
    indexedColumns,
    options,
    selectable,
  );
  // * 1 handler sort
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
        // * rc-table 未添加 symbol 为支持类型
        // @ts-ignore
        rowKey={ROW_ID_KEY}
        dataSource={dataSource}
        columns={(columns as AntdColumnType<any>[]).concat({
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
  form,
  columns,
  initialValues,
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
        <FormContainer initialValues={initialValues} form={form}>
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
