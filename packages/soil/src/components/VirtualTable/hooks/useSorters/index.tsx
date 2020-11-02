import * as React from 'react';
import { getColumnKey, getColumnPos } from '../utils';
import Sorter, { ASCEND } from './Sorter';
import {
  ColumnType,
  SortersProps,
  SorterType,
  SortOrder,
} from '../../interface';

export interface SortState<RecordType> {
  sorter: SorterType<RecordType>;
  key: React.Key;
  sortOrder: SortOrder | undefined;
  multiplePriority: number | false;
}

const NO_SORTER = [];

const useSorters = <T extends unknown>(params: {
  sorters?: SortersProps<T>;
  columns: ColumnType<T>[];
}) => {
  const { sorters, columns } = params;
  const [sortStates, setSortStates] = React.useState<SortState<T>[]>(
    sorters
      ? validateStates(collectSortStates(columns, sorters, true))
      : NO_SORTER,
  );

  const mergedSortStates = React.useMemo(() => {
    const collectedStates = sorters
      ? collectSortStates(columns, sorters, false)
      : NO_SORTER;
    // Return if not controlled
    if (collectedStates.every(({ sortOrder }) => sortOrder === undefined)) {
      return sortStates;
    }

    return validateStates(collectedStates);
  }, [sorters, columns, sortStates]);

  const triggerSorter = React.useCallback((sortState: SortState<T>) => {
    if (sortState.sorter.sortOrder !== undefined) return;
    const isMultipleMode = sortState.multiplePriority !== false;
    setSortStates((preSortStates) => {
      let newSortStates: SortState<T>[];
      if (!isMultipleMode || !sortStates.length) {
        // 单排
        newSortStates = [
          ...preSortStates.filter((preState) => {
            preState.sortOrder = null;
            return preState.key !== sortState.key;
          }),
          sortState,
        ];
      } else {
        // 多排
        newSortStates = [
          ...preSortStates.filter((preState) => {
            if (preState.multiplePriority === false) {
              preState.sortOrder = null;
            }
            return preState.key !== sortState.key;
          }),
          sortState,
        ];
      }

      // TODO onChange
      return newSortStates;
    });
  }, []);

  const sortersKeyRenderMap = React.useMemo(() => {
    return mergedSortStates.reduce((kRMap, sorter) => {
      kRMap[sorter.key] = (title) => (
        <Sorter
          title={title}
          triggerSorter={triggerSorter}
          sorterState={sorter}
        />
      );
      return kRMap;
    }, {});
  }, [mergedSortStates]);

  return [sortStates, sortersKeyRenderMap] as const;
};

function collectSortStates<RecordType>(
  columns: ColumnType<RecordType>[],
  sorters: SortersProps<RecordType>,
  init: boolean,
  pos?: string,
): SortState<RecordType>[] {
  let sorterStates: SortState<RecordType>[] = [];

  (columns || []).forEach((column, index) => {
    const columnPos = getColumnPos(index, pos);

    const sorterForCurColumn = column.key && sorters[column.key];

    if ('children' in column) {
      sorterStates = [
        ...sorterStates,
        ...collectSortStates(column.children || [], sorters, init, columnPos),
      ];
    }
    if (sorterForCurColumn) {
      if ('sortOrder' in sorterForCurColumn) {
        // Controlled
        sorterStates.push({
          sorter: sorterForCurColumn,
          key: getColumnKey(column, columnPos),
          sortOrder: sorterForCurColumn.sortOrder, // ! 受控下维持 sortOrder 正确性
          multiplePriority: getMultiplePriority(sorterForCurColumn),
        });
      } else {
        // Default sorter
        sorterStates.push({
          sorter: sorterForCurColumn,
          key: getColumnKey(column, columnPos),
          sortOrder:
            init && sorterForCurColumn.defaultSortOrder
              ? sorterForCurColumn.defaultSortOrder
              : undefined,
          multiplePriority: getMultiplePriority(sorterForCurColumn),
        });
      }
    }
  });

  return sorterStates;
}

export function getSortData<RecordType>(
  data: RecordType[],
  sortStates: SortState<RecordType>[],
): RecordType[] {
  const innerSorterStates = sortStates
    .slice()
    .sort(
      (a, b) => (b.multiplePriority as number) - (a.multiplePriority as number),
    );

  const cloneData = data.slice();

  const runningSorters = innerSorterStates.filter(
    ({ sorter: { sorter }, sortOrder }) => {
      return getSortFunction(sorter) && sortOrder;
    },
  );

  // Skip if no sorter needed
  if (!runningSorters.length) {
    return cloneData;
  }

  return cloneData.sort((record1, record2) => {
    for (let i = 0; i < runningSorters.length; i += 1) {
      const sorterState = runningSorters[i];
      const {
        sorter: { sorter },
        sortOrder,
      } = sorterState;

      const compareFn = getSortFunction(sorter);

      if (compareFn && sortOrder) {
        const compareResult = compareFn(record1, record2, sortOrder);

        if (compareResult !== 0) {
          return sortOrder === ASCEND ? compareResult : -compareResult;
        }
      }
    }

    return 0;
  });
}

function validateStates<T>(collectedStates: SortState<T>[]) {
  const newSortStates: SortState<T>[] = [];
  let isMultipleMode = false;
  let isSorted = false;

  collectedStates.sort((a, b) => {
    if (a.multiplePriority === false || b.multiplePriority === false) {
      return a.multiplePriority === false ? -1 : 1;
    }
    return a.multiplePriority - b.multiplePriority;
  });
  collectedStates.forEach((sortState) => {
    if (sortState.sortOrder) {
      if (sortState.multiplePriority !== false) {
        isMultipleMode = true;
        newSortStates.push({
          ...sortState,
          sortOrder: isSorted ? null : sortState.sortOrder,
        });
      } else {
        newSortStates.push({
          ...sortState,
          sortOrder: isSorted || isMultipleMode ? null : sortState.sortOrder,
        });
        isSorted = true;
      }
    } else {
      newSortStates.push({
        ...sortState,
        sortOrder: null,
      });
    }
  });
  return newSortStates;
}

function getSortFunction<RecordType>(sorter: SorterType<RecordType>['sorter']) {
  if (typeof sorter === 'function') {
    return sorter;
  }
  if (sorter && typeof sorter === 'object' && sorter.compare) {
    return sorter.compare;
  }
  return false;
}

function getMultiplePriority<RecordType>(
  sorter: SorterType<RecordType>,
): number | false {
  if (
    typeof sorter.sorter === 'object' &&
    typeof sorter.sorter.multiple === 'number'
  ) {
    return sorter.sorter.multiple;
  }
  return false;
}

export default useSorters;
