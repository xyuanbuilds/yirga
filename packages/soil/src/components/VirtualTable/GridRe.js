import { createElement, PureComponent } from 'react';
import memoizeOne from 'memoize-one';

const defaultItemKey = ({ columnIndex, data, rowIndex }) =>
  `${rowIndex}:${columnIndex}`;

// In DEV mode, this Set helps us only log a warning once per component instance.
// This avoids spamming the console every time a render happens.

function createGridComponent({
  getColumnOffset,
  getColumnStartIndexForOffset,
  getColumnStopIndexForStartIndex,
  getColumnWidth,
  getEstimatedTotalHeight,
  getEstimatedTotalWidth,
  getOffsetForColumnAndAlignment,
  getOffsetForRowAndAlignment,
  getRowHeight,
  getRowOffset,
  getRowStartIndexForOffset,
  getRowStopIndexForStartIndex,
  initInstanceProps,
  shouldResetStyleCacheOnItemSizeChange,
  validateProps,
}) {
  return class Grid extends PureComponent {
    _instanceProps = initInstanceProps(this.props, this);

    _resetIsScrollingTimeoutId;

    _outerRef;

    static defaultProps = {
      direction: 'ltr',
      itemData: undefined,
      useIsScrolling: false,
    };

    state = {
      instance: this,
      isScrolling: false,
      horizontalScrollDirection: 'forward',
      scrollLeft:
        typeof this.props.initialScrollLeft === 'number'
          ? this.props.initialScrollLeft
          : 0,
      scrollTop:
        typeof this.props.initialScrollTop === 'number'
          ? this.props.initialScrollTop
          : 0,
      scrollUpdateWasRequested: false,
      verticalScrollDirection: 'forward',
    };

    // Always use explicit constructor for React components.
    // It produces less code after transpilation. (#26)
    // eslint-disable-next-line no-useless-constructor

    scrollTo({ scrollLeft, scrollTop }) {
      if (scrollLeft !== undefined) {
        scrollLeft = Math.max(0, scrollLeft);
      }
      if (scrollTop !== undefined) {
        scrollTop = Math.max(0, scrollTop);
      }

      this.setState((prevState) => {
        if (scrollLeft === undefined) {
          scrollLeft = prevState.scrollLeft;
        }
        if (scrollTop === undefined) {
          scrollTop = prevState.scrollTop;
        }

        if (
          prevState.scrollLeft === scrollLeft &&
          prevState.scrollTop === scrollTop
        ) {
          return null;
        }

        return {
          horizontalScrollDirection:
            prevState.scrollLeft < scrollLeft ? 'forward' : 'backward',
          scrollLeft,
          scrollTop,
          scrollUpdateWasRequested: true,
          verticalScrollDirection:
            prevState.scrollTop < scrollTop ? 'forward' : 'backward',
        };
      });
    }

    scrollToItem({ align = 'auto', columnIndex, rowIndex }) {
      const { columnCount, height, rowCount, width } = this.props;
      const { scrollLeft, scrollTop } = this.state;
      const scrollbarSize = 8;

      if (columnIndex !== undefined) {
        columnIndex = Math.max(0, Math.min(columnIndex, columnCount - 1));
      }
      if (rowIndex !== undefined) {
        rowIndex = Math.max(0, Math.min(rowIndex, rowCount - 1));
      }

      const estimatedTotalHeight = getEstimatedTotalHeight(
        this.props,
        this._instanceProps,
      );
      const estimatedTotalWidth = getEstimatedTotalWidth(
        this.props,
        this._instanceProps,
      );

      // The scrollbar size should be considered when scrolling an item into view,
      // to ensure it's fully visible.
      // But we only need to account for its size when it's actually visible.
      const horizontalScrollbarSize =
        estimatedTotalWidth > width ? scrollbarSize : 0;
      const verticalScrollbarSize =
        estimatedTotalHeight > height ? scrollbarSize : 0;

      this.scrollTo({
        scrollLeft:
          columnIndex !== undefined
            ? getOffsetForColumnAndAlignment(
                this.props,
                columnIndex,
                align,
                scrollLeft,
                this._instanceProps,
                verticalScrollbarSize,
              )
            : scrollLeft,
        scrollTop:
          rowIndex !== undefined
            ? getOffsetForRowAndAlignment(
                this.props,
                rowIndex,
                align,
                scrollTop,
                this._instanceProps,
                horizontalScrollbarSize,
              )
            : scrollTop,
      });
    }

    componentDidMount() {
      const { initialScrollLeft, initialScrollTop } = this.props;

      if (this._outerRef != null) {
        const outerRef = this._outerRef;
        if (typeof initialScrollLeft === 'number') {
          outerRef.scrollLeft = initialScrollLeft;
        }
        if (typeof initialScrollTop === 'number') {
          outerRef.scrollTop = initialScrollTop;
        }
      }
    }

    componentDidUpdate() {
      const { scrollLeft, scrollTop, scrollUpdateWasRequested } = this.state;

      if (scrollUpdateWasRequested && this._outerRef != null) {
        // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
        // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
        // So we need to determine which browser behavior we're dealing with, and mimic it.
        const outerRef = this._outerRef;

        outerRef.scrollLeft = Math.max(0, scrollLeft);

        outerRef.scrollTop = Math.max(0, scrollTop);
      }
    }

    componentWillUnmount() {
      // if (this._resetIsScrollingTimeoutId !== null) {
      //   cancelTimeout(this._resetIsScrollingTimeoutId);
      // }
    }

    render() {
      const {
        children,
        className,
        columnCount,
        direction,
        height,
        innerRef,
        innerElementType,
        innerTagName,
        itemData,
        itemKey = defaultItemKey,
        outerElementType,
        outerTagName,
        rowCount,
        style,
        useIsScrolling,
        width,
      } = this.props;
      const { isScrolling } = this.state;

      const [
        columnStartIndex,
        columnStopIndex,
      ] = this._getHorizontalRangeToRender();
      const [rowStartIndex, rowStopIndex] = this._getVerticalRangeToRender();

      const items = [];
      if (columnCount > 0 && rowCount) {
        for (
          let rowIndex = rowStartIndex;
          rowIndex <= rowStopIndex;
          rowIndex++
        ) {
          for (
            let columnIndex = columnStartIndex;
            columnIndex <= columnStopIndex;
            columnIndex++
          ) {
            items.push(
              createElement(children, {
                columnIndex,
                data: itemData,
                isScrolling: useIsScrolling ? isScrolling : undefined,
                key: itemKey({ columnIndex, data: itemData, rowIndex }),
                rowIndex,
                style: this._getItemStyle(rowIndex, columnIndex),
              }),
            );
          }
        }
      }

      // Read this value AFTER items have been created,
      // So their actual sizes (if variable) are taken into consideration.
      const estimatedTotalHeight = getEstimatedTotalHeight(
        this.props,
        this._instanceProps,
      );
      const estimatedTotalWidth = getEstimatedTotalWidth(
        this.props,
        this._instanceProps,
      );

      return createElement(
        outerElementType || outerTagName || 'div',
        {
          className,
          onScroll: this._onScroll,
          ref: this._outerRefSetter,
          style: {
            position: 'relative',
            height,
            width,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            willChange: 'transform',
            direction,
            ...style,
          },
        },
        createElement(innerElementType || innerTagName || 'div', {
          children: items,
          ref: innerRef,
          style: {
            height: estimatedTotalHeight,
            pointerEvents: isScrolling ? 'none' : undefined,
            width: estimatedTotalWidth,
          },
        }),
      );
    }

    // Lazily create and cache item styles while scrolling,
    // So that pure component sCU will prevent re-renders.
    // We maintain this cache, and pass a style prop rather than index,
    // So that List can clear cached styles and force item re-render if necessary.
    _getItemStyle = (rowIndex, columnIndex) => {
      const { columnWidth, direction, rowHeight } = this.props;

      const itemStyleCache = this._getItemStyleCache(
        shouldResetStyleCacheOnItemSizeChange && columnWidth,
        shouldResetStyleCacheOnItemSizeChange && direction,
        shouldResetStyleCacheOnItemSizeChange && rowHeight,
      );

      const key = `${rowIndex}:${columnIndex}`;

      let style;
      if (itemStyleCache.hasOwnProperty(key)) {
        style = itemStyleCache[key];
      } else {
        const offset = getColumnOffset(
          this.props,
          columnIndex,
          this._instanceProps,
        );
        const isRtl = direction === 'rtl';
        itemStyleCache[key] = style = {
          position: 'absolute',
          left: isRtl ? undefined : offset,
          right: isRtl ? offset : undefined,
          top: getRowOffset(this.props, rowIndex, this._instanceProps),
          height: getRowHeight(this.props, rowIndex, this._instanceProps),
          width: getColumnWidth(this.props, columnIndex, this._instanceProps),
        };
      }

      return style;
    };

    _getItemStyleCache = memoizeOne((_, __, ___) => ({}));

    _getHorizontalRangeToRender() {
      const {
        columnCount,
        overscanColumnCount,
        overscanColumnsCount,
        overscanCount,
        rowCount,
      } = this.props;
      const { horizontalScrollDirection, isScrolling, scrollLeft } = this.state;

      const overscanCountResolved =
        overscanColumnCount || overscanColumnsCount || overscanCount || 1;

      if (columnCount === 0 || rowCount === 0) {
        return [0, 0, 0, 0];
      }

      const startIndex = getColumnStartIndexForOffset(
        this.props,
        scrollLeft,
        this._instanceProps,
      );
      const stopIndex = getColumnStopIndexForStartIndex(
        this.props,
        startIndex,
        scrollLeft,
        this._instanceProps,
      );

      // Overscan by one item in each direction so that tab/focus works.
      // If there isn't at least one extra item, tab loops back around.
      const overscanBackward =
        !isScrolling || horizontalScrollDirection === 'backward'
          ? Math.max(1, overscanCountResolved)
          : 1;
      const overscanForward =
        !isScrolling || horizontalScrollDirection === 'forward'
          ? Math.max(1, overscanCountResolved)
          : 1;

      return [
        Math.max(0, startIndex - overscanBackward),
        Math.max(0, Math.min(columnCount - 1, stopIndex + overscanForward)),
        startIndex,
        stopIndex,
      ];
    }

    _getVerticalRangeToRender() {
      const {
        columnCount,
        overscanCount,
        overscanRowCount,
        overscanRowsCount,
        rowCount,
      } = this.props;
      const { isScrolling, verticalScrollDirection, scrollTop } = this.state;

      const overscanCountResolved =
        overscanRowCount || overscanRowsCount || overscanCount || 1;

      if (columnCount === 0 || rowCount === 0) {
        return [0, 0, 0, 0];
      }

      const startIndex = getRowStartIndexForOffset(
        this.props,
        scrollTop,
        this._instanceProps,
      );
      const stopIndex = getRowStopIndexForStartIndex(
        this.props,
        startIndex,
        scrollTop,
        this._instanceProps,
      );

      // Overscan by one item in each direction so that tab/focus works.
      // If there isn't at least one extra item, tab loops back around.
      const overscanBackward =
        !isScrolling || verticalScrollDirection === 'backward'
          ? Math.max(1, overscanCountResolved)
          : 1;
      const overscanForward =
        !isScrolling || verticalScrollDirection === 'forward'
          ? Math.max(1, overscanCountResolved)
          : 1;

      return [
        Math.max(0, startIndex - overscanBackward),
        Math.max(0, Math.min(rowCount - 1, stopIndex + overscanForward)),
        startIndex,
        stopIndex,
      ];
    }

    _onScroll = (event) => {
      const {
        clientHeight,
        clientWidth,
        scrollLeft,
        scrollTop,
        scrollHeight,
        scrollWidth,
      } = event.currentTarget;
      this.setState((prevState) => {
        if (
          prevState.scrollLeft === scrollLeft &&
          prevState.scrollTop === scrollTop
        ) {
          // Scroll position may have been updated by cDM/cDU,
          // In which case we don't need to trigger another render,
          // And we don't want to update state.isScrolling.
          return null;
        }

        // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
        // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
        // It's also easier for this component if we convert offsets to the same format as they would be in for ltr.
        // So the simplest solution is to determine which browser behavior we're dealing with, and convert based on it.
        let calculatedScrollLeft = scrollLeft;

        // Prevent Safari's elastic scrolling from causing visual shaking when scrolling past bounds.
        calculatedScrollLeft = Math.max(
          0,
          Math.min(calculatedScrollLeft, scrollWidth - clientWidth),
        );
        const calculatedScrollTop = Math.max(
          0,
          Math.min(scrollTop, scrollHeight - clientHeight),
        );

        return {
          isScrolling: true,
          horizontalScrollDirection:
            prevState.scrollLeft < scrollLeft ? 'forward' : 'backward',
          scrollLeft: calculatedScrollLeft,
          scrollTop: calculatedScrollTop,
          verticalScrollDirection:
            prevState.scrollTop < scrollTop ? 'forward' : 'backward',
          scrollUpdateWasRequested: false,
        };
      });
    };

    _outerRefSetter = (ref) => {
      const { outerRef } = this.props;

      this._outerRef = ref;

      if (typeof outerRef === 'function') {
        outerRef(ref);
      } else if (
        outerRef != null &&
        typeof outerRef === 'object' &&
        outerRef.hasOwnProperty('current')
      ) {
        outerRef.current = ref;
      }
    };
  };
}

const getEstimatedTotalHeight = (
  { rowCount },
  { rowMetadataMap, estimatedRowHeight, lastMeasuredRowIndex },
) => {
  let totalSizeOfMeasuredRows = 0;

  // Edge case check for when the number of items decreases while a scroll is in progress.
  // https://github.com/bvaughn/react-window/pull/138
  if (lastMeasuredRowIndex >= rowCount) {
    lastMeasuredRowIndex = rowCount - 1;
  }

  if (lastMeasuredRowIndex >= 0) {
    const itemMetadata = rowMetadataMap[lastMeasuredRowIndex];
    totalSizeOfMeasuredRows = itemMetadata.offset + itemMetadata.size;
  }

  const numUnmeasuredItems = rowCount - lastMeasuredRowIndex - 1;
  const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedRowHeight;

  return totalSizeOfMeasuredRows + totalSizeOfUnmeasuredItems;
};
const getEstimatedTotalWidth = (
  { columnCount },
  { columnMetadataMap, estimatedColumnWidth, lastMeasuredColumnIndex },
) => {
  let totalSizeOfMeasuredRows = 0;

  // Edge case check for when the number of items decreases while a scroll is in progress.
  // https://github.com/bvaughn/react-window/pull/138
  if (lastMeasuredColumnIndex >= columnCount) {
    lastMeasuredColumnIndex = columnCount - 1;
  }

  if (lastMeasuredColumnIndex >= 0) {
    const itemMetadata = columnMetadataMap[lastMeasuredColumnIndex];
    totalSizeOfMeasuredRows = itemMetadata.offset + itemMetadata.size;
  }

  const numUnmeasuredItems = columnCount - lastMeasuredColumnIndex - 1;
  const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedColumnWidth;

  return totalSizeOfMeasuredRows + totalSizeOfUnmeasuredItems;
};

const getItemMetadata = (itemType, props, index, instanceProps) => {
  let itemMetadataMap;
  let itemSize;
  let lastMeasuredIndex;
  if (itemType === 'column') {
    itemMetadataMap = instanceProps.columnMetadataMap;
    itemSize = props.columnWidth;
    lastMeasuredIndex = instanceProps.lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = instanceProps.rowMetadataMap;
    itemSize = props.rowHeight;
    lastMeasuredIndex = instanceProps.lastMeasuredRowIndex;
  }

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

    if (itemType === 'column') {
      instanceProps.lastMeasuredColumnIndex = index;
    } else {
      instanceProps.lastMeasuredRowIndex = index;
    }
  }

  return itemMetadataMap[index];
};

//* 从metaData中 找到最近的item
const findNearestItem = (itemType, props, instanceProps, offset) => {
  let itemMetadataMap;
  let lastMeasuredIndex;
  if (itemType === 'column') {
    itemMetadataMap = instanceProps.columnMetadataMap;
    lastMeasuredIndex = instanceProps.lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = instanceProps.rowMetadataMap;
    lastMeasuredIndex = instanceProps.lastMeasuredRowIndex;
  }

  const lastMeasuredItemOffset =
    lastMeasuredIndex > 0 ? itemMetadataMap[lastMeasuredIndex].offset : 0;

  if (lastMeasuredItemOffset >= offset) {
    // If we've already measured items within this range just use a binary search as it's faster.
    return findNearestItemBinarySearch(
      itemType,
      props,
      instanceProps,
      lastMeasuredIndex,
      0,
      offset,
    );
  } else {
    // If we haven't yet measured this high, fallback to an exponential search with an inner binary search.
    // The exponential search avoids pre-computing sizes for the full set of items as a binary search would.
    // The overall complexity for this approach is O(log n).
    return findNearestItemExponentialSearch(
      itemType,
      props,
      instanceProps,
      Math.max(0, lastMeasuredIndex),
      offset,
    );
  }
};

// * 排序后快速找到相邻的item
const findNearestItemBinarySearch = (
  itemType,
  props,
  instanceProps,
  high,
  low,
  offset,
) => {
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const currentOffset = getItemMetadata(
      itemType,
      props,
      middle,
      instanceProps,
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
};

// * 不省时的搜索
const findNearestItemExponentialSearch = (
  itemType,
  props,
  instanceProps,
  index,
  offset,
) => {
  const itemCount = itemType === 'column' ? props.columnCount : props.rowCount;
  let interval = 1;

  while (
    index < itemCount &&
    getItemMetadata(itemType, props, index, instanceProps).offset < offset
  ) {
    index += interval;
    interval *= 2;
  }

  return findNearestItemBinarySearch(
    itemType,
    props,
    instanceProps,
    Math.min(index, itemCount - 1),
    Math.floor(index / 2),
    offset,
  );
};

// * 暂不需要 scrollTo 相关
const getOffsetForIndexAndAlignment = (
  itemType,
  props,
  index,
  align,
  scrollOffset,
  instanceProps,
  scrollbarSize,
) => {
  const size = itemType === 'column' ? props.width : props.height;
  const itemMetadata = getItemMetadata(itemType, props, index, instanceProps);

  // Get estimated total size after ItemMetadata is computed,
  // To ensure it reflects actual measurements instead of just estimates.
  const estimatedTotalSize =
    itemType === 'column'
      ? getEstimatedTotalWidth(props, instanceProps)
      : getEstimatedTotalHeight(props, instanceProps);

  const maxOffset = Math.max(
    0,
    Math.min(estimatedTotalSize - size, itemMetadata.offset),
  );
  const minOffset = Math.max(
    0,
    itemMetadata.offset - size + scrollbarSize + itemMetadata.size,
  );

  if (align === 'smart') {
    if (scrollOffset >= minOffset - size && scrollOffset <= maxOffset + size) {
      align = 'auto';
    } else {
      align = 'center';
    }
  }

  switch (align) {
    case 'start':
      return maxOffset;
    case 'end':
      return minOffset;
    case 'center':
      return Math.round(minOffset + (maxOffset - minOffset) / 2);
    case 'auto':
    default:
      if (scrollOffset >= minOffset && scrollOffset <= maxOffset) {
        return scrollOffset;
      } else if (minOffset > maxOffset) {
        // Because we only take into account the scrollbar size when calculating minOffset
        // this value can be larger than maxOffset when at the end of the list
        return minOffset;
      } else if (scrollOffset < minOffset) {
        return minOffset;
      } else {
        return maxOffset;
      }
  }
};

const VariableSizeGrid = createGridComponent({
  getColumnOffset: (props, index, instanceProps) =>
    getItemMetadata('column', props, index, instanceProps).offset,

  getColumnStartIndexForOffset: (props, scrollLeft, instanceProps) =>
    findNearestItem('column', props, instanceProps, scrollLeft),

  getColumnStopIndexForStartIndex: (
    props,
    startIndex,
    scrollLeft,
    instanceProps,
  ) => {
    const { columnCount, width } = props;

    const itemMetadata = getItemMetadata(
      'column',
      props,
      startIndex,
      instanceProps,
    );
    const maxOffset = scrollLeft + width;

    let offset = itemMetadata.offset + itemMetadata.size;
    let stopIndex = startIndex;

    while (stopIndex < columnCount - 1 && offset < maxOffset) {
      stopIndex++;
      offset += getItemMetadata('column', props, stopIndex, instanceProps).size;
    }

    return stopIndex;
  },

  getColumnWidth: (props, index, instanceProps) =>
    instanceProps.columnMetadataMap[index].size,

  getEstimatedTotalHeight,
  getEstimatedTotalWidth,

  getOffsetForColumnAndAlignment: (
    props,
    index,
    align,
    scrollOffset,
    instanceProps,
    scrollbarSize,
  ) =>
    getOffsetForIndexAndAlignment(
      'column',
      props,
      index,
      align,
      scrollOffset,
      instanceProps,
      scrollbarSize,
    ),

  getOffsetForRowAndAlignment: (
    props,
    index,
    align,
    scrollOffset,
    instanceProps,
    scrollbarSize,
  ) =>
    getOffsetForIndexAndAlignment(
      'row',
      props,
      index,
      align,
      scrollOffset,
      instanceProps,
      scrollbarSize,
    ),

  getRowOffset: (props, index, instanceProps) =>
    getItemMetadata('row', props, index, instanceProps).offset,

  getRowHeight: (props, index, instanceProps) =>
    instanceProps.rowMetadataMap[index].size,

  getRowStartIndexForOffset: (props, scrollTop, instanceProps) =>
    findNearestItem('row', props, instanceProps, scrollTop),

  //* 获取当前结束展示的StopIndex
  getRowStopIndexForStartIndex: (
    props,
    startIndex,
    scrollTop,
    instanceProps,
  ) => {
    const { rowCount, height } = props;

    const itemMetadata = getItemMetadata(
      'row',
      props,
      startIndex,
      instanceProps,
    );
    const maxOffset = scrollTop + height;

    let offset = itemMetadata.offset + itemMetadata.size;
    let stopIndex = startIndex;

    while (stopIndex < rowCount - 1 && offset < maxOffset) {
      stopIndex++;
      offset += getItemMetadata('row', props, stopIndex, instanceProps).size;
    }

    return stopIndex;
  },

  initInstanceProps(props, instance) {
    const { estimatedColumnWidth, estimatedRowHeight } = props;

    const instanceProps = {
      columnMetadataMap: {},
      estimatedColumnWidth: estimatedColumnWidth || 50,
      estimatedRowHeight: estimatedRowHeight || 50,
      lastMeasuredColumnIndex: -1,
      lastMeasuredRowIndex: -1,
      rowMetadataMap: {},
    };

    instance.resetAfterColumnIndex = (columnIndex, shouldForceUpdate) => {
      instance.resetAfterIndices({ columnIndex, shouldForceUpdate });
    };

    instance.resetAfterRowIndex = (rowIndex, shouldForceUpdate) => {
      instance.resetAfterIndices({ rowIndex, shouldForceUpdate });
    };

    instance.resetAfterIndices = ({
      columnIndex,
      rowIndex,
      shouldForceUpdate = true,
    }) => {
      if (typeof columnIndex === 'number') {
        instanceProps.lastMeasuredColumnIndex = Math.min(
          instanceProps.lastMeasuredColumnIndex,
          columnIndex - 1,
        );
      }
      if (typeof rowIndex === 'number') {
        instanceProps.lastMeasuredRowIndex = Math.min(
          instanceProps.lastMeasuredRowIndex,
          rowIndex - 1,
        );
      }

      // We could potentially optimize further by only evicting styles after this index,
      // But since styles are only cached while scrolling is in progress-
      // It seems an unnecessary optimization.
      // It's unlikely that resetAfterIndex() will be called while a user is scrolling.
      instance._getItemStyleCache(-1);

      if (shouldForceUpdate) {
        instance.forceUpdate();
      }
    };

    return instanceProps;
  },

  shouldResetStyleCacheOnItemSizeChange: false,
});

export default VariableSizeGrid;
