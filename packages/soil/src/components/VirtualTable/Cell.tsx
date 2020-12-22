import * as React from 'react';
import classNames from 'classnames';
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
      [styles.noBorderRight]: hasScrollBarY,
      [styles.noBorderBottom]: hasScrollBarX,
      [styles.noBorder]: !bordered,
    },
    styles.tableCellContainer,
    className,
    colClassNameStr,
    rowClassNameStr,
  );

  return (
    <div
      style={{
        ...style,
        width: hasScrollBarY ? style.width - 8 : style.width,
        height: hasScrollBarX ? style.height - 8 : style.height,
      }}
      className={mergedClassName}
    >
      {typeof colRender === 'function'
        ? colRender(data, record, rowIndex)
        : data}
    </div>
  );
}

export default React.memo(Cell);
