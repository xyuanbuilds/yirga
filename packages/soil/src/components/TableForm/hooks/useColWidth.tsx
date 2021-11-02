/* eslint-disable no-param-reassign */
import type { ColumnType } from '../type';

import { useConfig } from './useConfig';
import { INDEX_COLUMN_WIDTH } from './useIndexColumn';
import { SELECTABLE_COLUMN_WIDTH } from './useSelectableColumn';
import { SORTABlE_COLUMN_WIDTH } from './useSortableColumn';

export const ACTION_ITEM_WIDTH = 16;
export const ACTION_DIVIDER_WIDTH = 16;

function useColWidth(
  containerWidth: number,
  scrollbarSize: number,
  originColumns: ColumnType<any>[] | undefined,
) {
  const columns = Array.isArray(originColumns) ? originColumns : [];
  const { sortable, selectable, hasIndex, onlyDelete } = useConfig();
  const actionNum = onlyDelete ? 1 : 3;
  const actionColWidth = onlyDelete
    ? 60
    : ACTION_ITEM_WIDTH * actionNum +
      ACTION_DIVIDER_WIDTH * (actionNum - 1) +
      16;

  const fixedColWidth =
    (sortable ? SORTABlE_COLUMN_WIDTH : 0) +
    (selectable ? SELECTABLE_COLUMN_WIDTH : 0) +
    (hasIndex ? INDEX_COLUMN_WIDTH : 0) +
    columns.reduce((res, i) => {
      if (i.keep && i.width) {
        res += i.width;
      }
      return res;
    }, 0);

  const remainingWidth =
    containerWidth - actionColWidth - fixedColWidth - scrollbarSize;

  const preWeight = columns.find((column) => !column.keep && column.width)
    ?.width;
  let totalWeight = 0;
  const weightMap = preWeight
    ? columns.reduce<Record<string, number>>((pre, column) => {
        const { dataIndex, width, keep } = column;

        if (!keep && width) {
          pre[dataIndex] = width / preWeight;
          totalWeight += pre[dataIndex];
        }

        return pre;
      }, {})
    : null;

  return weightMap
    ? columns.map((column) => {
        if (column.keep) {
          return column;
        }
        return {
          ...column,
          width: remainingWidth * (weightMap[column.dataIndex] / totalWeight),
        };
      })
    : columns;
}

export default useColWidth;
