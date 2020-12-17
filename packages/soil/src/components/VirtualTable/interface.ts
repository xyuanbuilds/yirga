/* ---------- Basic ---------- */
export type DataIndex = string | number | (string | number)[];

export type ColumnWidth = number | ((index: number) => number);

export interface ColumnType<RecordType> {
  align?: 'left' | 'right' | 'center' | undefined;
  title?:
    | React.ReactNode
    | (({ sortOrder, sortColumn, filters }) => React.ReactNode); // TODO
  key?: React.Key; // 列自身key
  dataIndex?: DataIndex; // 列 -> 数据映射 key
  children?: ColumnType<RecordType>[]; // TODO 表头分组相关
  skipCheckEmpty?: boolean;
  render?: (
    value: unknown,
    record: RecordType,
    index: number,
  ) => React.ReactNode;
  className?: (record: RecordType, index: number) => string;
}

export interface RowType {
  key?: React.Key;
  dataIndex: number; // 行 -> 数据映射 key, 默认就是dataSource中的 index
  // TODO extend相关
  // TODO select相关
  // TODO extra相关 // 独立操作栏 编辑 行拖拽等
}

/* ---------- Filter ---------- */
type FilterValue = string | number | boolean;
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
  filtered?: boolean; // 强制设置筛选状态
}

/* ---------- Sorter ---------- */
export type SortOrder = 'descend' | 'ascend' | null; // 降序，升序,空
type SorterCompareFn<RecordType> = (
  a: RecordType,
  b: RecordType,
  sortOrder?: SortOrder,
) => number;
type SorterWithMultiple<RecordType> = {
  compare: SorterCompareFn<RecordType>;
  multiple: number;
};
export interface SorterType<RecordType> {
  key: React.Key;
  sorter?:
    | boolean
    | SorterWithMultiple<RecordType>
    | SorterCompareFn<RecordType>;
  defaultSortOrder?: SortOrder;
  // multiple?: number | false;
  sortOrder?: SortOrder; // 受控 外部控制 sort状态
}

/* ---------- Props ---------- */
export interface FiltersProps<RecordType> {
  [columnKey: string]: FilterType<RecordType>;
}
export interface SortersProps<RecordType> {
  [columnKey: string]: SorterType<RecordType>;
}

/* ---------- Inner ---------- */
export interface ColumnRawData {
  minWidth: number;
  width: number;
}

export interface ColumnDiffedData extends ColumnRawData {
  offset: number;
}
