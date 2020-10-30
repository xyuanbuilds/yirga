/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { getColumnKey, getColumnPos } from '../utils';
import FilterDropDown from './DropDown';
import { ColumnType, FiltersProps, FilterType } from '../../interface';

export interface FilterState<RecordType> {
  filter: FilterType<RecordType>;
  key: React.Key;
  filteredKeys?: (string | number | boolean)[] | null;
  forceFiltered?: boolean;
}

const NO_FILTER = [];

const useFilters = <T extends unknown>(params: {
  filters?: FiltersProps<T>;
  columns: ColumnType<T>[];
}) => {
  const { columns, filters } = params;
  const [filterStates, setFilterStates] = React.useState(
    filters ? collectFilterStates(columns, filters, true) : NO_FILTER,
  );

  // columns，filters，操作后验证受控是否存在
  const mergedFilterStates = React.useMemo(() => {
    const collectedStates = filters
      ? collectFilterStates(columns, filters, false)
      : NO_FILTER;
    // Return if not controlled
    if (
      collectedStates.every(({ filteredKeys }) => filteredKeys === undefined)
    ) {
      console.log('?');
      return filterStates;
    }
    return collectedStates;
  }, [columns, filters, filterStates]);

  const triggerFilter = React.useCallback((filterState: FilterState<T>) => {
    if (filterState.filter.filteredValue !== undefined) return; // 受控 不接受更新
    setFilterStates((preFilterStates) => {
      const newFilterStates = preFilterStates.filter(
        ({ key }) => key !== filterState.key,
      );
      newFilterStates.push(filterState);
      return newFilterStates;
    });
    // TODO onchange逻辑
  }, []);

  const FiltersKeyRenderMap = React.useMemo(() => {
    return mergedFilterStates.reduce((kRMap, filter) => {
      console.log('cur filter', filter);
      kRMap[filter.key] = (title) => (
        <FilterDropDown triggerFilter={triggerFilter} filterState={filter}>
          {title}
        </FilterDropDown>
      );
      return kRMap;
    }, {});
  }, [mergedFilterStates]);

  return [mergedFilterStates, FiltersKeyRenderMap] as const;
};

function collectFilterStates<RecordType>(
  columns: ColumnType<RecordType>[],
  filters: FiltersProps<RecordType>,
  init: boolean,
  pos?: string,
): FilterState<RecordType>[] {
  let filterStates: FilterState<RecordType>[] = [];

  (columns || []).forEach((column, index) => {
    const columnPos = getColumnPos(index, pos);

    // TODO 提醒一定要设置唯一的 columnKey
    const filterForCurColumn = column.key && filters[column.key];

    if ('children' in column) {
      filterStates = [
        ...filterStates,
        ...collectFilterStates(column.children || [], filters, init, columnPos),
      ];
    }
    if (filterForCurColumn && 'onFilter' in filterForCurColumn) {
      // * 出现该 key 说明 触发受控，无论是什么值都进入受控逻辑
      if ('filteredValue' in filterForCurColumn) {
        // Controlled
        filterStates.push({
          filter: filterForCurColumn,
          key: getColumnKey(column, columnPos),
          filteredKeys: filterForCurColumn.filteredValue, // 只要不是 undefined，就能够成功受控
          forceFiltered: filterForCurColumn.filtered,
        });
      } else {
        // Uncontrolled
        filterStates.push({
          filter: filterForCurColumn,
          key: getColumnKey(column, columnPos),
          filteredKeys:
            init && filterForCurColumn.defaultFilteredValue
              ? filterForCurColumn.defaultFilteredValue
              : undefined,
          forceFiltered: filterForCurColumn.filtered,
        });
      }
    }
  });

  return filterStates;
}

export function getFilteredData<RecordType>(
  data: RecordType[],
  filterStates: FilterState<RecordType>[],
) {
  return filterStates.reduce((currentData, filterState) => {
    const {
      filter: { onFilter, filters },
      filteredKeys,
    } = filterState;
    if (onFilter && filteredKeys && filteredKeys.length) {
      return currentData.filter((record) =>
        filteredKeys.some((key) => {
          const keys = filters ? filters.map((i) => i.value) : [];
          const keyIndex = keys.findIndex((k) => String(k) === String(key));
          const realKey = keyIndex !== -1 ? keys[keyIndex] : key;
          return onFilter(realKey, record);
        }),
      );
    }
    return currentData;
  }, data);
}

export default useFilters;
