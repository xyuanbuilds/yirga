/* eslint-disable @typescript-eslint/naming-convention */
import * as React from 'react';
import {
  SortableContainer as SC,
  SortableElement,
  SortableHandle,
} from 'react-sortable-hoc';
import { MenuOutlined } from '@ant-design/icons';

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

export { DragHandle, SortableContainer, SortableRow, onSortEnd };
