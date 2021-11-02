/* eslint-disable @typescript-eslint/naming-convention */
import * as React from 'react';
import {
  SortableContainer as SC,
  SortableElement,
  SortableHandle,
} from 'react-sortable-hoc';
import { MenuOutlined } from '@ant-design/icons';
import type { ColumnType } from '../type';

import { useConfig } from './useConfig';

export const SORTABlE_COLUMN_WIDTH = 32;

const onSortEnd = (move: (old: number, newIndex: number) => void) => ({
  oldIndex,
  newIndex,
}) => {
  move(oldIndex, newIndex);
};

const DragHandle = SortableHandle(() => (
  <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />
));

// * 默认 div 容器，props 除 SortableContainer 需要的 props，其余传递给 div

const Container = ({
  elementType = 'div',
  wrapperRef,
  ...props
}: {
  elementType?: keyof React.ReactHTML;
  [key: string]: any;
}) => {
  return React.createElement(elementType, { ...props, ref: wrapperRef });
};

const SortableContainer = SC(Container);

// * 默认 div 行容器，props 除 SortableContainer 需要的 props，其余传递给 div
const Row = ({
  elementType = 'div',
  ...props
}: {
  elementType?: keyof React.ReactHTML;
  [key: string]: any;
}) => {
  return React.createElement(elementType, props);
};

const SortableRow = SortableElement(Row);

function useSortableColumn<RecordType extends object = any>(
  columns: ColumnType<RecordType>[],
): ColumnType<RecordType>[] {
  const { sortable } = useConfig();
  if (sortable) {
    const sortableColumn: ColumnType<RecordType>[] = [
      {
        dataIndex: 'array_table_sort',
        width: SORTABlE_COLUMN_WIDTH,
        render: () => <DragHandle />,
      },
    ];

    return sortableColumn.concat(columns);
  }
  return columns;
}

export default useSortableColumn;
export { DragHandle, SortableContainer, SortableRow, onSortEnd };
