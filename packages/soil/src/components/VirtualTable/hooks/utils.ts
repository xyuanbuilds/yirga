export function getColumnKey<RecordType>(
  column: import('../interface').ColumnType<RecordType>,
  defaultKey: string,
): React.Key {
  if ('key' in column && column.key !== undefined && column.key !== null) {
    return column.key;
  }
  if (column.dataIndex) {
    return Array.isArray(column.dataIndex)
      ? column.dataIndex.join('.')
      : column.dataIndex;
  }

  return defaultKey;
}

export function getColumnPos(index: number, pos?: string) {
  return pos ? `${pos}-${index}` : `${index}`;
}

export function getRowKey<RecordType>(
  record: RecordType,
  rowKey: ((record: RecordType) => React.Key) | string,
  defaultKey: string,
) {
  if (typeof rowKey === 'function') {
    return rowKey(record);
  }
  return record?.[rowKey] || defaultKey;
}

export function getRowPos(index: number, pos?: string) {
  return pos ? `${pos}-${index}` : `${index}`;
}
