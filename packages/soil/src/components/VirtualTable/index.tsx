import * as React from 'react';
// import { throttle } from 'lodash';
import Grid from './Grid';
import Header from './Header';
import bindRaf from './utils/bindRaf';
import './index.css';

type InnerColumn = { name: string; width?: number; offset?: number };
interface DefaultProps {
  columns: InnerColumn[];
  dataSource: any[];
  columnWidth: number | ((index: number) => number);
  rowHeight: number | ((index: number) => number);
}

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

const defaultColumns = [];
const defaultDataSource = [];
const InitialWrapper = React.memo(
  ({
    columns: originColumns = defaultColumns,
    dataSource = defaultDataSource,
    columnWidth = 100,
    rowHeight = 48,
    ...reset
  }: DefaultProps) => {
    const columnCount = originColumns.length;
    const rowCount = dataSource.length;

    const scrollWrapper = React.useRef<HTMLDivElement>(null);
    const headerRef = React.useRef<HTMLDivElement>(null);

    const [diffedColumns, setColumn] = React.useState(
      diffColumns(originColumns, columnWidth),
    );

    React.useEffect(() => {
      setColumn(diffColumns(originColumns, columnWidth));
    }, [originColumns, columnWidth]);

    const [scroll, setScroll] = React.useState({
      scrollLeft: 0,
      scrollTop: 0,
    });

    // * 滚动相关
    const headerTranslate = React.useCallback(
      (scrollLeft) => {
        if (headerRef.current)
          headerRef.current.style.transform = `translate3d(${-scrollLeft}px, 0px, 0px)`;
      },
      [headerRef.current],
    );
    const wrapperScroll = React.useCallback(
      (scrollLeft, scrollTop) => {
        if (scrollWrapper.current) {
          scrollWrapper.current.scrollLeft = scrollLeft;
          scrollWrapper.current.scrollTop = scrollTop;
        }
      },
      [scrollWrapper.current],
    );

    // const gridRef = React.useRef(null);
    const actualSet = React.useCallback(
      bindRaf((target) => {
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
        headerTranslate(actualLeft);
        wrapperScroll(actualLeft, actualTop);

        // gridRef.current.setScroll((prevState) => {
        setScroll((prevState) => {
          if (
            prevState.scrollLeft === actualLeft &&
            prevState.scrollTop === actualTop
          ) {
            // Scroll position may have been updated by cDM/cDU,
            // In which case we don't need to trigger another render,
            // And we don't want to update state.isScrolling.
            return prevState;
          }

          return {
            scrollLeft: actualLeft,
            scrollTop: actualTop,
          };
        });
      }),
      [wrapperScroll, headerTranslate],
    );
    const onScroll = React.useCallback(
      (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
        event.preventDefault();
        event.stopPropagation();
        actualSet(event.currentTarget || event.target);
      },
      [actualSet],
    );

    return (
      <div className="table-wrapper">
        <div ref={headerRef} className="table-header-translate-wrapper">
          <Header columns={diffedColumns} setColumn={setColumn} />
        </div>
        <div
          ref={scrollWrapper}
          onScroll={onScroll}
          className="table-scroll-wrapper"
        >
          <Grid
            // ref={gridRef}
            scroll={scroll}
            columns={diffedColumns}
            columnCount={columnCount}
            rowCount={rowCount}
            columnWidth={columnWidth}
            rowHeight={rowHeight}
            dataSource={dataSource}
            {...reset}
          />
        </div>
      </div>
    );
  },
);

export default InitialWrapper;
