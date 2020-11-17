import * as React from 'react';
import { ColumnType } from '../../interface';
import { defineProperty, getColumnKey } from '../utils';

export interface InnerColumn<T> extends ColumnType<T> {
  key: string;
  width: number; // 渲染宽度
  offset: number; // left / top 偏移量
  minWidth: number;
  ellipsis: true;
}

const INITIAL_WIDTH = 120;
const INITIAL_MIN_WIDTH = 45;

function useColumns<T>(origin: ColumnType<T>[], offsetWidth, columnWidth) {
  const [columns, setColumn] = React.useState<InnerColumn<T>[]>(
    diffColumn(origin, offsetWidth, columnWidth),
  );

  React.useEffect(() => {
    setColumn(diffColumn(origin, offsetWidth, columnWidth));
  }, [origin, offsetWidth, columnWidth]);

  return [columns, setColumn] as const;
}

function diffColumn<T>(origin: ColumnType<T>[], offsetWidth, columnWidth) {
  let least = 0; // * 均分最小宽度（向下取整）
  let deviation = 0; // * 需要补偿的列数
  if (offsetWidth) {
    // const innerWidth = offsetWidth - 1; // innerWidth需减1，该1为border
    const actual = offsetWidth / (origin.length || 1);
    least = Math.floor(actual);
    deviation = offsetWidth - least * origin.length;
  }
  const mergedColumns = origin.map<InnerColumn<T>>((column, index) => {
    let curWidth =
      typeof columnWidth === 'function' ? columnWidth(index) : columnWidth; // * 初始宽度 120
    curWidth = least > INITIAL_WIDTH ? least : INITIAL_WIDTH;

    defineWidth(column, index, curWidth, least, deviation, origin.length === 1);

    defineProperty(column, 'ellipsis', true);
    defineProperty(column, 'key', getColumnKey(column, String(index)));

    defineProperty(
      column,
      'offset',
      index === 0
        ? 0
        : (origin[index - 1] as InnerColumn<T>).offset +
            (origin[index - 1] as InnerColumn<T>).width,
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

    return column as InnerColumn<T>;
  });

  return mergedColumns;
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

function defineWidth(
  item,
  index,
  curWidth: number, // 可视长度
  least: number, // columns铺满innerWidth单列可用最小长度
  deviation: number, // 需要补偿的条数(floor 省略后从前往后补偿)
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
      least < INITIAL_MIN_WIDTH
        ? INITIAL_MIN_WIDTH
        : index <= deviation - 1
        ? least + 1
        : least,
    );
  } else {
    defineProperty(item, 'width', '100%');
  }
}

export default useColumns;
