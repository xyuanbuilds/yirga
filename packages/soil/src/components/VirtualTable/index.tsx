import * as React from 'react';
import Grid from './Grid';
import Header from './Header';
import bindRaf from './utils/bindRaf';
import './index.css';

type InnerColumn = {
  name: string;
  width?: number; // 渲染宽度
  offset?: number; // left / top 偏移量
};
interface DefaultProps<T = Record<string, unknown>> {
  columns: InnerColumn[];
  dataSource: T[];
  columnWidth: number | ((index: number) => number);
  rowHeight: number | ((index: number) => number);
  height: number; // 表格容器高
  width: number; // 表格容器宽
  headerHeight?: number; // 表头高度
}

const defaultColumns = [];
const defaultDataSource = [];
const InitialWrapper = React.memo(
  ({
    columns: originColumns = defaultColumns,
    dataSource = defaultDataSource,
    columnWidth = 100,
    rowHeight = 48,
    height,
    width,
    headerHeight = 48,
  }: DefaultProps) => {
    const columnCount = originColumns.length;
    const rowCount = dataSource.length;

    const bodyContainerRef = React.useRef<HTMLDivElement>(null);
    const headerRef = React.useRef<HTMLDivElement>(null);
    const gridRef = React.useRef<import('./Grid').GridRefObj>(null);

    const [diffedColumns, setColumn] = React.useState(
      diffColumns(originColumns, columnWidth),
    );

    const headerSetCol = React.useCallback(
      (index, newColumAction) => {
        if (gridRef.current)
          gridRef.current.measuredInfos.lastMeasuredColumnIndex = index - 1;
        setColumn(newColumAction);
      },
      [diffedColumns],
    );
    React.useEffect(() => {
      setColumn(diffColumns(originColumns, columnWidth));
    }, [originColumns, columnWidth]);

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
        headerRef.current.style.transform = `translate3d(${-scrollLeft}px, 0px, 0px)`;
      // headerRef.current.scrollLeft = scrollLeft;
      if (bodyContainerRef.current) {
        bodyContainerRef.current.scrollLeft = actualLeft;
        bodyContainerRef.current.scrollTop = actualTop;
      }
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
        setScrollStyles(event.currentTarget || event.target);
      },
      [],
    );

    const renderHeader = () => {
      return (
        <div
          style={{ height: headerHeight }}
          ref={headerRef}
          className="table-header-translate-wrapper"
        >
          <Header columns={diffedColumns} setColumn={headerSetCol} />
        </div>
      );
    };

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
            columnWidth={(index) => {
              return diffedColumns[index].width || columnWidth;
            }}
            rowHeight={rowHeight}
            dataSource={dataSource}
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
  },
);

function diffColumns(originColumns, columnWidth) {
  const diffed = originColumns.reduce((pre, cur, index) => {
    const c = Object.defineProperties(cur, {
      width: {
        value:
          typeof columnWidth === 'function' ? columnWidth(index) : columnWidth,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      offset: {
        value: index === 0 ? 0 : pre[index - 1].offset + pre[index - 1].width,
        writable: true,
        enumerable: true,
        configurable: true,
      },
    });

    pre.push(c);
    return pre;
  }, [] as { name: string; width: number; offset: number }[]);
  return diffed;
}

// function forceScroll(
//   scrollLeft: number,
//   target: HTMLDivElement | ((left: number) => void),
// ) {
//   if (!target) {
//     return;
//   }
//   if (typeof target === 'function') {
//     target(scrollLeft);
//   } else if (target.scrollLeft !== scrollLeft) {
//     // eslint-disable-next-line no-param-reassign
//     target.scrollLeft = scrollLeft;
//   }
// }

export default InitialWrapper;
