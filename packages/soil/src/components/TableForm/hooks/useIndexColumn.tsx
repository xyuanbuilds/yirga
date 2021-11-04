import type { ColumnType } from '../type';
import { useConfig } from './useConfig';

import styles from './selectable.less';

export const INDEX_COLUMN_WIDTH = 56;

function useIndexColumns<RecordType extends object = any>(
  columns: ColumnType<RecordType>[],
): ColumnType<RecordType>[] {
  const { hasIndex } = useConfig();
  if (hasIndex) {
    const indexColumn: ColumnType<RecordType>[] = [
      {
        key: 'array_table_index',
        title() {
          return '序号';
        },
        className: styles.checkContainer,
        align: 'center',
        dataIndex: 'array_table_index',
        width: INDEX_COLUMN_WIDTH,
        render(_, __, index: number) {
          return index + 1;
        },
      },
    ];
    return indexColumn.concat(columns);
  }

  return columns;
}

export default useIndexColumns;
