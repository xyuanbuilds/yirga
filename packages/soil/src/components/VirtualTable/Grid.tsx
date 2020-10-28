/* eslint-disable no-param-reassign */
/* copy from bvaughn/react-window: https://github.com/bvaughn/react-window */
import * as React from 'react';
// import bindRaf from './utils/bindRaf';
import Cell from './Cell';

const DEFAULT_OUT_OF_VIEW_ITEM_NUM = 1;

// * 构建网格的最基本信息
type GridBasicInfo = {
  containerHeight: number;
  containerWidth: number;
  columnCount: number;
  rowCount: number;
  rowHeight?: number | ((index: number) => number);
  columnWidth?: number | ((index: number) => number);
};

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

export interface GridRefObj {
  scrollTo: (scroll: { scrollLeft: number; scrollTop: number }) => void;
  measuredInfos: React.MutableRefObject<{
    lastMeasuredRowIndex: number;
    lastMeasuredColumnIndex: number;
  }>;
}

type GridColumn = {
  key: string;
  // width: number; // 渲染宽度
  // offset: number; // left / top 偏移量
};
type GridRow = {
  key: string;
};

export interface GridProps<T = Record<string, unknown>> extends GridBasicInfo {
  container: React.RefObject<HTMLDivElement>;
  dataSource: T[];
  columns: GridColumn[];
  rows?: GridRow[];
}

function Grid<T = Record<string, unknown>>(props: GridProps<T>, ref) {
  const {
    dataSource: data,
    columns,
    container,
    columnWidth,
    rowHeight,
    containerHeight,
    containerWidth,
  } = props;
  const rowCount = data.length;
  const columnCount = columns.length;

  // * 当前内框宽高
  const [contentContainerStyle, setContentContainer] = React.useState({
    width: 0,
    height: 0,
  });
  const [
    { rowStartIndex, rowStopIndex, colStartIndex, colStopIndex },
    setGrid,
  ] = React.useState<{
    rowStartIndex: number;
    rowStopIndex: null | number;
    colStartIndex: number;
    colStopIndex: null | number;
  }>({
    rowStartIndex: 0,
    rowStopIndex: null,
    colStartIndex: 0,
    colStopIndex: null,
  });

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

  const measuredInfos = React.useRef<{
    // 随着某一个 column 变化后，后续 columns也需要变化
    // 但之前的 column 不需要变化，所以只需要计算后续的column即可
    // 外部出发了 xxx 变化后， last xx 变为 index - 1
    // row 同理
    lastMeasuredRowIndex: number;
    lastMeasuredColumnIndex: number;
  }>({
    lastMeasuredColumnIndex: -1,
    lastMeasuredRowIndex: -1,
  });

  const scrollRef = React.useRef({
    scrollTop: 0,
    scrollLeft: 0,
  });

  const reCalculate = (scroll) => {
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

    const [curRowStartIndex, curRowStopIndex] = getVerticalRange(scroll);
    const [curColStartIndex, curColStopIndex] = getHorizontalRange(scroll);
    // console.log('curRows', curRowStartIndex, curRowStopIndex, contentHeight);
    // * 获取当前 可预测的内容容器 渲染 startIndex -> stopIndex
    setGrid((preGrid) => {
      if (
        preGrid.rowStartIndex === curRowStartIndex &&
        preGrid.rowStopIndex === curRowStopIndex &&
        preGrid.colStartIndex === curColStartIndex &&
        preGrid.colStopIndex === curColStopIndex
      ) {
        return preGrid;
      }
      return {
        rowStartIndex: curRowStartIndex,
        rowStopIndex: curRowStopIndex,
        colStartIndex: curColStartIndex,
        colStopIndex: curColStopIndex,
      };
    });

    setContentContainer((preContainer) => {
      if (
        preContainer.width === contentWidth &&
        preContainer.height === contentHeight
      )
        return preContainer;
      return {
        width: contentWidth,
        height: contentHeight,
      };
    });
  };

  const onReset = () => {
    scrollRef.current = {
      scrollTop: 0,
      scrollLeft: 0,
    };
    measuredInfos.current.lastMeasuredColumnIndex = -1;
    measuredInfos.current.lastMeasuredRowIndex = -1;
  };

  const scrollTo = (scroll: { scrollLeft: number; scrollTop: number }) => {
    scrollRef.current = scroll;

    reCalculate(scroll);
    if (container.current) {
      container.current.scrollLeft = scroll.scrollLeft;
      container.current.scrollTop = scroll.scrollTop;
    }
  };

  // *具体某处变化，外部重置measured
  React.useLayoutEffect(() => {
    console.log('重算');
    scrollTo(scrollRef.current);
  }, [columnWidth, rowHeight]);

  // *数量结构变化，直接重置
  React.useLayoutEffect(() => {
    console.log('重置');
    onReset();
    scrollTo({
      scrollTop: 0,
      scrollLeft: 0,
    });
  }, [columnCount, rowCount]);

  React.useImperativeHandle(ref, () => ({
    scrollTo,
    measuredInfos,
  }));

  function getVerticalRange(scroll) {
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

  function getHorizontalRange(scroll) {
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

  function getItemStyle(rowIndex: number, columnIndex: number) {
    const curRow = getItemMetadata(
      'row',
      props,
      rowIndex,
      metaDataMap.current,
      measuredInfos.current,
    );
    const curCol = getItemMetadata(
      'col',
      props,
      columnIndex,
      metaDataMap.current,
      measuredInfos.current,
    );
    const style = {
      position: 'absolute',
      left: curCol.offset,
      top: curRow.offset,
      height: curRow.size,
      width: curCol.size,
    };

    return style;
  }

  const items = [] as unknown[];
  if (columnCount > 0 && rowCount && rowStopIndex && colStopIndex) {
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
          React.createElement(Cell, {
            columnIndex,
            data: data[rowIndex][columns[columnIndex].key],
            key: getDefaultCellKey(columnIndex, rowIndex),
            rowIndex,
            style: getItemStyle(rowIndex, columnIndex),
          }),
        );
      }
    }
  }

  return (
    <div style={contentContainerStyle} className="tableInner">
      {items}
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

  while (stopIndex < rowCount - 1 && offset <= maxOffset) {
    stopIndex += 1;
    offset += getItemMetadata(
      'row',
      gridBasicInfo,
      stopIndex,
      metadata,
      measuredInfo,
    ).size;
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

// !!! 重点算法: 根据当前的 scrollTop 或 scrollLeft
// !!! 获取当前的最近的 item
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
  let itemSize;
  let lastMeasuredIndex;
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

function getDefaultCellKey(columnIndex, rowIndex) {
  return `${rowIndex}_${columnIndex}`;
}

export default React.memo(React.forwardRef(Grid));
