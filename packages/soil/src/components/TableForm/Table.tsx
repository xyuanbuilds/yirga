/* eslint-disable no-param-reassign */
import * as React from 'react';
import { Table, Button, Checkbox, Input, Select } from 'antd';
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
import { useForm as useFormInstance } from '../Form/context/Form';
import { ROW_ID_KEY } from '../Form/models/ArrayField';
import { isValid } from '../Form/predicate';
import useForm from '../Form/useForm';
/* Form pre */
import useValidator from './hooks/useValidator';
import useInitialValues from './hooks/useInitialValues';
/* Enhanced */
import useTableFormColumns from './hooks/useTableFormColumns';
import useColWidth from './hooks/useColWidth';
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
      component: [Input],
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
      component: [Input],
      valueType: 'string',
      rules,
    },
    {
      dataIndex: 'cc',
      title: 'cc',
      width: 32,
      fixed: true,
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
      <TableContainer
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
    rowHeight: 48,
    container: {
      width: size.width,
      height: size.height - 87, // TODO 当前减去操作栏与表头
    },
  };

  const form = useFormInstance();

  const { moveUp, moveDown, remove } = useField<ArrayFieldInstance>();

  const listRef = React.useRef<React.ElementRef<typeof List>>(null);
  // TODO 需要优化
  // @ts-ignore
  form.onValidated = listRef.current?.scrollToIndex;

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
  const c = useTableFormColumns(
    columns,
    { remove, moveUp, moveDown },
    { movable: false, deletable: true },
  );

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
    columns,
    children,
    initialValues,
  }: {
    columns: any[];
    initialValues: any[];
    children: (dataSource: any[], operator: Operator) => JSX.Element;
  }) => {
    const form = useFormInstance();
    useInitialValues(initialValues, columns, form);
    useValidator(columns, form);

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
  hasIndex,
  onlyDelete = true,
}: {
  size: { width: number; height: number };
  dataSource: RecordType[];
  columns: ColumnType<RecordType>[];
  selectable: boolean;
  sortable: boolean;
  hasIndex: boolean;
  onlyDelete: boolean;
}) {
  const columnWithWidth = useColWidth(size.width, 8, originColumns, {
    indexCol: hasIndex,
    selectable,
    sortable,
    actionNum: onlyDelete ? 1 : 3,
  });

  // * 3 line index
  const indexedColumns = useIndexColumns(columnWithWidth, hasIndex);

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

function TableContainer<RecordType extends object>({
  form,
  columns,
  initialValues,
  selectable = true,
  sortable = true,
  hasIndex = true,
  onlyDelete = false,
}) {
  const [size, setTableInfo] = React.useState({
    width: 0,
    height: 0,
  });

  const formInitialValues = useInitialValues.getInitialValue(initialValues);

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
        <FormContainer initialValues={formInitialValues} form={form}>
          <LinkComponent initialValues={initialValues} columns={columns}>
            {(dataSource, operator) => {
              return (
                <>
                  <TableEnhanced<RecordType>
                    hasIndex={hasIndex}
                    onlyDelete={onlyDelete}
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
