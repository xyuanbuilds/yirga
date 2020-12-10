import * as React from 'react';
import { Empty } from 'antd';
import Grid from './GridClass';
import Header from './Header';
import useColumns from './hooks/useColumns';
import useTimeoutLock from './hooks/useTimeoutLock';
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
      gridRef.current.measuredInfos.lastMeasuredColumnIndex = index - 1;
    setColumn(newColumAction);
  }, []);

  // ---------- scroll -----------
  const [setScrollTarget, getScrollTarget] = useTimeoutLock<
    HTMLElement | typeof EMPTY_SCROLL_TARGET
  >();

  const onScroll = React.useCallback(
    ({
      currentTarget,
      scrollLeft,
    }: {
      currentTarget: HTMLElement;
      scrollLeft?: number;
    }) => {
      const mergedScrollLeft =
        typeof scrollLeft === 'number'
          ? scrollLeft
          : (currentTarget as HTMLElement).scrollLeft;

      const compareTarget = currentTarget || EMPTY_SCROLL_TARGET;
      if (!getScrollTarget() || getScrollTarget() === compareTarget) {
        setScrollTarget(compareTarget);

        forceScroll(mergedScrollLeft, headerRef.current);
        // forceScroll(mergedScrollLeft, bodyContainerRef.current);
        if (gridRef.current)
          gridRef.current.scrollTo({
            scrollLeft: mergedScrollLeft,
          });
      }
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

  // const [connectObject] = React.useState(() => {
  //   const obj = {};
  //   Object.defineProperty(obj, 'scrollLeft', {
  //     get: () => null,
  //     set: (scrollLeft) => {
  //       if (gridRef.current) {
  //         console.log('what get ', scrollLeft);
  //         gridRef.current.scrollTo({
  //           scrollLeft,
  //         });
  //       }
  //     },
  //   });
  //   return obj;
  // });
  // const triggerOnScroll = () => {
  //   if (bodyContainerRef.current) {
  //     onScroll({ currentTarget: bodyContainerRef.current } as React.UIEvent<
  //       HTMLDivElement
  //     >);
  //   }
  // };
  // React.useEffect(() => {
  //   bodyContainerRef.current = connectObject;
  //   triggerOnScroll();
  // }, []);

  const headerEl = React.useMemo(() => {
    return (
      <div
        style={{ height: headerHeight }}
        ref={headerRef}
        className={styles.tableHeaderTranslateWrapper}
        onScroll={onScroll}
      >
        <div
          style={{
            height: '100%',
            width: diffedColumns.reduce((res, cur) => res + cur.width, 0),
          }}
        >
          <Header
            wrapperHeight={bodyStyle.height + headerHeight}
            filters={filterRenders}
            sorters={sorterRenders}
            columns={diffedColumns}
            setColumn={headerSetCol}
          />
        </div>
      </div>
    );
  }, [filterRenders, sorterRenders, diffedColumns, bodyStyle]);

  const empty =
    !Array.isArray(diffedDataSource) || diffedDataSource.length === 0;

  const renderBody = () => {
    return (
      <>
        {empty ? (
          <Empty
            className={styles.tableEmpty}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Grid
            ref={gridRef}
            columns={diffedColumns}
            columnWidth={getColumnWidth}
            container={bodyContainerRef}
            rowHeight={rowHeight}
            dataSource={diffedDataSource}
            containerHeight={bodyStyle.height} // 减去表头 减去外框border-top
            containerWidth={bodyStyle.width} // 减去外框border-left
            onScroll={({ scrollLeft }) => {
              onScroll({ scrollLeft });
            }}
            className={styles.tableScrollWrapper}
            style={bodyStyle}
          />
        )}
      </>
    );
  };

  return (
    <div className={styles.tableWrapper}>
      {headerEl}
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
