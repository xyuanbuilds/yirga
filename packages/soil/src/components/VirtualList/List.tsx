/* eslint-disable no-param-reassign, react-hooks/exhaustive-deps */
import * as React from 'react';
import { pipe } from 'fp-ts/function';
import { cancelTimeout, requestTimeout } from './timer';
import type { ListProps } from './type';

import styles from './style/selectable.less';

const max = (l: number) => (r: number) => Math.max(l, r);
const min = (l: number) => (r: number) => Math.min(l, r);

// TODO Row 更多内容补充
function Row({ style, index, items, record, render }) {
  return render ? render({ style }, index, items, record) : items;
}

const DEFAULT_OUT_OF_VIEW_ITEM_NUM = 1;

type ScrollInfo = {
  scrollLeft: number;
  scrollTop: number;
};

type GridBasicInfo = {
  containerHeight: number;
  containerWidth: number;
  rowCount: number;
  rowHeight: number | ((index: number) => number);
};
type RowData = { size: number; offset: number };
type CacheData = Record<string, RowData>;
type MeasuredData = {
  /* 已被测量过 row 信息 y 最大值 */
  lastMeasuredRowIndex: number;
};
const MEASURED_ROW_HEIGHT = 40;

interface ListRef {
  scrollTo: ({ scrollLeft, scrollTop }: Partial<ScrollInfo>) => void;
}

// TODO onWheel 优化
function List<RecordType extends object = any>(
  props: ListProps<RecordType>,
  wrapper: React.ForwardedRef<ListRef>,
): React.ReactElement {
  // TODO 省略columns 中的冗余信息，让columns只在 width 或 dataIndex 变化时，才导致当前组件刷新
  const {
    container,
    columns,
    dataSource,
    rowHeight,
    renderRow,
    renderContainer,
    onScroll: onScrollCallback,
  } = props;

  const wrapperDom = React.useRef<HTMLElement>(null);
  React.useImperativeHandle(wrapper, () => ({
    scrollTo,
  }));

  const cacheRef = React.useRef<Record<string, RowData>>({
    '-1': {
      size: 0,
      offset: 0,
    },
  });
  const cacheData = cacheRef.current;
  const measuredRef = React.useRef<MeasuredData>({
    lastMeasuredRowIndex: -1,
  });
  const measuredData = measuredRef.current;

  const columnCount = columns.length;
  const rowCount = dataSource.length;
  const contentWidth = React.useMemo(() => {
    return columns.reduce((res, cur) => res + cur.width, 0);
  }, [columns]);
  const lastMeasuredRow = cacheData[measuredData.lastMeasuredRowIndex];
  const contentHeight =
    lastMeasuredRow.offset +
    lastMeasuredRow.size +
    (dataSource.length - measuredData.lastMeasuredRowIndex - 1) *
      MEASURED_ROW_HEIGHT;

  // TODO scrolling cached
  const [_, setScrolling] = React.useState(false);
  const [scrollInfo, setScroll] = React.useState<ScrollInfo>({
    scrollLeft: 0,
    scrollTop: 0,
  });
  React.useLayoutEffect(() => {
    if (typeof onScrollCallback === 'function') onScrollCallback(scrollInfo);
  }, [scrollInfo, onScrollCallback]);

  const timer = React.useRef<null | {
    id: number;
  }>(null);
  // console.log('scrolling', isScrolling);

  function resetStyleCache() {
    if (timer.current !== null) {
      cancelTimeout(timer.current);
    }
    timer.current = requestTimeout(scrollReset, 150);
  }
  function scrollReset() {
    setScrolling(false);
    // TODO reset scroll cache
  }
  React.useEffect(() => {
    resetStyleCache();
  }, [scrollInfo]);

  function onScroll(e: React.UIEvent<HTMLDivElement, UIEvent>) {
    const {
      clientHeight,
      clientWidth,
      scrollLeft,
      scrollTop,
      scrollHeight,
      scrollWidth,
    } = e.currentTarget;

    setScroll((prev) => {
      if (scrollLeft === prev.scrollLeft && scrollTop === prev.scrollTop)
        return prev;

      setScrolling(true);
      const nextLeft = pipe(scrollWidth - clientWidth, min(scrollLeft), max(0));
      const nextTop = pipe(scrollHeight - clientHeight, min(scrollTop), max(0));

      return {
        scrollTop: nextTop,
        scrollLeft: nextLeft,
      };
    });
  }

  function scrollTo({ scrollLeft, scrollTop }: Partial<ScrollInfo>) {
    if (wrapperDom.current) {
      wrapperDom.current.scrollLeft = scrollLeft || scrollInfo.scrollLeft;
      wrapperDom.current.scrollTop = scrollTop || scrollInfo.scrollTop;
    }
  }

  function getVerticalRange(): [
    renderStartIndex: number,
    renderStopIndex: number,
    visibleStartIndex: number,
    visibleStopIndex: number,
  ] {
    if (columnCount === 0 || rowCount === 0) {
      return [0, 0, 0, 0];
    }
    const basicInfo = {
      rowHeight,
      rowCount,
      containerHeight: container.height,
      containerWidth: container.width,
    };
    const startIndex = getRowStartIndex(
      basicInfo,
      cacheData,
      measuredData,
      scrollInfo.scrollTop,
    );

    const stopIndex = getRowStopIndex(
      basicInfo,
      cacheData,
      measuredData,
      startIndex,
      scrollInfo.scrollTop,
    );

    return [
      pipe(startIndex - DEFAULT_OUT_OF_VIEW_ITEM_NUM, max(0)),
      pipe(stopIndex + DEFAULT_OUT_OF_VIEW_ITEM_NUM, min(rowCount - 1), max(0)),
      startIndex,
      stopIndex,
    ];
  }

  const [rowStartIndex, rowStopIndex] = getVerticalRange();

  const rows: React.ReactElement[] = [];
  if (columnCount > 0 && rowCount) {
    for (let y = rowStartIndex; y <= rowStopIndex && y < rowCount; y += 1) {
      const rowItems: React.ReactNode[] = [];
      const curRecord = dataSource[y];

      const rowStyle = {
        height: rowHeight,
        width: contentWidth,
        top: 0,
        left: 0,
        position: 'absolute',
      };
      for (let x = 0, left = 0; x < columnCount; x += 1) {
        const curColumn = columns[x];
        const { size, offset } = getItemMetadata(
          { rowHeight },
          y,
          cacheData,
          measuredData,
        );
        const { render } = curColumn;
        const cellData = getCellData(curRecord, curColumn.dataIndex);
        rowStyle.top = offset;
        rowItems.push(
          <div
            className={styles.cell}
            style={{
              position: 'absolute',
              left,
              top: renderRow ? 0 : offset,
              width: curColumn.width,
              height: size,
            }}
            key={`${x}_${y}_cell`}
          >
            {render ? render(cellData, curRecord, y) : cellData}
          </div>,
        );

        left += curColumn.width;
      }

      rows.push(
        <Row
          index={y}
          style={rowStyle}
          render={renderRow}
          key={`${y}_row`}
          record={curRecord}
          items={rowItems}
        />,
      );
    }
  }

  const content = (
    <div
      style={{
        height: contentHeight,
        width: contentWidth,
        position: 'relative',
      }}
    >
      {rows}
    </div>
  );

  const containerStyle: React.CSSProperties = {
    // pointerEvents: _ ? 'none' : undefined,
    ...container,
    overflow: 'auto',
  };

  return typeof renderContainer === 'function' ? (
    renderContainer(
      {
        wrapperRef: wrapperDom,
        onScroll,
        style: containerStyle,
      },
      content,
    )
  ) : (
    <div
      id="table_container"
      ref={(wrapperDom as React.ForwardedRef<HTMLDivElement>) || null}
      onScroll={onScroll}
      // className={wrapperClassName}
      style={containerStyle}
    >
      {content}
    </div>
  );
}

function getRowStartIndex(
  gridBasicInfo: GridBasicInfo,
  cachedData: CacheData,
  measuredData: MeasuredData,
  scrollTop: number,
) {
  return findNearestRow(gridBasicInfo, cachedData, measuredData, scrollTop);
}
function getRowStopIndex(
  gridBasicInfo: GridBasicInfo,
  cachedData: CacheData,
  measuredData: MeasuredData,
  startIndex: number,
  scrollTop: number,
): number {
  const { rowCount, containerHeight } = gridBasicInfo;

  const itemMetadata = getItemMetadata(
    gridBasicInfo,
    startIndex,
    cachedData,
    measuredData,
  );
  const maxOffset = scrollTop + containerHeight;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < rowCount - 1 && offset < maxOffset) {
    offset += getItemMetadata(
      gridBasicInfo,
      stopIndex,
      cachedData,
      measuredData,
    ).size;
    stopIndex += 1;
  }

  return stopIndex;
}
function findNearestRow(
  gridBasicInfo: GridBasicInfo,
  cachedData: CacheData,
  measuredData: MeasuredData,
  scrollTop: number,
) {
  const { lastMeasuredRowIndex } = measuredData;
  const lastMeasuredItemOffset =
    lastMeasuredRowIndex > 0 ? cachedData[lastMeasuredRowIndex].offset : 0;

  if (lastMeasuredItemOffset >= scrollTop) {
    return findNearestItemBinarySearch(
      gridBasicInfo,
      cachedData,
      measuredData,
      lastMeasuredRowIndex, // 下界
      0, // 上界
      scrollTop,
    );
  }
  return findNearestItemExponentialSearch(
    gridBasicInfo,
    cachedData,
    measuredData,
    Math.max(0, lastMeasuredRowIndex),
    scrollTop,
  );
}
function findNearestItemBinarySearch(
  gridBasicInfo: GridBasicInfo,
  cacheData: CacheData,
  measuredData: MeasuredData,
  high: number,
  low: number,
  scrollTop: number,
): number {
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const currentOffset = getItemMetadata(
      gridBasicInfo,
      middle,
      cacheData,
      measuredData,
    ).offset;

    if (currentOffset === scrollTop) {
      return middle;
    }
    if (currentOffset < scrollTop) {
      low = middle + 1;
    } else if (currentOffset > scrollTop) {
      high = middle - 1;
    }
  }

  if (low > 0) {
    return low - 1;
  }
  return 0;
}

function findNearestItemExponentialSearch(
  gridBasicInfo: GridBasicInfo,
  cacheData: CacheData,
  measuredData: MeasuredData,
  index: number,
  offset: number,
) {
  const itemCount = gridBasicInfo.rowCount;
  let bound = 1;

  while (
    index < itemCount &&
    getItemMetadata(gridBasicInfo, index, cacheData, measuredData).offset <
      offset
  ) {
    index += bound;
    bound *= 2;
  }

  return findNearestItemBinarySearch(
    gridBasicInfo,
    cacheData,
    measuredData,
    Math.min(index, itemCount - 1), // hight
    Math.floor(index / 2), // low
    offset,
  );
}

function getItemMetadata(
  { rowHeight = 48 }: Pick<GridBasicInfo, 'rowHeight'>,
  index: number,
  cacheData: CacheData,
  measuredData: MeasuredData,
): RowData {
  const { lastMeasuredRowIndex } = measuredData;

  // * 当前属于未 记录 过的metaData内容，需要记录作为缓存
  if (index > lastMeasuredRowIndex) {
    let offset = 0;
    if (lastMeasuredRowIndex >= 0) {
      const itemMetadata = cacheData[lastMeasuredRowIndex];
      offset = itemMetadata.offset + itemMetadata.size;
    }

    for (let i = lastMeasuredRowIndex + 1; i <= index; i += 1) {
      const size = getNumInfo(i, rowHeight);
      cacheData[i] = {
        offset,
        size,
      };
      offset += size;
    }
    // mutateMeasured
    measuredData.lastMeasuredRowIndex = index;
  }
  return cacheData[index];
}

function getCellData<T extends object>(
  curRecord: T,
  dataIndex?: number | string | (number | string)[],
) {
  if (Array.isArray(dataIndex)) {
    return dataIndex.reduce((res, cur) => res[cur], curRecord);
  }
  if (!dataIndex && typeof dataIndex !== 'number') {
    return curRecord;
  }
  return curRecord[dataIndex];
}

function getNumInfo(
  index: number,
  numOrFunc: number | ((index: number) => number),
) {
  if (typeof numOrFunc === 'function') return numOrFunc(index);
  return numOrFunc;
}

export default React.forwardRef(List) as <RecordType extends object = any>(
  props: ListProps<RecordType> & { ref?: React.ForwardedRef<ListRef> },
) => ReturnType<typeof List>;
