import * as React from 'react';
import { Empty } from 'antd';
import Grid from './Grid';
// import bindRaf from './utils/bindRaf';
import Header from './Header';
import useColumns from './hooks/useColumns';
import useFilters, { getFilteredData } from './hooks/useFilters/index';
import useSorters, { getSortedData } from './hooks/useSorters/index';
import {
  ColumnType,
  FiltersProps,
  ColumnWidth,
  SortersProps,
} from './interface';
import styles from './index.less';

const EMPTY_SCROLL_TARGET = {};

interface TableWrapperProps<T = Record<string, unknown>> {
  columns: ColumnType<T>[];
  dataSource: T[];
  columnWidth?: ColumnWidth;
  rowHeight?: number | ((index: number) => number);
  height: number; // 表格容器高
  width: number; // 表格容器宽
  headerHeight?: number; // 表头高度
  filters?: FiltersProps<T>;
  sorters?: SortersProps<T>;
}

const defaultColumns = [];
const defaultDataSource = [];
const InitialWrapper = <T extends unknown>({
  columns: originColumns = defaultColumns,
  dataSource = defaultDataSource,
  columnWidth = 120,
  rowHeight = 48,
  height,
  width,
  headerHeight = 48,
  filters,
  sorters,
}: TableWrapperProps<T>) => {
  const bodyContainerRef = React.useRef<HTMLDivElement>(null!);
  const headerRef = React.useRef<HTMLDivElement>(null!);
  const gridRef = React.useRef<React.ElementRef<typeof Grid>>(null!);

  const [diffedColumns, setColumn] = useColumns<T>(
    originColumns,
    width - 1,
    columnWidth,
  );

  // * 头部 cell 改变 columns
  const headerSetCol = React.useCallback((index, newColumAction) => {
    if (gridRef.current)
      gridRef.current.measuredInfos.current.lastMeasuredColumnIndex = index - 1;
    setColumn(newColumAction);
  }, []);

  const gridScroll = React.useCallback((actualTop, actualLeft) => {
    if (gridRef.current)
      gridRef.current.scrollTo({
        scrollTop: actualTop,
        scrollLeft: actualLeft,
      });
  }, []);

  // // * 重算 column width
  // React.useLayoutEffect(() => {
  //   setColumn(diffColumns(originColumns, width, columnWidth));
  // }, [originColumns, columnWidth, width]);

  // ---------- scroll -----------
  const setScrollStyles = React.useCallback(
    ({
      clientHeight,
      clientWidth,
      scrollLeft,
      scrollTop,
      scrollHeight,
      scrollWidth,
    }) => {
      const actualLeft = Math.max(
        0,
        Math.min(scrollLeft, scrollWidth - clientWidth),
      );
      const actualTop = Math.max(
        0,
        Math.min(scrollTop, scrollHeight - clientHeight),
      );

      // headerRef.current.style.transform = `translate3d(${-actualLeft}px, 0px, 0px)`;
      forceScroll(actualLeft, headerRef.current);
      gridScroll(actualTop, actualLeft);
    },
    [],
  );

  // const [setScrollTarget, getScrollTarget] = useTimeoutLock();

  const onScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      event.preventDefault();
      event.stopPropagation();

      const compareTarget = event.currentTarget || EMPTY_SCROLL_TARGET;
      setScrollStyles(compareTarget);
    },
    [],
  );

  // ---------- Filters ----------
  const [filterStates, filterRenders] = useFilters({
    filters,
    columns: originColumns,
  });

  // ---------- Sorters ----------
  const [sortStates, sorterRenders] = useSorters({
    sorters,
    columns: originColumns,
  });

  const diffedDataSource = React.useMemo(
    () => getSortedData(getFilteredData(dataSource, filterStates), sortStates),
    [dataSource, filterStates, sortStates],
  );
  const columnCount = diffedColumns.length;
  const rowCount = diffedDataSource.length;

  const getColumnWidth = React.useCallback(
    (index) => {
      return diffedColumns[index].width;
    },
    [diffedColumns],
  );

  const bodyStyle = React.useMemo(() => {
    let actualContentHeight = 0;
    if (typeof rowHeight === 'number') {
      actualContentHeight = diffedDataSource.length * rowHeight;
    }
    const bodyHeight = height - headerHeight - 1;

    return {
      height:
        bodyHeight > actualContentHeight && actualContentHeight !== 0
          ? actualContentHeight
          : diffedDataSource.length === 0
          ? 200
          : bodyHeight,
      width: width - 1,
    };
  }, [height, headerHeight, width, rowHeight, diffedDataSource]);

  const renderHeader = React.useMemo(() => {
    return (
      <div
        style={{ height: headerHeight }}
        ref={headerRef}
        className={styles.tableHeaderTranslateWrapper}
      >
        <Header
          wrapperHeight={bodyStyle.height + headerHeight}
          filters={filterRenders}
          sorters={sorterRenders}
          columns={diffedColumns}
          setColumn={headerSetCol}
        />
      </div>
    );
  }, [filterRenders, sorterRenders, diffedColumns, bodyStyle]);

  const empty =
    !Array.isArray(diffedDataSource) || diffedDataSource.length === 0;

  const renderBody = () => {
    return (
      <div
        onScroll={onScroll}
        ref={bodyContainerRef}
        className={styles.tableScrollWrapper}
        style={bodyStyle}
      >
        {empty ? (
          <Empty
            className={styles.tableEmpty}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Grid
            ref={gridRef}
            columns={diffedColumns}
            rowCount={rowCount}
            columnWidth={getColumnWidth}
            container={bodyContainerRef}
            rowHeight={rowHeight}
            dataSource={diffedDataSource}
            containerHeight={bodyStyle.height} // 减去表头 减去外框border-top
            containerWidth={bodyStyle.width} // 减去外框border-left
          />
        )}
      </div>
    );
  };

  return (
    <div className={styles.tableWrapper}>
      {renderHeader}
      {renderBody()}
    </div>
  );
};

function forceScroll(
  scrollLeft: number,
  target: HTMLDivElement | ((left: number) => void),
) {
  if (!target) {
    return;
  }
  if (typeof target === 'function') {
    target(scrollLeft);
  } else if (target.scrollLeft !== scrollLeft) {
    // eslint-disable-next-line no-param-reassign
    target.scrollLeft = scrollLeft;
  }
}

export default InitialWrapper;
