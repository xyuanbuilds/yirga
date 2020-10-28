export type DataIndex = string | number | (string | number)[];

export type ColumnWidth = number | ((index: number) => number);

// 单个 列 描述
export interface ColumnType<RecordType> {
  align?: 'left' | 'middle' | 'right';
  title?:
    | React.ReactNode
    | (({ sortOrder, sortColumn, filters }) => React.ReactNode);
  key?: React.Key; // 列自身key
  dataIndex: DataIndex; // 列 -> 数据映射 key
  children?: ColumnType<RecordType>[]; // TODO 表头分组相关
}

export interface RowType {
  key?: React.Key;
  dataIndex: number; // 行 -> 数据映射 key, 默认就是dataSource中的 index
  // TODO extend相关
  // TODO select相关
  // TODO extra相关 // 独立操作栏 编辑 行拖拽等
}

type FilterValue = string | number | boolean;
// 单个 Filter 描述
export interface FilterType<RecordType> {
  // 筛选项
  filters?: {
    text: React.ReactNode;
    value: FilterValue;
  }[];
  defaultFilteredValue?: FilterValue[]; // 默认筛选项
  onFilter?: (value: FilterValue, record: RecordType) => boolean;
  filterMultiple?: boolean; // 是否是多选模式，默认多选
  filteredValue?: FilterValue[]; // 受控 选择的filterValue
  filtered?: boolean; // 受控强制设置筛选状态
}

type SortOrders = 'descend' | 'ascend' | null | false;
// 单个 Sorter 描述
export interface SorterType<RecordType> {
  sorter?:
    | boolean
    | ((a: RecordType, b: RecordType, sortOrder?: SortOrders) => number);
  defaultSortOrder?: SortOrders;
  // sortOrder?: SortOrders; // 受控
}

export interface FiltersProps<RecordType> {
  [columnKey: string]: FilterType<RecordType>;
}
export interface SortersProps<RecordType> {
  [columnKey: string]: SorterType<RecordType>;
}
