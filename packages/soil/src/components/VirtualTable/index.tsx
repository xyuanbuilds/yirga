import * as React from 'react';
import { Spin } from 'antd';
import classNames from 'classnames';
import ResizeObserver from 'rc-resize-observer';
import { useDebounceFn } from '@umijs/hooks';
import type { SpinProps } from 'antd/lib/spin';
import Grid from './GridClass';
import Header from './Header';
import EmptyTable from './EmptyTable';
import useColumns from './hooks/useColumns';
import useTimeoutLock from './hooks/useTimeoutLock';
import useFilters, { getFilteredData } from './hooks/useFilters/index';
import useSorters, { getSortedData } from './hooks/useSorters/index';
import getScrollBarSize from './utils/getScrollBarSize';
import type { ColumnType, FiltersProps, SortersProps } from './interface';
import styles from './index.less';

/* -------- basic states -------- */
const defaultColumns = [];
const defaultDataSource = [];
const EMPTY_SCROLL_TARGET = {};
const FIXED_BORDER_LEFT = 1;
const INITIAL__HEADER_HEIGHT = 48;
const INITIAL__ROW_HEIGHT = 48;
const INITIAL__COLUMN_WIDTH = 120;
const INITIAL_COLUMN_MIN_WIDTH = 45;

interface TableWrapperProps<T = Record<string, React.ReactNode>> {
  /** 表格列描述对象 */
  columns: ColumnType<T>[];
  /** 表格单元格展示内容 */
  dataSource: T[];
  /** 表格行ClassName */
  rowClassName?: string;
  /** 表格列宽，除定制，不需传递，表格自适应容器宽带 */
  columnWidth?: number | ((index: number) => number);
  /** 表格是否拥有边框 */
  bordered?: boolean;
  /** 表格行高，默认规范48 */
  rowHeight?: number | ((index: number) => number);
  /** 表格容器高，不传递表格不会随外部容器变化 */
  height?: number;
  /** 表格容器宽，不传递表格不会随外部容器变化 */
  width?: number;
  /** 表格 列 最小宽，不传递默认为45 */
  minColumnWidth?: number;
  /** 表头高度，默认规范 48 */
  headerHeight?: number;
  /** 表格 loading */
  loading?: boolean | SpinProps;
  filters?: FiltersProps<T>;
  sorters?: SortersProps<T>;
}

const BasicWrapper = <RecordType extends Record<string, React.ReactNode>>({
  columns: originColumns = defaultColumns,
  dataSource = defaultDataSource,
  height: propsHeight,
  width: propsWidth,
  columnWidth = INITIAL__COLUMN_WIDTH,
  rowHeight = INITIAL__ROW_HEIGHT,
  headerHeight = INITIAL__HEADER_HEIGHT,
  minColumnWidth = INITIAL_COLUMN_MIN_WIDTH,
  bordered = true,
  filters,
  sorters,
  rowClassName,
  loading,
}: TableWrapperProps<RecordType>) => {
  // ------- DOM & styles ------
  // * 表格容器宽高
  const [{ width, height }, setContainer] = React.useState({
    width: propsHeight || 0,
    height: propsWidth || 0,
  });
  const { run: setContainerDebounced } = useDebounceFn(
    (action: Parameters<typeof setContainer>[0]) => setContainer(action),
    100,
  );
  // * 表格容器宽高受外部控制
  React.useEffect(() => {
    setContainerDebounced((prev) => {
      if (propsWidth === prev.width && propsHeight === prev.height) return prev;
      return {
        width: numberCheck(propsWidth, prev.width),
        height: numberCheck(propsHeight, prev.height),
      };
    });
  }, [propsWidth, propsHeight]);

  // * 表体容器DOM
  const bodyContainerRef = React.useRef<HTMLDivElement>(null!);
  // * 表头容器DOM
  const headerContainerRef = React.useRef<HTMLDivElement>(null!);
  // * 虚拟网格实例
  const gridRef = React.useRef<Grid<RecordType>>(null!);

  // ===================== Effects ======================
  const [scrollbarSize, setScrollbarSize] = React.useState(8);
  React.useEffect(() => {
    setScrollbarSize(getScrollBarSize());
  });

  // --------- column ------------
  const [bodyScrollBar, setBodyScrollBar] = React.useState(() => ({
    x: !(
      (typeof columnWidth === 'number'
        ? originColumns.length * columnWidth
        : originColumns.reduce(
            (res, _, index) => res + columnWidth(index),
            0,
          )) <
      width - FIXED_BORDER_LEFT
    ),
    y:
      height - headerHeight <
      (typeof rowHeight === 'number'
        ? dataSource.length * rowHeight
        : dataSource.reduce((res, _, index) => res + rowHeight(index), 0)),
  }));
  const [diffedColumns, setColumn] = useColumns<RecordType>(
    originColumns,
    width -
      (bordered ? FIXED_BORDER_LEFT : 0) -
      (bodyScrollBar.y ? scrollbarSize : 0),
    columnWidth,
    minColumnWidth,
  );

  // * 头部 cell 改变 columns
  const headerSetCol = React.useCallback((index: number, newColumAction) => {
    if (gridRef.current) {
      gridRef.current.resetColFrom(index);
    }
    setColumn(newColumAction);
  }, []);

  // ---------- scroll -----------
  const [setScrollTarget, getScrollTarget] = useTimeoutLock<
    HTMLElement | typeof EMPTY_SCROLL_TARGET
  >();

  const leftScrollingSync = ({
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

      forceScroll(mergedScrollLeft, headerContainerRef.current);

      if (gridRef.current)
        gridRef.current.scrollTo({
          scrollLeft: mergedScrollLeft,
        });
    }
  };

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

  const contentWidth = React.useMemo(
    () => diffedColumns.reduce((res, cur) => res + cur.width, 0),
    [diffedColumns],
  );
  const contentHeight = React.useMemo(
    () =>
      typeof rowHeight === 'number'
        ? diffedDataSource.length * rowHeight
        : diffedDataSource.reduce((res, _, index) => res + rowHeight(index), 0),
    [rowHeight, diffedDataSource, rowHeight],
  );

  React.useEffect(() => {
    const bodyHeight = height - headerHeight;
    const bodyWidth = width - (bordered ? FIXED_BORDER_LEFT : 0);
    const x = bodyWidth < contentWidth;
    const y = bodyHeight < contentHeight;
    setBodyScrollBar((prevBar) => {
      if (prevBar.x !== x || prevBar.y !== y) {
        return { x, y };
      }
      return prevBar;
    });
  }, [contentWidth, contentHeight, width, height, bordered, headerHeight]);

  // * 滚动容器宽高等基本样式
  const bodyStyle = React.useMemo(() => {
    let actualContentHeight = 0;
    if (typeof rowHeight === 'number') {
      actualContentHeight =
        diffedDataSource.length * rowHeight +
        (bodyScrollBar.x ? scrollbarSize : 0);
    }
    const bodyHeight = height - headerHeight;

    return {
      height:
        bodyHeight > actualContentHeight && actualContentHeight !== 0
          ? actualContentHeight
          : diffedDataSource.length === 0
          ? 200
          : bodyHeight,
      width,
    };
  }, [
    height,
    headerHeight,
    width,
    rowHeight,
    diffedDataSource,
    bordered,
    bodyScrollBar.x,
    scrollbarSize,
  ]);

  React.useEffect(() => {
    function onWheel(e: WheelEvent) {
      const { currentTarget, deltaX } = (e as unknown) as React.WheelEvent<
        HTMLDivElement
      >;
      if (deltaX) {
        leftScrollingSync({
          currentTarget,
          scrollLeft: currentTarget.scrollLeft + deltaX,
        });
        e.preventDefault();
      }
    }
    headerContainerRef.current?.addEventListener('wheel', onWheel);

    return () => {
      headerContainerRef.current?.removeEventListener('wheel', onWheel);
    };
  }, []);
  const headerEl = React.useMemo(() => {
    const headerWrapperClassNames = classNames(
      styles.tableHeaderScrollWrapper,
      {
        [styles.noBorder]: !bordered,
      },
    );
    return (
      <div
        style={{ height: headerHeight }}
        ref={headerContainerRef}
        className={headerWrapperClassNames}
        onScroll={leftScrollingSync}
      >
        <div
          style={{
            height: '100%',
            width:
              diffedColumns.length > 0
                ? diffedColumns.reduce((res, cur) => res + cur.width, 0) +
                  (bodyScrollBar.y ? scrollbarSize : 0)
                : '100%',
          }}
        >
          <Header
            scrollbarSize={scrollbarSize}
            bodyScrollBar={bodyScrollBar}
            bordered={bordered}
            wrapperHeight={height}
            filters={filterRenders}
            sorters={sorterRenders}
            columns={diffedColumns}
            setColumn={headerSetCol}
          />
        </div>
      </div>
    );
  }, [
    filterRenders,
    sorterRenders,
    diffedColumns,
    height,
    bordered,
    bodyScrollBar.y,
    scrollbarSize,
  ]);

  const empty =
    !Array.isArray(diffedDataSource) || diffedDataSource.length === 0;
  const tableWrapperClassName = classNames(styles.tableScrollWrapper, {
    [styles.noBorder]: !bordered,
  });

  // >>>>>>>>> Spinning
  let spinProps: SpinProps | undefined;
  if (typeof loading === 'boolean') {
    spinProps = {
      spinning: loading,
    };
  } else if (typeof loading === 'object') {
    spinProps = {
      spinning: true,
      ...loading,
    };
  }

  const renderBody = () => {
    return (
      <>
        <Spin spinning={false} {...spinProps}>
          {empty || width === 0 || height === 0 ? (
            // <Empty
            //   style={{
            //     height: bodyStyle.height,
            //     borderLeft: '1px solid #e8e8e8',
            //   }}
            //   className={styles.tableEmpty}
            //   image={Empty.PRESENTED_IMAGE_SIMPLE}
            // />
            <EmptyTable
              bordered={bordered}
              width={width}
              height={height - headerHeight}
              syncScrollLeft={leftScrollingSync}
              headerWidth={contentWidth}
            />
          ) : (
            <Grid<RecordType>
              ref={gridRef}
              columns={diffedColumns}
              rowClassName={rowClassName}
              columnWidth={getColumnWidth}
              container={bodyContainerRef}
              rowHeight={rowHeight}
              syncScrollLeft={leftScrollingSync}
              dataSource={diffedDataSource}
              containerHeight={bodyStyle.height} // 减去表头 减去外框border-top
              containerWidth={bodyStyle.width} // 减去外框border-left
              className={tableWrapperClassName}
              bordered={bordered}
              style={bodyStyle}
            />
          )}
        </Spin>
      </>
    );
  };

  return (
    <ResizeObserver
      disabled={
        typeof propsHeight === 'number' &&
        propsHeight > 0 &&
        typeof propsWidth === 'number' &&
        propsWidth > 0
      }
      onResize={({ offsetHeight, offsetWidth }) => {
        setContainer({
          height: offsetHeight,
          width: offsetWidth,
        });
      }}
    >
      <div data-testid="table-resize-support" className={styles.resizeSupport}>
        <div
          style={{
            height: height || '100%',
            width: width || '100%',
          }}
          className={styles.tableWrapper}
        >
          {headerEl}
          {renderBody()}
        </div>
      </div>
    </ResizeObserver>
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

function numberCheck(v: unknown, defaultV?: number) {
  return typeof v === 'number' ? v : defaultV || 0;
}

export default BasicWrapper;
