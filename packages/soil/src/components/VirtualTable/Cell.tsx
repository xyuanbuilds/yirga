import * as React from 'react';
import classNames from 'classnames';
import styles from './Cell.less';

export interface DefaultCellProps<RecordType> {
  style: {
    width: number;
    height: number;
  };
  curColumn: import('./interface').ColumnType<RecordType>;
  record: RecordType;
  data: React.ReactNode;
  hasScrollBarX?: boolean;
  hasScrollBarY?: boolean;
  rowIndex: number;
  columnIndex: number;
  className?: string;
  rowClassName?: (record: RecordType, rowIndex: number) => string;
  colClassName?: (record: RecordType, columnIndex: number) => string;
}

function Cell<RecordType>({
  style,
  curColumn: { render },
  record,
  data,
  hasScrollBarX,
  hasScrollBarY,
  rowIndex,
  columnIndex,
  className,
  rowClassName,
  colClassName,
}: DefaultCellProps<RecordType>) {
  // * 定制 className
  const rowClassNameStr =
    typeof rowClassName === 'function' && rowClassName(record, rowIndex);
  const colClassNameStr =
    typeof colClassName === 'function' && colClassName(record, columnIndex);

  const mergedClassName = classNames(
    {
      [styles.noBorderRight]: hasScrollBarY,
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
      {typeof render === 'function' ? render(data, record, rowIndex) : data}
    </div>
  );
}

export default React.memo(Cell);
