/* eslint-disable no-param-reassign */
/* copy from bvaughn/react-window: https://github.com/bvaughn/react-window */
import * as React from 'react';
import Cell from './Cell';

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

function Grid(props) {
  const { dataSource: data, columns, children, columnCount, rowCount } = props;

  const wrapperRef = React.useRef(null);
  // scrollHeight, scrollWidth // 可滚动块信息
  // scrollLeft, scrollTop // 实际滚动区域
  // * 当前外框滚动记录
  const [scroll, setScroll] = React.useState({
    scrollLeft: 0,
    scrollTop: 0,
  });
  // * 当前内框宽高
  const [{ width, height }, setContentInfo] = React.useState({
    width: 0,
    height: 0,
  });
  const [{ rowStartIndex, rowStopIndex }, setRows] = React.useState<{
    rowStartIndex: number;
    rowStopIndex: null | number;
  }>({
    rowStartIndex: 0,
    rowStopIndex: null,
  });
  const [{ colStartIndex, colStopIndex }, setCols] = React.useState<{
    colStartIndex: number;
    colStopIndex: null | number;
  }>({
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

  const innerFlags = React.useRef<{
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

  function reCalculate() {
    const contentHeight = getEstimatedTotalHeight(
      rowCount,
      metaDataMap.current.rowMetadataMap,
      innerFlags.current,
    );
    const contentWidth = getEstimatedTotalWidth(
      columnCount,
      metaDataMap.current.columnMetadataMap,
      innerFlags.current,
    );

    const [curRowStartIndex, curRowStopIndex] = getVerticalRange();
    const [curColStartIndex, curColStopIndex] = getHorizontalRange();

    // * 获取当前 可预测的内容容器 渲染 startIndex -> stopIndex
    setContentInfo({ width: contentWidth, height: contentHeight });
    setRows({ rowStartIndex: curRowStartIndex, rowStopIndex: curRowStopIndex });
    setCols({ colStartIndex: curColStartIndex, colStopIndex: curColStopIndex });
  }
  // *初始化metaData
  React.useEffect(() => {
    reCalculate();
  }, [scroll, columnCount, rowCount]);

  function getVerticalRange() {
    if (columnCount === 0 || rowCount === 0) {
      return [0, 0, 0, 0];
    }
    const startIndex = getRowStartIndex(
      props,
      metaDataMap.current,
      innerFlags.current,
      scroll.scrollTop,
    );

    const stopIndex = getRowStopIndex(
      props,
      metaDataMap.current,
      innerFlags.current,
      startIndex,
      scroll.scrollTop,
    );

    // Over scan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    // const overScanCount = 1;
    return [
      Math.max(0, startIndex - 1),
      Math.max(0, Math.min(rowCount - 1, stopIndex + 1)),
      startIndex,
      stopIndex,
    ];
  }

  function getHorizontalRange() {
    if (columnCount === 0 || rowCount === 0) {
      return [0, 0, 0, 0];
    }

    const startIndex = getColStartIndex(
      props,
      metaDataMap.current,
      innerFlags.current,
      scroll.scrollLeft,
    );

    const stopIndex = getColStopIndex(
      props,
      metaDataMap.current,
      innerFlags.current,
      startIndex,
      scroll.scrollLeft,
    );

    // Over scan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    // const overScanCount = 1;
    return [
      Math.max(0, startIndex - 1),
      Math.max(0, Math.min(columnCount - 1, stopIndex + 1)),
      startIndex,
      stopIndex,
    ];
  }

  // function onWheel(event: React.UIEvent<HTMLDivElement, UIEvent>) {
  //   onScroll(event);
  // }

  function onScroll(event: React.UIEvent<HTMLDivElement, UIEvent>) {
    const {
      clientHeight,
      clientWidth,
      scrollLeft,
      scrollTop,
      scrollHeight,
      scrollWidth,
    } = event.currentTarget;

    setScroll((prevState) => {
      if (
        prevState.scrollLeft === scrollLeft &&
        prevState.scrollTop === scrollTop
      ) {
        // Scroll position may have been updated by cDM/cDU,
        // In which case we don't need to trigger another render,
        // And we don't want to update state.isScrolling.
        return prevState;
      }

      // 处理 safari 弹性滚动
      const actualLeft = Math.max(
        0,
        Math.min(scrollLeft, scrollWidth - clientWidth),
      );
      const actualTop = Math.max(
        0,
        Math.min(scrollTop, scrollHeight - clientHeight),
      );

      return {
        scrollLeft: actualLeft,
        scrollTop: actualTop,
      };
    });
  }

  function getItemStyle(rowIndex: number, columnIndex: number) {
    const curRow = getItemMetadata(
      'row',
      props,
      rowIndex,
      metaDataMap.current,
      innerFlags.current,
    );
    const curCol = getItemMetadata(
      'col',
      props,
      columnIndex,
      metaDataMap.current,
      innerFlags.current,
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

  const items = [] as any[];
  if (columnCount > 0 && rowCount && rowStopIndex && colStopIndex) {
    for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
      for (
        let columnIndex = colStartIndex;
        columnIndex <= colStopIndex;
        columnIndex++
      ) {
        items.push(
          React.createElement(Cell, {
            columnIndex,
            data: data[rowIndex][columns[columnIndex].name],
            key: getDefaultCellKey(columnIndex, rowIndex),
            rowIndex,
            style: getItemStyle(rowIndex, columnIndex),
          }),
        );
      }
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        willChange: 'transform',
        direction: 'ltr',
      }}
      onScroll={onScroll}
      // onWheel={onWheel}
      ref={wrapperRef}
      className="tableWrapper"
    >
      <div style={{ height, width }} className="tableInner">
        {items}
      </div>
    </div>
  );
}
Grid.displayName = 'virtual_grid';

function getColStartIndex(props, metadata, measuredInfo, scrollLeft) {
  return findNearestItem('col', props, metadata, measuredInfo, scrollLeft);
}
function getColStopIndex(
  props,
  metadata,
  measuredInfo,
  startIndex: number,
  scrollLeft: number,
) {
  const { columnCount, width } = props;

  const itemMetadata = getItemMetadata(
    'col',
    props,
    startIndex,
    metadata,
    measuredInfo,
  );
  const maxOffset = scrollLeft + width;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < columnCount - 1 && offset < maxOffset) {
    offset += getItemMetadata('col', props, stopIndex, metadata, measuredInfo)
      .size;
    stopIndex += 1;
  }

  return stopIndex;
}

function getRowStartIndex(props, metadata, measuredInfo, scrollTop) {
  return findNearestItem('row', props, metadata, measuredInfo, scrollTop);
}

function getRowStopIndex(
  props,
  metadata,
  measuredInfo,
  startIndex: number,
  scrollTop: number,
): number {
  const { rowCount, height } = props;

  const itemMetadata = getItemMetadata(
    'row',
    props,
    startIndex,
    metadata,
    measuredInfo,
  );
  const maxOffset = scrollTop + height;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < rowCount - 1 && offset < maxOffset) {
    offset += getItemMetadata('row', props, stopIndex, metadata, measuredInfo)
      .size;
    stopIndex += 1;
  }

  return stopIndex;
}

const estimatedRowHeight = 18;
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

const estimatedColumnWidth = 20;
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
  props,
  metadata,
  measuredInfo,
  curOffset,
) {
  // const { columnWidth, rowHeight } = props;
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

  const lastMeasuredItemOffset =
    lastMeasuredIndex > 0 ? itemMetadataMap[lastMeasuredIndex].offset : 0;

  if (lastMeasuredItemOffset >= curOffset) {
    // If we've already measured items within this range just use a binary search as it's faster.
    return findNearestItemBinarySearch(
      itemType,
      props,
      metadata,
      measuredInfo,
      lastMeasuredIndex,
      0,
      curOffset,
    );
  } else {
    return findNearestItemExponentialSearch(
      itemType,
      props,
      metadata,
      measuredInfo,
      Math.max(0, lastMeasuredIndex),
      curOffset,
    );
  }
}

function findNearestItemExponentialSearch(
  itemType: 'col' | 'row',
  props,
  metadata,
  measuredInfo,
  index: number,
  offset: number,
) {
  const itemCount = itemType === 'col' ? props.columnCount : props.rowCount;
  let interval = 1;

  while (
    index < itemCount &&
    getItemMetadata(itemType, props, index, metadata, measuredInfo).offset <
      offset
  ) {
    index += interval;
    interval *= 2;
  }

  return findNearestItemBinarySearch(
    itemType,
    props,
    metadata,
    measuredInfo,
    Math.min(index, itemCount - 1),
    Math.floor(index / 2),
    offset,
  );
}

function findNearestItemBinarySearch(
  itemType: 'col' | 'row',
  props,
  metadata,
  measuredInfo,
  high: number,
  low: number,
  offset: number,
): number {
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const currentOffset = getItemMetadata(
      itemType,
      props,
      middle,
      metadata,
      measuredInfo,
    ).offset;

    if (currentOffset === offset) {
      return middle;
    } else if (currentOffset < offset) {
      low = middle + 1;
    } else if (currentOffset > offset) {
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
  { columnWidth, rowHeight },
  index: number,
  { columnMetadataMap, rowMetadataMap },
  measuredInfo,
) {
  const { lastMeasuredColumnIndex, lastMeasuredRowIndex } = measuredInfo;
  let itemMetadataMap;
  let itemSize;
  let lastMeasuredIndex;
  if (itemType === 'col') {
    itemMetadataMap = columnMetadataMap;
    // * 每次获取 Metadata 同时更新值
    itemSize =
      typeof columnWidth === 'function' ? columnWidth(index) : columnWidth;
    lastMeasuredIndex = lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = rowMetadataMap;
    itemSize = typeof rowHeight === 'function' ? rowHeight(index) : rowHeight;
    lastMeasuredIndex = lastMeasuredRowIndex;
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

      // offset += itemSize;
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
  return `${rowIndex}:${columnIndex}`;
}

interface DefaultProps {
  columns: any[];
  dataSource: any[];
}

const InitialWrapper = React.memo(
  ({ columns = [], dataSource = [], ...reset }: DefaultProps) => {
    const columnCount = columns.length;
    const rowCount = dataSource.length;

    return (
      <Grid
        columns={columns}
        columnCount={columnCount}
        rowCount={rowCount}
        dataSource={dataSource}
        {...reset}
      />
    );
  },
);
InitialWrapper.displayName = 'InitialWrapper';

export default InitialWrapper;
