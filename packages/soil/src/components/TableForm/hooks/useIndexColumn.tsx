import styles from './selectable.less';

export const INDEX_COLUMN_WIDTH = 32;

function useIndexColumns(columns: any[]): any[] {
  const indexColumn = [
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

export default useIndexColumns;
