import React from 'react';

export type DataIndex = React.Key | React.Key[];

export type ColumnWidth = number | ((columIndex: number) => number);

// TODO more info column
// * 后续实现
export interface ColumnType<RecordType> {
  align?: 'left' | 'right' | 'center' | undefined;
  title?: React.ReactNode;
  key?: React.Key;
  dataIndex?: DataIndex; // 列 -> 数据映射 可提供key
  children?: ColumnType<RecordType>[]; // TODO 表头分组相关
  skipCheckEmpty?: boolean;
  render?: (
    value: unknown,
    record: RecordType,
    index: number,
  ) => React.ReactNode;
  className?: (record: RecordType, index: number) => string;
  width?: number; // * 渲染宽度
  minWidth?: number; // * 最小渲染宽度
  ellipsis?: boolean;
}
export interface ColumnPos {
  key: React.Key;
  width: number;
  minWidth: number;
}

// * 实现虚拟滚动的 column 只需要 width 和 dataIndex
export interface ListColumnType<RecordType> extends ColumnType<RecordType> {
  width: number;
  dataIndex: DataIndex;
}

export interface ListProps<RecordType> {
  container: {
    height: number;
    width: number;
  };
  dataSource: RecordType[];
  columns: ListColumnType<RecordType>[];
  rowCount?: number; // 默认 dataSource.length
  rowHeight: number | ((index: number) => number);
  // columnWidth?: number | ((index: number) => number); // 不需要提供 columnWidth，而是 columns 自带width
  onScroll?: (scroll: { scrollLeft: number; scrollTop: number }) => void;
  // style?: React.CSSProperties;
  // className?: string;
  // rowClassName?: string | ((record: RecordType, index: number) => string);
  // bordered?: boolean;
  renderRow?: (
    style: { left: number; top: number },
    index: number,
    items: React.ReactNode | React.ReactNodeArray,
    record: RecordType,
  ) => React.ReactElement;
  renderContainer?: (
    props: {
      style: React.CSSProperties;
      wrapperRef?: React.ForwardedRef<HTMLElement>;
      onScroll(e: React.UIEvent<HTMLDivElement, UIEvent>): void;
    },
    content: React.ReactNode | React.ReactNodeArray,
  ) => React.ReactElement;
}
