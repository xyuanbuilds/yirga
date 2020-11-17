import * as React from 'react';
import classNames from 'classnames';
import styles from './Cell.less';

interface DefaultCellProps<RecordType> {
  style: {
    width: number;
    height: number;
  };
  curColumn: import('./interface').ColumnType<RecordType>;
  record: RecordType;
  data: React.ReactNode;
  className?: string;
  hasScrollBarX?: boolean;
  hasScrollBarY?: boolean;
  rowIndex: number;
  // columnIndex?: number;
}

function Cell<RecordType>({
  style,
  curColumn: { render },
  record,
  data,
  className,
  hasScrollBarX,
  hasScrollBarY,
  rowIndex,
}: DefaultCellProps<RecordType>) {
  const mergedClassName = classNames(
    {
      [styles.noBorderRight]: hasScrollBarY,
    },
    styles.tableCellContainer,
    className,
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

export default Cell;
