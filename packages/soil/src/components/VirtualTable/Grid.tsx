/* eslint-disable no-param-reassign, import/no-extraneous-dependencies */
import memoizeOne from 'memoize-one';
import * as React from 'react';
import { useCallback } from 'react';
import usePrevious from './hooks/usePrevious';
import Cell from './Cell';

const DEFAULT_OUT_OF_VIEW_ITEM_NUM = 1;

// * 内部 type
// * 构建网格的最基本信息
type GridBasicInfo = {
  containerHeight: number;
  containerWidth: number;
  columnCount: number;
  rowCount: number;
  rowHeight?: number | ((index: number) => number);
  columnWidth?: number | ((index: number) => number);
};
type ScrollInfo = { scrollLeft: number; scrollTop: number };
type ColumnMetaData = {
  itemType: 'col';
  offset: number;
  size: number;
};
type RowMetaData = {
  itemType: 'row';
  offset: number;
  size: number;
};

interface GridColumn {
  key: string;
  minWidth: number; // 最小宽度，拖拽不可低于最小宽
  // width: number; // 由 columnWidth 计算获得暂不可传递
}
// type GridRow = {
//   key: string;
// };

export interface GridProps<T = Record<string, unknown>> {
  container: React.RefObject<HTMLDivElement>;
  dataSource: T[];
  columns: GridColumn[];
  columnCount?: number;
  rowCount?: number;
  rowHeight?: number | ((index: number) => number);
  columnWidth?: number | ((index: number) => number);
  containerHeight: number;
  containerWidth: number;
  onScroll?: (scroll: ScrollInfo) => void;
  style?: React.CSSProperties;
  className?: string;
  syncScrollLeft?: ({ scrollLeft: number, currentTarget: HTMLElement }) => void;
  // rows?: GridRow[];
}
export interface GridRef {
  scrollTo: (scroll: Partial<ScrollInfo>) => void;
  measuredInfos: {
    lastMeasuredRowIndex: number;
    lastMeasuredColumnIndex: number;
  };
}

function Grid<T = Record<string, unknown>>(
  props: GridProps<T>,
  ref: React.Ref<GridRef>,
) {
  const {
    dataSource: data,
    columns,
    columnWidth,
    rowHeight,
    containerHeight,
    containerWidth,
    onScroll,
    style: bodyStyle,
    className: wrapperClassName,
    syncScrollLeft,
  } = props;
  React.useEffect(() => {
    console.error('props change');
  }, [props]);
  const rowCount = data.length || props.rowCount || 0;
  const columnCount = columns.length || props.columnCount || 0;
  /* --------- Dom ---------- */
  const wrapper = React.useRef<HTMLDivElement>(null!);
  /* ----- Render State ----- */
  const [gridScroll, setScroll] = React.useState<ScrollInfo>({
    scrollLeft: 0,
    scrollTop: 0,
  });
  /* -------- Cache --------- */
  const metaDataMap = React.useRef<{
    rowMetadataMap: {
      [index: number]: RowMetaData;
    };
    columnMetadataMap: {
      [index: number]: ColumnMetaData;
    };
  }>({
    rowMetadataMap: {},
    columnMetadataMap: {},
  });
  const measuredInfos = React.useRef({
    lastMeasuredColumnIndex: -1,
    lastMeasuredRowIndex: -1,
  });
  const scrollRef = React.useRef({
    scrollTop: 0,
    scrollLeft: 0,
  });
  const callOnScroll = React.useRef(
    memoizeOne((scrollLeft: number, scrollTop: number) => {
      if (onScroll) {
        onScroll({
          scrollLeft,
          scrollTop,
        });
      }
    }),
  );
  React.useEffect(() => {
    scrollRef.current = gridScroll;
    wrapper.current.scrollLeft = Math.max(0, gridScroll.scrollLeft);
    wrapper.current.scrollTop = Math.max(0, gridScroll.scrollTop);
    syncScroll({
      scrollLeft: wrapper.current.scrollLeft,
      currentTarget: wrapper.current,
    });
    callOnScroll.current(gridScroll.scrollLeft, gridScroll.scrollTop);
  }, [gridScroll]);

  const onReset = () => {
    measuredInfos.current.lastMeasuredColumnIndex = -1;
    measuredInfos.current.lastMeasuredRowIndex = -1;
    setScroll({
      scrollLeft: 0,
      scrollTop: 0,
    });
  };

  function syncScroll(
    scrollInfo: Partial<ScrollInfo> & { currentTarget: HTMLElement },
  ) {
    const { currentTarget } = scrollInfo;
    if (syncScrollLeft) {
      syncScrollLeft({
        scrollLeft: scrollInfo.scrollLeft,
        currentTarget,
      });
    }
  }

  const scrollTo = useCallback(
    ({ scrollLeft, scrollTop }: Partial<ScrollInfo>) => {
      setScroll((prev) => {
        if (scrollLeft !== undefined) {
          scrollLeft = Math.max(0, scrollLeft);
        }
        if (scrollTop !== undefined) {
          scrollTop = Math.max(0, scrollTop);
        }
        if (scrollLeft === undefined) {
          scrollLeft = prev.scrollLeft;
        }
        if (scrollTop === undefined) {
          scrollTop = prev.scrollTop;
        }

        if (scrollLeft === prev.scrollLeft && scrollTop === prev.scrollTop)
          return prev;

        return {
          scrollTop,
          scrollLeft,
        };
      });
    },
    [],
  );

  // const isWheeling = React.useRef(false);
  const _onScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      const {
        clientHeight,
        clientWidth,
        scrollLeft,
        scrollTop,
        scrollHeight,
        scrollWidth,
      } = event.currentTarget;
      setScroll((prev) => {
        if (scrollLeft === prev.scrollLeft && scrollTop === prev.scrollTop)
          return prev;
        const actualLeft = Math.max(
          0,
          Math.min(scrollLeft, scrollWidth - clientWidth),
        );
        const actualTop = Math.max(
          0,
          Math.min(scrollTop, scrollHeight - clientHeight),
        );
        return {
          scrollTop: actualTop,
          scrollLeft: actualLeft,
        };
      });
    },
    [],
  );

  const frameBatch = React.useRef({
    frameId: NaN,
    x: 0,
    y: 0,
  });
  const _onWheel = useCallback((event: WheelEvent) => {
    const { deltaX, deltaY } = event;
    event.preventDefault();

    const batch = frameBatch.current;

    cancelAnimationFrame(batch.frameId);
    batch.x += deltaX;
    batch.y += deltaY;

    batch.frameId = requestAnimationFrame(() => {
      if (wrapper.current) {
        scrollTo({
          scrollLeft: (wrapper.current.scrollLeft += frameBatch.current.x),
          scrollTop: (wrapper.current.scrollTop += frameBatch.current.y),
        });
        syncScroll({
          scrollLeft: wrapper.current.scrollLeft,
          currentTarget: wrapper.current,
        });
      }
      frameBatch.current.x = 0;
      frameBatch.current.y = 0;
    });
  }, []);
  React.useLayoutEffect(() => {
    if (wrapper.current) {
      wrapper.current.scrollLeft = Math.max(0, gridScroll.scrollLeft);
      wrapper.current.scrollTop = Math.max(0, gridScroll.scrollTop);
      wrapper.current.addEventListener('wheel', _onWheel, {
        passive: false,
      });
    }
    return wrapper.current.addEventListener('wheel', _onWheel, {
      passive: false,
    });
  }, []);

  // *具体某处变化，外部重置measured
  // * 具体某一 column 或 具体某一 row 的形变
  // TODO 这里需要外部做 measured 的具体变化，可能有更好的方式
  React.useLayoutEffect(() => {
    scrollTo(scrollRef.current);
  }, [columnWidth, rowHeight]);

  // *数量结构变化，直接重置
  const prevCount = usePrevious({
    columnCount,
    rowCount,
  });
  React.useLayoutEffect(() => {
    console.log('layout  change');
    if (
      prevCount !== undefined &&
      (prevCount.columnCount !== columnCount || prevCount.rowCount !== rowCount)
    ) {
      onReset();
    }
  }, [columnCount, rowCount, containerHeight, containerWidth]);

  React.useImperativeHandle(
    ref,
    () => ({
      scrollTo,
      measuredInfos: measuredInfos.current,
    }),
    [],
  );

  function getVerticalRange(scroll: ScrollInfo) {
    if (columnCount === 0 || rowCount === 0) {
      return [0, 0, 0, 0];
    }
    const startIndex = getRowStartIndex(
      {
        columnWidth,
        rowHeight,
        columnCount,
        rowCount,
        containerHeight,
        containerWidth,
      },
      metaDataMap.current,
      measuredInfos.current,
      scroll.scrollTop,
    );

    const stopIndex = getRowStopIndex(
      {
        columnWidth,
        rowHeight,
        columnCount,
        rowCount,
        containerHeight,
        containerWidth,
      },
      metaDataMap.current,
      measuredInfos.current,
      startIndex,
      scroll.scrollTop,
    );

    // Over scan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    // const overScanCount = 1;
    return [
      Math.max(0, startIndex - DEFAULT_OUT_OF_VIEW_ITEM_NUM),
      Math.max(
        0,
        Math.min(rowCount - 1, stopIndex + DEFAULT_OUT_OF_VIEW_ITEM_NUM),
      ),
      startIndex,
      stopIndex,
    ];
  }

  function getHorizontalRange(scroll: ScrollInfo) {
    if (columnCount === 0 || rowCount === 0) {
      return [0, 0, 0, 0];
    }
    const startIndex = getColStartIndex(
      {
        columnWidth,
        rowHeight,
        columnCount,
        rowCount,
        containerHeight,
        containerWidth,
      },
      metaDataMap.current,
      measuredInfos.current,
      scroll.scrollLeft,
    );

    const stopIndex = getColStopIndex(
      {
        columnWidth,
        rowHeight,
        columnCount,
        rowCount,
        containerHeight,
        containerWidth,
      },
      metaDataMap.current,
      measuredInfos.current,
      startIndex,
      scroll.scrollLeft,
    );

    // Over scan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    // const overScanCount = 1;
    return [
      Math.max(0, startIndex - DEFAULT_OUT_OF_VIEW_ITEM_NUM),
      Math.max(
        0,
        Math.min(columnCount - 1, stopIndex + DEFAULT_OUT_OF_VIEW_ITEM_NUM),
      ),
      startIndex,
      stopIndex,
    ];
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const getItemStyleCache = React.useRef(
    memoizeOne((_: typeof columnWidth, __: typeof rowHeight) => ({})),
  );
  /* eslint-disable @typescript-eslint/no-unused-vars */
  function getItemStyle(rowIndex: number, columnIndex: number) {
    const itemStyleCache = getItemStyleCache.current(columnWidth, rowHeight);
    const key = `${rowIndex}:${columnIndex}`;

    if (itemStyleCache.hasOwnProperty(key)) {
      return itemStyleCache[key];
    }
    const curRow = getItemMetadata(
      'row',
      {
        columnWidth,
        rowHeight,
        containerHeight,
        containerWidth,
        columnCount,
        rowCount,
      },
      rowIndex,
      metaDataMap.current,
      measuredInfos.current,
    );
    const curCol = getItemMetadata(
      'col',
      {
        columnWidth,
        rowHeight,
        containerHeight,
        containerWidth,
        columnCount,
        rowCount,
      },
      columnIndex,
      metaDataMap.current,
      measuredInfos.current,
    );
    itemStyleCache[key] = {
      position: 'absolute',
      left: curCol.offset,
      top: curRow.offset,
      height: curRow.size,
      width: curCol.size,
    };
    return itemStyleCache[key];
  }
  const [rowStartIndex, rowStopIndex] = getVerticalRange(gridScroll);
  const [colStartIndex, colStopIndex] = getHorizontalRange(gridScroll);
  let items = [] as React.ReactElement[];
  if (columnCount > 0 && rowCount && rowStopIndex >= 0 && colStopIndex >= 0) {
    for (
      let rowIndex = rowStartIndex;
      rowIndex <= rowStopIndex && rowIndex <= data.length - 1;
      rowIndex++
    ) {
      for (
        let columnIndex = colStartIndex;
        columnIndex <= colStopIndex && columnIndex <= columns.length - 1;
        columnIndex++
      ) {
        items.push(
          // TODO Cell 外部注入
          React.createElement(Cell, {
            /** 内部使用 */
            rowIndex,
            columnIndex,
            key: getDefaultCellKey(columnIndex, rowIndex),
            style: getItemStyle(rowIndex, columnIndex),
            /** 外部传递 */
            curColumn: columns[columnIndex],
            record: data[rowIndex],
            data: data[rowIndex][columns[columnIndex].key],
          }),
        );
      }
    }
  }

  const contentHeight = getEstimatedTotalHeight(
    rowCount,
    metaDataMap.current.rowMetadataMap,
    measuredInfos.current,
  );
  const contentWidth = getEstimatedTotalWidth(
    columnCount,
    metaDataMap.current.columnMetadataMap,
    measuredInfos.current,
  );

  const isScrollBarY =
    containerHeight < contentHeight && contentWidth <= containerWidth;

  const isScrollBarX =
    containerWidth < contentWidth && contentHeight <= containerHeight;

  if (isScrollBarY) {
    items = items.map((item, index) => {
      if ((index % columnCount) - columnCount === -1) {
        return React.cloneElement(item, {
          hasScrollBarY: true,
        });
      }
      return item;
    });
  }
  if (isScrollBarX) {
    items = items.map((item, index) => {
      if (
        index >=
        (colStopIndex - colStartIndex + 1) * (rowStopIndex - rowStartIndex)
      ) {
        return React.cloneElement(item, {
          hasScrollBarX: true,
        });
      }
      return item;
    });
  }

  return (
    <div
      ref={wrapper}
      onScroll={_onScroll}
      className={wrapperClassName}
      style={bodyStyle}
    >
      <div
        style={{
          height: isScrollBarX ? contentHeight - 8 : contentHeight,
          width: isScrollBarY ? contentWidth - 8 : contentWidth,
        }}
      >
        {items}
      </div>
    </div>
  );
}

function getColStartIndex(
  gridBasicInfo: GridBasicInfo,
  metadata,
  measuredInfo,
  scrollLeft,
) {
  return findNearestItem(
    'col',
    gridBasicInfo,
    metadata,
    measuredInfo,
    scrollLeft,
  );
}
function getColStopIndex(
  gridBasicInfo: GridBasicInfo,
  metadata,
  measuredInfo,
  startIndex: number,
  containerOffset: number,
) {
  const { columnCount, containerWidth } = gridBasicInfo;

  const itemMetadata = getItemMetadata(
    'col',
    gridBasicInfo,
    startIndex,
    metadata,
    measuredInfo,
  );
  const maxOffset = containerOffset + containerWidth;
  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < columnCount - 1 && offset <= maxOffset) {
    stopIndex += 1;
    offset += getItemMetadata(
      'col',
      gridBasicInfo,
      stopIndex,
      metadata,
      measuredInfo,
    ).size;
  }

  return stopIndex;
}

function getRowStartIndex(
  gridBasicInfo: GridBasicInfo,
  metadata,
  measuredInfo,
  scrollTop,
) {
  return findNearestItem(
    'row',
    gridBasicInfo,
    metadata,
    measuredInfo,
    scrollTop,
  );
}
function getRowStopIndex(
  gridBasicInfo: GridBasicInfo,
  metadata,
  measuredInfo,
  startIndex: number,
  scrollTop: number,
): number {
  const { rowCount, containerHeight } = gridBasicInfo;

  const itemMetadata = getItemMetadata(
    'row',
    gridBasicInfo,
    startIndex,
    metadata,
    measuredInfo,
  );
  const maxOffset = scrollTop + containerHeight;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < rowCount - 1 && offset < maxOffset) {
    offset += getItemMetadata(
      'row',
      gridBasicInfo,
      stopIndex,
      metadata,
      measuredInfo,
    ).size;
    stopIndex += 1;
  }

  return stopIndex;
}

const estimatedRowHeight = 48;
function getEstimatedTotalHeight(rowCount, rowMetadataMap, measuredInfo) {
  let totalSizeOfMeasuredRows = 0;

  // Edge case check for when the number of items decreases while a scroll is in progress.
  if (measuredInfo.lastMeasuredRowIndex >= rowCount) {
    measuredInfo.lastMeasuredRowIndex = rowCount - 1;
  }

  if (measuredInfo.lastMeasuredRowIndex >= 0) {
    const itemMetadata = rowMetadataMap[measuredInfo.lastMeasuredRowIndex];
    totalSizeOfMeasuredRows = itemMetadata.offset + itemMetadata.size;
  }

  const unmeasuredItemsNum = rowCount - measuredInfo.lastMeasuredRowIndex - 1;
  const totalSizeOfUnmeasuredItems = unmeasuredItemsNum * estimatedRowHeight;

  return totalSizeOfMeasuredRows + totalSizeOfUnmeasuredItems;
}

const estimatedColumnWidth = 100;
function getEstimatedTotalWidth(columnCount, columnMetadataMap, measuredInfo) {
  let totalSizeOfMeasuredRows = 0;
  let measuredColumnIndex = measuredInfo.lastMeasuredColumnIndex;

  // Edge case check for when the number of items decreases while a scroll is in progress.
  if (measuredColumnIndex >= columnCount) {
    measuredInfo.lastMeasuredColumnIndex = columnCount - 1;
    measuredColumnIndex = columnCount - 1;
  }

  if (measuredColumnIndex >= 0) {
    const itemMetadata = columnMetadataMap[measuredColumnIndex];
    totalSizeOfMeasuredRows = itemMetadata.offset + itemMetadata.size;
  }

  const unmeasuredItemsNum = columnCount - measuredColumnIndex - 1;
  const totalSizeOfUnmeasuredItems = unmeasuredItemsNum * estimatedColumnWidth;

  return totalSizeOfMeasuredRows + totalSizeOfUnmeasuredItems;
}

// ! 根据当前的 scrollTop 或 scrollLeft
// ! 获取当前的最近的 item
function findNearestItem(
  itemType: 'col' | 'row',
  gridBasicInfo: GridBasicInfo,
  metadata,
  measuredInfo,
  containerOffset,
) {
  const { columnMetadataMap, rowMetadataMap } = metadata;
  const { lastMeasuredColumnIndex, lastMeasuredRowIndex } = measuredInfo;
  let itemMetadataMap;
  let lastMeasuredIndex;
  if (itemType === 'col') {
    itemMetadataMap = columnMetadataMap;
    lastMeasuredIndex = lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = rowMetadataMap;
    lastMeasuredIndex = lastMeasuredRowIndex;
  }

  // console.log('get measured', itemMetadataMap);
  const lastMeasuredItemOffset =
    lastMeasuredIndex > 0 ? itemMetadataMap[lastMeasuredIndex].offset : 0;

  if (lastMeasuredItemOffset >= containerOffset) {
    // If we've already measured items within this range just use a binary search as it's faster.
    const binarySearchRes = findNearestItemBinarySearch(
      itemType,
      gridBasicInfo,
      metadata,
      measuredInfo,
      lastMeasuredIndex, // 查找结束点
      0, // 查找开始点
      containerOffset,
    );

    return binarySearchRes;
  } else {
    return findNearestItemExponentialSearch(
      itemType,
      gridBasicInfo,
      metadata,
      measuredInfo,
      Math.max(0, lastMeasuredIndex),
      containerOffset,
    );
  }
}

function findNearestItemExponentialSearch(
  itemType: 'col' | 'row',
  gridBasicInfo,
  metadata,
  measuredInfo,
  index: number,
  offset: number,
) {
  const itemCount =
    itemType === 'col' ? gridBasicInfo.columnCount : gridBasicInfo.rowCount;
  let interval = 1;

  while (
    index < itemCount &&
    getItemMetadata(itemType, gridBasicInfo, index, metadata, measuredInfo)
      .offset < offset
  ) {
    index += interval;
    interval *= 2;
  }

  return findNearestItemBinarySearch(
    itemType,
    gridBasicInfo,
    metadata,
    measuredInfo,
    Math.min(index, itemCount - 1),
    Math.floor(index / 2),
    offset,
  );
}

function findNearestItemBinarySearch(
  itemType: 'col' | 'row',
  gridBasicInfo,
  metadata,
  measuredInfo,
  high: number,
  low: number,
  containerOffset: number,
): number {
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const currentOffset = getItemMetadata(
      itemType,
      gridBasicInfo,
      middle,
      metadata,
      measuredInfo,
    ).offset;

    if (currentOffset === containerOffset) {
      return middle;
    } else if (currentOffset < containerOffset) {
      low = middle + 1;
    } else if (currentOffset > containerOffset) {
      high = middle - 1;
    }
  }

  if (low > 0) {
    return low - 1;
  } else {
    return 0;
  }
}

function getItemMetadata(
  itemType: 'col' | 'row',
  { columnWidth = 100, rowHeight = 48 }: GridBasicInfo,
  index: number,
  metaData,
  measuredInfo,
): ColumnMetaData | RowMetaData {
  // const { lastMeasuredColumnIndex, lastMeasuredRowIndex } = measuredInfo;
  let itemMetadataMap;
  let itemSize: number;
  let lastMeasuredIndex: number;
  if (itemType === 'col') {
    itemMetadataMap = metaData.columnMetadataMap;
    // * 每次获取 Metadata 同时更新值
    itemSize =
      typeof columnWidth === 'function' ? columnWidth(index) : columnWidth;
    lastMeasuredIndex = measuredInfo.lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = metaData.rowMetadataMap;
    itemSize = typeof rowHeight === 'function' ? rowHeight(index) : rowHeight;
    lastMeasuredIndex = measuredInfo.lastMeasuredRowIndex;
  }

  // * 当前属于未 记录 过的metaData内容，需要记录作为缓存
  if (index > lastMeasuredIndex) {
    let offset = 0;
    if (lastMeasuredIndex >= 0) {
      const itemMetadata = itemMetadataMap[lastMeasuredIndex];
      offset = itemMetadata.offset + itemMetadata.size;
    }

    for (let i = lastMeasuredIndex + 1; i <= index; i++) {
      itemMetadataMap[i] = {
        offset,
        size: itemSize,
      };
      offset += itemSize;
    }
    if (itemType === 'col') {
      measuredInfo.lastMeasuredColumnIndex = index;
    } else {
      measuredInfo.lastMeasuredRowIndex = index;
    }
  }

  return itemMetadataMap[index];
}

// function getRowHeight(props, index, metadata, measuredInfo) {
//   return getItemMetadata('row', props, index, metadata, measuredInfo).size;
// }
// function getColumnWidth(props, index, metadata, measuredInfo) {
//   return getItemMetadata('col', props, index, metadata, measuredInfo).size;
// }
// function getColumnOffset(props, index, metadata, measuredInfo) {
//   return getItemMetadata('col', props, index, metadata, measuredInfo).offset;
// }
// function getRowOffset(props, index, metadata, measuredInfo) {
//   return getItemMetadata('row', props, index, metadata, measuredInfo).offset;
// }

function getDefaultCellKey(columnIndex: React.Key, rowIndex: React.Key) {
  return `${rowIndex}_${columnIndex}`;
}

export default React.memo(React.forwardRef(Grid));
