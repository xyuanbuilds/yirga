import * as React from 'react';
import Grid from './Grid';
import Header from './Header';
import useFilters, { getFilteredData } from './hooks/useFilters/index';
import useSorters, { getSortData } from './hooks/useSorters/index';
// import useTimeoutLock from './hooks/useTimeoutLock';
import {
  ColumnType,
  FiltersProps,
  ColumnWidth,
  SortersProps,
} from './interface';
import './index.css';

const EMPTY_SCROLL_TARGET = {};

interface TableWrapperProps<T = Record<string, unknown>> {
  columns: ColumnType<T>[];
  dataSource: T[];
  columnWidth: ColumnWidth;
  rowHeight: number | ((index: number) => number);
  height: number; // 表格容器高
  width: number; // 表格容器宽
  headerHeight?: number; // 表头高度
  filters?: FiltersProps<T>;
  sorters?: SortersProps<T>;
}

const defaultColumns = [];
const defaultDataSource = [];
const InitialWrapper = ({
  columns: originColumns = defaultColumns,
  dataSource = defaultDataSource,
  columnWidth = 100,
  rowHeight = 48,
  height,
  width,
  headerHeight = 48,
  filters,
  sorters,
}: TableWrapperProps) => {
  const bodyContainerRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const gridRef = React.useRef<import('./Grid').GridRefObj>();

  const [diffedColumns, setColumn] = React.useState(
    diffColumnsWidth(originColumns, columnWidth),
  );

  const headerSetCol = React.useCallback((index, newColumAction) => {
    if (gridRef.current) {
      gridRef.current.measuredInfos.current.lastMeasuredColumnIndex = index - 1;
    }

    setColumn(newColumAction);
  }, []);
  React.useEffect(() => {
    setColumn(diffColumnsWidth(originColumns, columnWidth));
  }, [originColumns, columnWidth]);

  // ---------- scroll ----------
  const setScrollStyles = React.useCallback((target) => {
    const {
      clientHeight,
      clientWidth,
      scrollLeft,
      scrollTop,
      scrollHeight,
      scrollWidth,
    } = target;
    const actualLeft = Math.max(
      0,
      Math.min(scrollLeft, scrollWidth - clientWidth),
    );
    const actualTop = Math.max(
      0,
      Math.min(scrollTop, scrollHeight - clientHeight),
    );

    if (headerRef.current)
      // headerRef.current.style.transform = `translate3d(${-actualLeft}px, 0px, 0px)`;
      headerRef.current.scrollLeft = actualLeft;

    if (gridRef.current) {
      gridRef.current.scrollTo({
        scrollTop: actualTop,
        scrollLeft: actualLeft,
      });
    }
  }, []);
  const onScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      event.preventDefault();
      event.stopPropagation();

      const compareTarget =
        event.currentTarget || event.target || EMPTY_SCROLL_TARGET;
      setScrollStyles(compareTarget);
    },
    [],
  );

  // ---------- Filters ----------
  const [filterStates, filterRenders] = useFilters({
    filters,
    columns: originColumns,
  });

  const [sortStates, sorterRenders] = useSorters({
    sorters,
    columns: originColumns,
  });
  console.log('filterStates', filterStates);
  const renderHeader = () => {
    return (
      <div
        style={{ height: headerHeight }}
        ref={headerRef}
        className="table-header-translate-wrapper"
      >
        <Header
          filters={filterRenders}
          sorters={sorterRenders}
          columns={diffedColumns}
          setColumn={headerSetCol}
        />
      </div>
    );
  };

  const diffedDataSource = React.useMemo(
    () => getSortData(getFilteredData(dataSource, filterStates), sortStates),
    [dataSource, filterStates, sortStates, getSortData],
  );

  const columnCount = diffedColumns.length;
  const rowCount = diffedDataSource.length;

  // TODO 需要优化，减少 grid 所需参数的暴露
  const getColumnWidth = React.useCallback(
    (index) => {
      return diffedColumns[index].width;
    },
    [diffedColumns],
  );
  const renderBody = () => {
    return (
      <div
        onScroll={onScroll}
        ref={bodyContainerRef}
        className="table-scroll-wrapper"
        style={{
          height: height - headerHeight - 1,
          width: width - 1,
        }}
      >
        <Grid
          ref={gridRef}
          columns={diffedColumns}
          columnCount={columnCount}
          rowCount={rowCount}
          columnWidth={getColumnWidth}
          container={bodyContainerRef}
          rowHeight={rowHeight}
          dataSource={diffedDataSource}
          containerHeight={height - headerHeight - 1} // 减去表头 减去外框border-top
          containerWidth={width - 1} // 减去外框border-left
        />
      </div>
    );
  };

  return (
    <div className="table-wrapper">
      {renderHeader()}
      {renderBody()}
    </div>
  );
};

type InnerColumn = {
  key: string;
  width: number; // 渲染宽度
  offset: number; // left / top 偏移量
};
function diffColumnsWidth<T>(
  originColumns: ColumnType<T>[],
  columnWidth,
): InnerColumn[] {
  const diffed = originColumns.reduce<InnerColumn[]>((pre, cur, index) => {
    const c = Object.defineProperties(cur, {
      width: defaultDescriptor(
        typeof columnWidth === 'function' ? columnWidth(index) : columnWidth,
      ),
      offset: defaultDescriptor(
        index === 0 ? 0 : pre[index - 1].offset + pre[index - 1].width,
      ),
    });

    pre.push(c);
    return pre;
  }, []);
  return diffed;
}

function defaultDescriptor(value: unknown) {
  return {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  };
}

export default InitialWrapper;
