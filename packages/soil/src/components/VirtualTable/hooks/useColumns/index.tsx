import * as React from 'react';
import { usePrevious } from '@umijs/hooks';
import { ColumnType } from '../../interface';
import { defineProperty, getColumnKey } from '../utils';

export interface InnerColumn<T> extends Omit<ColumnType<T>, 'dataIndex'> {
  key: string;
  width: number; // * 渲染宽度
  offset: number; // * left / top 偏移量
  minWidth: number; // * 最小渲染宽度
  ellipsis: true;
}

function useColumns<T>(
  origin: ColumnType<T>[],
  offsetWidth: number,
  columnWidth: number | ((index: number) => number),
  minColumnWidth: number,
) {
  const [columns, setColumn] = React.useState<InnerColumn<T>[]>(() =>
    diffColumn(origin, offsetWidth, columnWidth, minColumnWidth),
  );

  const prev = usePrevious({
    prevColumns: columns,
    prevColumnWidth: columnWidth,
    prevOffsetWidth: offsetWidth,
  });
  React.useEffect(() => {
    if (
      prev?.prevColumnWidth === columnWidth &&
      prev?.prevOffsetWidth === offsetWidth &&
      prev!.prevColumns.length > 0 &&
      prev!.prevColumns.length === origin.length
    ) {
      const newColumn = diffColumnWithCached(origin, prev!.prevColumns);
      return setColumn(newColumn);
    }
    setColumn(diffColumn(origin, offsetWidth, columnWidth, minColumnWidth));
  }, [origin, offsetWidth, columnWidth]);

  return [columns, setColumn] as const;
}
const NO_VISIBLE_COLUMNS = [];
function diffColumn<T>(
  origin: ColumnType<T>[],
  offsetWidth: number,
  columnWidth: number | ((index: number) => number),
  minColumnWidth: number,
) {
  if (offsetWidth <= 0) return NO_VISIBLE_COLUMNS;
  let least = 0; // * 均分最小宽度（向下取整）
  let deviation = 0; // * 需要补偿的列数
  if (offsetWidth) {
    const actual = offsetWidth / (origin.length || 1);
    least = Math.floor(actual);
    deviation = offsetWidth - least * origin.length;
  }

  const mergedColumns = origin.reduce<InnerColumn<T>[]>(
    (res, column, index) => {
      let curWidth =
        typeof columnWidth === 'function' ? columnWidth(index) : columnWidth;
      curWidth = minColumnWidth > curWidth ? minColumnWidth : curWidth;
      if (least > curWidth) curWidth = least;

      defineWidth(
        column,
        index,
        curWidth,
        least,
        deviation,
        offsetWidth,
        minColumnWidth,
        origin.length === 1,
      );

      defineProperty(column, 'ellipsis', true);
      defineProperty(column, 'key', getColumnKey(column, String(index)));

      defineProperty(
        column,
        'offset',
        index === 0 ? 0 : res[index - 1].offset + res[index - 1].width,
      );

      if (!column.skipCheckEmpty) {
        if (
          Object.prototype.hasOwnProperty.call(column, 'render') &&
          typeof column.render === 'function'
        ) {
          const { render } = column;
          column.render = function emptyRender(
            ...params: Parameters<NonNullable<typeof column.render>>
          ) {
            const text = params[0];
            if (isEmpty(text)) {
              return '--';
            } else {
              return render.apply(this, params);
            }
          };
        } else {
          column.render = (text: unknown) =>
            isEmpty(text) ? '--' : String(text);
        }
      }

      res.push((column as unknown) as InnerColumn<T>);
      return res;
    },
    [],
  );

  return mergedColumns;
}

function diffColumnWithCached<T>(
  origin: ColumnType<T>[],
  cached: InnerColumn<T>[],
) {
  return origin.map<InnerColumn<T>>((column, index) => {
    defineProperty(column, 'width', cached[index].width);
    defineProperty(column, 'minWidth', cached[index].minWidth);
    defineProperty(column, 'offset', cached[index].offset);
    defineProperty(column, 'key', getColumnKey(column, String(index)));
    defineProperty(column, 'ellipsis', true);

    if (!column.skipCheckEmpty) {
      if (
        Object.prototype.hasOwnProperty.call(column, 'render') &&
        typeof column.render === 'function'
      ) {
        const { render } = column;
        column.render = function emptyRender(
          ...params: Parameters<NonNullable<typeof column.render>>
        ) {
          const text = params[0];
          if (isEmpty(text)) {
            return '--';
          } else {
            return render.apply(this, params);
          }
        };
      } else {
        column.render = (text: unknown) =>
          isEmpty(text) ? '--' : String(text);
      }
    }
    return (column as unknown) as InnerColumn<T>;
  });
}

function isEmpty(v: any) {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') {
    return v.trim() === '' || v.trim() === '<nil>';
  }
  if (typeof v === 'number') {
    return isNaN(v);
  }
  return false;
}

function defineWidth<T>(
  item: ColumnType<T>,
  index: number,
  curWidth: number, // 可视长度
  least: number, // columns铺满innerWidth单列可用最小长度
  deviation: number, // 需要补偿的条数(floor 省略后从前往后补偿)
  offsetWidth: number, // 100%
  minColumnWidth: number,
  special?: boolean, // 对于只有一条数据时特殊处理，添加width为 100%
) {
  if (!special) {
    defineProperty(
      item,
      'width',
      index <= deviation - 1 ? curWidth + 1 : curWidth,
    );
    defineProperty(
      item,
      'minWidth',
      least < minColumnWidth
        ? minColumnWidth
        : index <= deviation - 1
        ? least + 1
        : least,
    );
  } else {
    defineProperty(item, 'width', offsetWidth);
  }
}

export default useColumns;
