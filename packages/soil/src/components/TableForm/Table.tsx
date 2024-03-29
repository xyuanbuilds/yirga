/* eslint-disable no-param-reassign */
import * as React from 'react';
import { Table } from 'antd';
import ResizeObserver from 'rc-resize-observer';
import { observer } from '@formily/reactive-react';
import type { CustomizeScrollBody } from 'rc-table/lib/interface.d';
import type { ColumnType as AntdColumnType } from 'antd/lib/table';
/* List */
import List from '../VirtualList/List';
/* Form */
import { useField } from '../Form/context/Field';
import { useForm as useFormInstance } from '../Form/context/Form';
import { ROW_ID_KEY } from '../Form/models/ArrayField';
import { createCustomLifeCycle } from '../Form/models/LifeCycle';

import ConfigProvider from './hooks/useConfig';
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
import type { Form as TableForm } from '../Form/types/Form';
import type { ColumnType } from './type';

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
      height: size.height - 32, // TODO 当前减去操作栏与表头
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
    columns,
    children,
    initialValues,
  }: {
    columns?: any[];
    initialValues?: Record<string, any>[];
    children: (dataSource: any[], operator: Operator) => JSX.Element;
  }) => {
    const form = useFormInstance();

    const formInitialValues = React.useMemo(
      () => useInitialValues.getInitialValue(initialValues),
      [initialValues],
    );

    React.useEffect(() => {
      form.setInitialValues(formInitialValues);
    }, [form, formInitialValues]);

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
}: {
  size: { width: number; height: number };
  dataSource: RecordType[];
  columns?: ColumnType<RecordType>[];
}) {
  const columnWithWidth = useColWidth(size.width, 8, originColumns);
  const form = useFormInstance();
  // * 3 line index
  const indexedColumns = useIndexColumns(columnWithWidth);

  // * 2 selectable
  const { selectedItems, toggleSelection, isSelected } = useSelectable();
  const options = dataSource.map((i: object) => i[ROW_ID_KEY]) as string[];
  const selectableColumns = useSelectableColumns(indexedColumns, options);

  React.useEffect(() => {
    const lines = selectedItems.map((selected) => {
      return options.findIndex((i) => i === selected);
    });
    form.addEffects('table_selected', () => {
      createCustomLifeCycle('removeSelected', () => {
        lines
          .sort((a, b) => b - a)
          .forEach((line) => {
            (form.fields.array as ArrayFieldInstance).remove(line);
          });
      });
    });
  }, [selectedItems, form, options]);

  // * 1 handler sort
  const columns = useSortableColumn(selectableColumns);

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

export interface TableFormProps<RecordType extends object> {
  form?: TableForm;
  columns?: ColumnType<RecordType>[];
  /** 表格表单初始值 `{ dataIndex: value }[]` */
  initialValues?: Record<string, any>[];
  /** 是否拥有选择列 */
  selectable?: boolean;
  /** 是否拥有排序列 */
  sortable?: boolean;
  /** 是否拥有序号列 */
  hasIndex?: boolean;
  /** 是否只有删除操作 */
  onlyDelete?: boolean;
  /** 表格所占宽高 */
  scroll?: {
    x?: number;
    y?: number;
  };
}

function TableContainer<RecordType extends object>({
  columns,
  initialValues,
  selectable,
  sortable,
  hasIndex,
  onlyDelete,
  scroll,
}: TableFormProps<RecordType>) {
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
      <div style={{ height: scroll?.y, width: '100%' }}>
        <LinkComponent initialValues={initialValues} columns={columns}>
          {(dataSource) => {
            return (
              <ConfigProvider
                selectable={selectable}
                sortable={sortable}
                hasIndex={hasIndex}
                onlyDelete={onlyDelete}
              >
                <TableEnhanced<RecordType>
                  size={size}
                  dataSource={dataSource}
                  columns={columns}
                />
              </ConfigProvider>
            );
          }}
        </LinkComponent>
      </div>
    </ResizeObserver>
  );
}

export default TableContainer;
