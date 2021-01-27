import * as React from 'react';
import classNames from 'classnames';
import { Tooltip } from 'antd';
import getScrollBarSize from './utils/getScrollBarSize';
import styles from './Cell.less';

export interface DefaultCellProps<RecordType> {
  style: {
    width: number;
    height: number;
  };
  curColumn: import('./GridClass').GridColumn<RecordType>;
  curRow: import('./GridClass').GridRow<RecordType>;
  record: RecordType;
  data: React.ReactNode;
  hasScrollBarX?: boolean;
  hasScrollBarY?: boolean;
  rowIndex: number;
  columnIndex: number;
  className?: string;
  bordered?: boolean;
  isScrolling?: boolean;
}

function Cell<RecordType = Record<string, React.ReactNode>>({
  style,
  curColumn,
  curRow,
  record,
  data,
  hasScrollBarX,
  hasScrollBarY,
  rowIndex,
  columnIndex,
  className,
  bordered = true,
  isScrolling = true,
}: DefaultCellProps<RecordType>) {
  const { className: colClassName, render: colRender } = curColumn;
  const { className: rowClassName } = curRow;
  // * 定制 className
  const rowClassNameStr =
    typeof rowClassName === 'function'
      ? rowClassName(record, rowIndex)
      : rowClassName || undefined;
  const colClassNameStr =
    typeof colClassName === 'function'
      ? colClassName(record, columnIndex)
      : colClassName || undefined;

  // * 行样式为最高优先级
  const mergedClassName = classNames(
    {
      [styles.scrolling]: isScrolling,
      [styles.noBorderRight]: hasScrollBarY,
      [styles.noBorderBottom]: hasScrollBarX,
      [styles.noBorder]: !bordered,
    },
    styles.tableCellContainer,
    className,
    colClassNameStr,
    rowClassNameStr,
  );

  const scrollBarSize = getScrollBarSize();
  const content =
    typeof colRender === 'function' ? colRender(data, record, rowIndex) : data;

  return (
    <div
      style={{
        ...style,
        width: hasScrollBarY ? style.width - scrollBarSize : style.width,
        height: hasScrollBarX ? style.height - scrollBarSize : style.height,
      }}
      className={mergedClassName}
    >
      {!isScrolling ? (
        <Tooltip placement="topLeft" mouseEnterDelay={0.3} title={data}>
          {content}
        </Tooltip>
      ) : (
        content
      )}
    </div>
  );
}

export default React.memo(Cell);
