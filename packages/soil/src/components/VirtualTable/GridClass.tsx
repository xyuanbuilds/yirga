/* eslint-disable no-param-reassign,import/no-extraneous-dependencies */
import memoizeOne from 'memoize-one';
import * as React from 'react';
import { requestTimeout, cancelTimeout } from './utils/timer';
import getScrollBarSize from './utils/getScrollBarSize';
import Cell from './Cell';

const DEFAULT_OUT_OF_VIEW_ITEM_NUM = 1;

const uuid = () => {
  // uuid长度始终大于阀值
  return String(
    Math.floor((Math.random() + Math.floor(Math.random() * 9 + 1)) * 10 ** 6),
  );
};

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
type ScrollInfo = {
  scrollLeft: number;
  scrollTop: number;
  isScrolling: boolean;
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

type ColumnType<T> = import('./interface').ColumnType<T>;
export interface GridColumn<T> extends ColumnType<T> {
  key: string;
  minWidth: number; // 最小宽度，拖拽不可低于最小宽
  // width: number; //! grid中 column width 由 columnWidth 计算获得暂不可传递
}
export interface GridRow<T> {
  key: string;
  className?: string | ((record: T, index: number) => string);
}

export interface GridProps<T> {
  container: React.RefObject<HTMLDivElement>;
  dataSource: T[];
  columns: GridColumn<T>[];
  rows?: GridRow<T>[];
  columnCount?: number;
  rowCount?: number;
  rowHeight?: number | ((index: number) => number);
  columnWidth?: number | ((index: number) => number);
  containerHeight: number;
  containerWidth: number;
  onScroll?: (scroll: { scrollLeft: number; scrollTop: number }) => void;
  // onScrollBarChange?: (info: { x: boolean; y: boolean }) => void;
  style?: React.CSSProperties;
  className?: string;
  rowClassName?: string | ((record: T, index: number) => string);
  syncScrollLeft?: ({ scrollLeft: number, currentTarget: HTMLElement }) => void;
  bordered?: boolean;
}

class Grid<
  RecordType extends Record<string, React.ReactNode>
> extends React.PureComponent<GridProps<RecordType>, ScrollInfo> {
  wrapperBorderLeft = 1;

  state: ScrollInfo = {
    scrollLeft: 0,
    scrollTop: 0,
    isScrolling: false,
  };

  uuid = uuid();

  scrollBarSize: number = getScrollBarSize();

  measuredInfos = {
    lastMeasuredColumnIndex: -1,
    lastMeasuredRowIndex: -1,
  };

  metaDataMap = {
    rowMetadataMap: {} as Record<string, RowMetaData>,
    columnMetadataMap: {} as Record<string, ColumnMetaData>,
  };

  wrapper = React.createRef<HTMLDivElement>();

  callOnScroll = memoizeOne(
    (scrollLeft: number, scrollTop: number) =>
      this.props.onScroll &&
      this.props.onScroll({
        scrollLeft,
        scrollTop,
      }),
  );

  // eslint-disable-next-line react/sort-comp
  // callOnScrollBarChange = () => {
  //   const { onScrollBarChange } = this.props;
  //   if (onScrollBarChange) {
  //     onScrollBarChange({
  //       x: this.noScrollBar
  //         ? false
  //         : this.onlyScrollBarX || !this.onlyScrollBarY,
  //       y: this.noScrollBar
  //         ? false
  //         : this.onlyScrollBarY || !this.onlyScrollBarX,
  //     });
  //   }
  // };

  componentDidMount() {
    const { scrollLeft, scrollTop } = this.state;

    this.layoutUpdate(scrollLeft, scrollTop);
    if (this.wrapper.current) {
      this.wrapper.current.addEventListener('wheel', this.onWheel, {
        passive: false,
      });
    }
  }

  componentDidUpdate(prevProps: GridProps<RecordType>) {
    if (
      this.props.containerWidth !== prevProps.containerWidth ||
      this.props.containerHeight !== prevProps.containerHeight ||
      this.props.bordered !== prevProps.bordered
    ) {
      this.onReset();
      return;
    }
    // * columnWidth变化需要重新测量
    if (
      this.props.columnWidth !== prevProps.columnWidth ||
      this.props.columns !== prevProps.columns
    ) {
      this.resetStyleCache();
      this.measuredInfos.lastMeasuredColumnIndex = -1;
      this.metaDataMap.columnMetadataMap = {};
    }
    if (
      this.props.rowHeight !== prevProps.rowHeight ||
      this.props.dataSource !== prevProps.dataSource
    ) {
      this.resetStyleCache();
      this.measuredInfos.lastMeasuredRowIndex = -1;
      this.metaDataMap.rowMetadataMap = {};
    }
    const { scrollLeft, scrollTop } = this.state;
    this.layoutUpdate(scrollLeft, scrollTop);
  }

  componentWillUnmount() {
    this.wrapper.current?.removeEventListener('wheel', this.onWheel);
  }

  onReset = () => {
    this.measuredInfos.lastMeasuredColumnIndex = -1;
    this.measuredInfos.lastMeasuredRowIndex = -1;
    this.metaDataMap.columnMetadataMap = {};
    this.metaDataMap.rowMetadataMap = {};
    this.resetStyleCache();
    this.setState(
      {
        scrollLeft: 0,
        scrollTop: 0,
        isScrolling: true,
      },
      () => this.resetStyleCache(),
    );
  };

  resetColFrom = (index: number) => {
    this.measuredInfos.lastMeasuredColumnIndex = Math.min(
      this.measuredInfos.lastMeasuredColumnIndex,
      index - 1 >= -1 ? index - 1 : -1,
    );
    this.resetStyleCache();
  };

  /* eslint-disable-next-line react/sort-comp */
  scrollTo = ({ scrollLeft, scrollTop }: Partial<ScrollInfo>) => {
    this.setState(
      (prev) => {
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
          return null;

        return {
          scrollTop,
          scrollLeft,
          isScrolling: true,
        };
      },
      () => this.resetStyleCache(),
    );
  };

  // eslint-disable-next-line react/sort-comp
  frameOffsetBatch = {
    x: 0,
    y: 0,
  };

  nextFrameId?: number;

  // * 只有X轴滚动条
  onlyScrollBarX = false;

  // * 只有Y轴滚动条
  onlyScrollBarY = false;

  // * 完全没有滚动条
  noScrollBar = false;

  onWheel = (event: WheelEvent) => {
    event.preventDefault();

    if (typeof this.nextFrameId === 'number')
      cancelAnimationFrame(this.nextFrameId);
    this.frameOffsetBatch = {
      y: (this.frameOffsetBatch.y += event.deltaY),
      x: (this.frameOffsetBatch.x += event.deltaX),
    };

    this.nextFrameId = requestAnimationFrame(() => {
      if (this.wrapper.current && !this.noScrollBar) {
        // * 元素全部测量后，可以获得最大 scrollLeft，scrollTop
        const { maxScrollLeft, maxScrollTop } = this.getMaxScrollOffset();
        const batchedScrollLeft =
          this.wrapper.current.scrollLeft + this.frameOffsetBatch.x;
        const batchedScrollTop =
          this.wrapper.current.scrollTop + this.frameOffsetBatch.y;

        const actualScrollLeft = maxScrollLeft
          ? Math.min(batchedScrollLeft, maxScrollLeft)
          : batchedScrollLeft;
        const actualScrollTop = maxScrollTop
          ? Math.min(batchedScrollTop, maxScrollTop)
          : batchedScrollTop;
        this.scrollTo({
          scrollLeft: this.onlyScrollBarY ? 0 : actualScrollLeft,
          scrollTop: this.onlyScrollBarX ? 0 : actualScrollTop,
        });
      }
      this.frameOffsetBatch = {
        x: 0,
        y: 0,
      };
    });
  };

  onScroll = (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const {
      clientHeight,
      clientWidth,
      scrollLeft,
      scrollTop,
      scrollHeight,
      scrollWidth,
    } = event.currentTarget;

    this.setState(
      (prev) => {
        if (scrollLeft === prev.scrollLeft && scrollTop === prev.scrollTop)
          return null;
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
          isScrolling: true,
        };
      },
      () => this.resetStyleCache(),
    );
  };

  maxScrollLeft = 0;

  getMaxScrollLeft = () => {
    const scrollbarSize = getScrollBarSize();
    console.log(scrollbarSize);
    const lastCol = this.metaDataMap.columnMetadataMap[
      this.props.columns.length - 1
    ];
    return lastCol
      ? lastCol.offset +
          lastCol.size -
          this.props.containerWidth +
          this.wrapperBorderLeft +
          (this.onlyScrollBarX ? 0 : scrollbarSize)
      : 0;
  };

  maxScrollTop = 0;

  getMaxScrollTop = () => {
    const scrollbarSize = getScrollBarSize();
    const lastRow = this.metaDataMap.rowMetadataMap[
      this.props.dataSource.length - 1
    ];
    return lastRow
      ? lastRow.offset +
          lastRow.size -
          this.props.containerHeight +
          (this.onlyScrollBarY ? 0 : scrollbarSize)
      : 0;
  };

  getMaxScrollOffset = () => {
    if (
      this.measuredInfos.lastMeasuredColumnIndex ===
        this.props.columns.length - 1 &&
      !this.onlyScrollBarY
    ) {
      this.maxScrollLeft = this.maxScrollLeft || this.getMaxScrollLeft();
    } else {
      this.maxScrollLeft = 0;
    }
    if (
      this.measuredInfos.lastMeasuredRowIndex ===
        this.props.dataSource.length - 1 &&
      !this.onlyScrollBarX
    ) {
      this.maxScrollTop = this.maxScrollTop || this.getMaxScrollTop();
    } else {
      this.maxScrollTop = 0;
    }
    return {
      maxScrollTop: this.maxScrollTop,
      maxScrollLeft: this.maxScrollLeft,
    };
  };

  getVerticalRange = (scroll: ScrollInfo) => {
    const {
      dataSource,
      columns,
      columnWidth,
      rowHeight,
      containerHeight,
      containerWidth,
    } = this.props;
    const rowCount = dataSource.length || this.props.rowCount || 0;
    const columnCount = columns.length || this.props.columnCount || 0;
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
      this.metaDataMap,
      this.measuredInfos,
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
      this.metaDataMap,
      this.measuredInfos,
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
  };

  getHorizontalRange = (scroll: ScrollInfo) => {
    const {
      dataSource,
      columns,
      columnWidth,
      rowHeight,
      containerHeight,
      containerWidth,
    } = this.props;
    const rowCount = dataSource.length || this.props.rowCount || 0;
    const columnCount = columns.length || this.props.columnCount || 0;
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
      this.metaDataMap,
      this.measuredInfos,
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
      this.metaDataMap,
      this.measuredInfos,
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
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getItemStyleCache = memoizeOne((_, __) => ({}));

  resetTimerId: { id: number } | null = null;

  resetStyleCache = () => {
    if (this.resetTimerId !== null) {
      cancelTimeout(this.resetTimerId);
    }
    this.resetTimerId = requestTimeout(this.scrollReset, 150);
  };

  scrollReset = () => {
    this.setState({ isScrolling: false }, () => {
      this.getItemStyleCache(-1);
    });
  };

  // * 重绘融合
  layoutUpdate = (scrollLeft: number, scrollTop: number) => {
    const validScrollLeft = Math.max(0, scrollLeft);
    const validScrollTop = Math.max(0, scrollTop);

    if (this.wrapper.current) {
      this.wrapper.current.scrollLeft = validScrollLeft;
      this.wrapper.current.scrollTop = validScrollTop;
      this.syncScroll({
        scrollLeft: validScrollLeft,
        currentTarget: this.wrapper.current,
      });
    }

    this.callOnScroll(validScrollLeft, validScrollTop);
  };

  // * 滚动同步
  syncScroll = (
    scrollInfo: Partial<ScrollInfo> & { currentTarget: HTMLElement },
  ) => {
    const { currentTarget } = scrollInfo;
    const { syncScrollLeft } = this.props;
    if (syncScrollLeft) {
      syncScrollLeft({
        scrollLeft: scrollInfo.scrollLeft,
        currentTarget,
      });
    }
  };

  getItemStyle = (rowIndex: number, columnIndex: number) => {
    const {
      dataSource,
      columns,
      columnWidth,
      rowHeight,
      containerHeight,
      containerWidth,
    } = this.props;
    const itemStyleCache = this.getItemStyleCache(columnWidth, rowHeight);
    const rowCount = dataSource.length || this.props.rowCount || 0;
    const columnCount = columns.length || this.props.columnCount || 0;
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
      this.metaDataMap,
      this.measuredInfos,
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
      this.metaDataMap,
      this.measuredInfos,
    );
    itemStyleCache[key] = {
      position: 'absolute',
      left: curCol.offset,
      top: curRow.offset,
      height: curRow.size,
      width: curCol.size,
    };
    return itemStyleCache[key];
  };

  render() {
    const {
      dataSource: data,
      columns,
      rows,
      style: bodyStyle,
      className: wrapperClassName,
      rowClassName,
      containerHeight,
      containerWidth,
      bordered = true,
    } = this.props;
    const { isScrolling } = this.state;

    const rowCount = data.length || this.props.rowCount || 0;
    const columnCount = columns.length || this.props.columnCount || 0;

    const [rowStartIndex, rowStopIndex] = this.getVerticalRange(this.state);
    const [colStartIndex, colStopIndex] = this.getHorizontalRange(this.state);

    const items = [] as React.ReactElement[];
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
          const curColumn = columns[columnIndex];
          const curRow = rows && rows[rowIndex];
          const curRecord = data[rowIndex];

          items.push(
            // TODO Cell 外部注入
            React.createElement(
              Cell as React.FunctionComponent<
                import('./Cell').DefaultCellProps<RecordType>
              >,
              {
                /** 内部使用 */
                rowIndex,
                columnIndex,
                key: getDefaultCellKey(columnIndex, rowIndex),
                style: this.getItemStyle(rowIndex, columnIndex),
                isScrolling,
                /** 外部传递 */
                curColumn,
                curRow: {
                  // TODO 自定义row后修改
                  ...curRow,
                  key: String(rowIndex),
                  className: rowClassName,
                },
                bordered,
                record: curRecord,
                data: getPathValue<React.ReactNode, RecordType>(
                  curRecord,
                  curColumn.dataIndex || curColumn.key,
                ),
              },
            ),
          );
        }
      }
    }
    const contentHeight = getEstimatedTotalHeight(
      rowCount,
      this.metaDataMap.rowMetadataMap,
      this.measuredInfos,
    );
    const contentWidth = getEstimatedTotalWidth(
      columnCount,
      this.metaDataMap.columnMetadataMap,
      this.measuredInfos,
    );
    this.wrapperBorderLeft = this.props.bordered ? 1 : 0;

    // * 出现 X 滚动条的限值
    const wrapperScrollBarXLimit = containerWidth - this.wrapperBorderLeft;
    const wrapperScrollBarYLimit = containerHeight;
    this.onlyScrollBarY =
      wrapperScrollBarYLimit < contentHeight &&
      contentWidth <= wrapperScrollBarXLimit;
    this.onlyScrollBarX =
      wrapperScrollBarXLimit < contentWidth &&
      contentHeight <= wrapperScrollBarYLimit;
    this.noScrollBar =
      contentWidth <= wrapperScrollBarXLimit &&
      contentHeight <= wrapperScrollBarYLimit;

    return (
      <div
        id="container"
        ref={this.wrapper}
        onScroll={this.onScroll}
        className={wrapperClassName}
        style={bodyStyle}
      >
        <div
          style={{
            height: contentHeight,
            width: contentWidth,
          }}
        >
          {items}
        </div>
      </div>
    );
  }
}

type GridMetaData = Grid<Record<string, React.ReactNode>>['metaDataMap'];
type GridMeasureData = Grid<Record<string, React.ReactNode>>['measuredInfos'];

function getColStartIndex(
  gridBasicInfo: GridBasicInfo,
  metadata: GridMetaData,
  measuredInfo: GridMeasureData,
  scrollLeft: number,
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
  metadata: GridMetaData,
  measuredInfo: GridMeasureData,
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
  metadata: GridMetaData,
  measuredInfo: GridMeasureData,
  scrollTop: number,
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
  metadata: GridMetaData,
  measuredInfo: GridMeasureData,
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
function getEstimatedTotalHeight(
  rowCount: number,
  rowMetadataMap: GridMetaData['rowMetadataMap'],
  measuredInfo: GridMeasureData,
) {
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

const estimatedColumnWidth = 120;
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
  metadata: GridMetaData,
  measuredInfo: GridMeasureData,
  containerOffset: number,
) {
  const { columnMetadataMap, rowMetadataMap } = metadata;
  const { lastMeasuredColumnIndex, lastMeasuredRowIndex } = measuredInfo;
  let itemMetadataMap:
    | GridMetaData['rowMetadataMap']
    | GridMetaData['columnMetadataMap'];
  let lastMeasuredIndex: number;
  if (itemType === 'col') {
    itemMetadataMap = columnMetadataMap;
    lastMeasuredIndex = lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = rowMetadataMap;
    lastMeasuredIndex = lastMeasuredRowIndex;
  }

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
  gridBasicInfo: GridBasicInfo,
  metadata: GridMetaData,
  measuredInfo: GridMeasureData,
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
  gridBasicInfo: GridBasicInfo,
  metadata: GridMetaData,
  measuredInfo: GridMeasureData,
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
  metadata: GridMetaData,
  measuredInfo: GridMeasureData,
): ColumnMetaData | RowMetaData {
  // const { lastMeasuredColumnIndex, lastMeasuredRowIndex } = measuredInfo;
  let itemMetadataMap;
  let itemSize: ((index: number) => number) | (() => number);
  let lastMeasuredIndex: number;
  if (itemType === 'col') {
    itemMetadataMap = metadata.columnMetadataMap;
    // * 每次获取 Metadata 同时更新值
    itemSize =
      typeof columnWidth === 'function' ? columnWidth : () => columnWidth;
    lastMeasuredIndex = measuredInfo.lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = metadata.rowMetadataMap;
    itemSize = typeof rowHeight === 'function' ? rowHeight : () => rowHeight;
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
      const size = itemSize(i);
      itemMetadataMap[i] = {
        offset,
        size,
      };
      offset += size;
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

function toArray<T>(arr: T | T[]): T[] {
  if (arr === undefined || arr === null) {
    return [];
  }

  return Array.isArray(arr) ? arr : [arr];
}
function getPathValue<
  ValueType extends React.ReactNode,
  ObjectType extends Record<string, unknown>
>(record: ObjectType, path: ColumnType<ObjectType>['dataIndex']): ValueType {
  // Skip if path is empty
  if (!path && typeof path !== 'number') {
    return (record as unknown) as ValueType;
  }

  const pathList = toArray(path);

  let current: ValueType | ObjectType = record;

  for (let i = 0; i < pathList.length; i += 1) {
    if (!current) {
      return null as ValueType;
    }

    const prop = pathList[i];
    current = current[prop];
  }

  return current as ValueType;
}

export default Grid;
