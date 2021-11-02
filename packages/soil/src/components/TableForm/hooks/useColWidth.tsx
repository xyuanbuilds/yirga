/* eslint-disable no-param-reassign */
import type { ColumnType } from '../type';

import { INDEX_COLUMN_WIDTH } from './useIndexColumn';
import { SELECTABLE_COLUMN_WIDTH } from './useSelectableColumn';
import { SORTABlE_COLUMN_WIDTH } from './useSortableColumn';

export const ACTION_ITEM_WIDTH = 16;
export const ACTION_DIVIDER_WIDTH = 16;

function useColWidth(
  containerWidth: number,
  scrollbarSize: number,
  columns: ColumnType<any>[],
  {
    indexCol,
    sortable,
    selectable,
    actionNum,
  }: {
    sortable: boolean;
    selectable: boolean;
    actionNum: number;
    indexCol: boolean;
  },
) {
  const actionColWidth =
    ACTION_ITEM_WIDTH * actionNum + ACTION_DIVIDER_WIDTH * (actionNum - 1) + 16;

  const fixedColWidth =
    (sortable ? SORTABlE_COLUMN_WIDTH : 0) +
    (selectable ? SELECTABLE_COLUMN_WIDTH : 0) +
    (indexCol ? INDEX_COLUMN_WIDTH : 0) +
    columns.reduce((res, i) => {
      if (i.fixed && i.width) {
        res += i.width;
      }
      return res;
    }, 0);

  const remainingWidth =
    containerWidth - actionColWidth - fixedColWidth - scrollbarSize;

  const preWeight = columns.find((column) => !column.fixed && column.width)
    ?.width;
  let totalWeight = 0;
  const weightMap = preWeight
    ? columns.reduce<Record<string, number>>((pre, column) => {
        const { dataIndex, width, fixed } = column;

        if (!fixed && width) {
          pre[dataIndex] = width / preWeight;
          totalWeight += pre[dataIndex];
        }

        return pre;
      }, {})
    : null;

  return weightMap
    ? columns.map((column) => {
        if (column.fixed) {
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
