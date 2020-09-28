import * as React from 'react';
import Grid from './Grid';
import Header from './Header';
// import bindRaf from './utils/bindRaf';
import './index.css';

type InnerColumn = { name: string; width?: number; offset?: number };
interface DefaultProps {
  columns: InnerColumn[];
  dataSource: any[];
  columnWidth: number | ((index: number) => number);
  rowHeight: number | ((index: number) => number);
}

// function diffColumns(columns) {}

const InitialWrapper = React.memo(
  ({
    columns = [],
    dataSource = [],
    columnWidth = 100,
    rowHeight = 48,
    ...reset
  }: DefaultProps) => {
    const columnCount = columns.length;
    const rowCount = dataSource.length;

    const scrollWrapper = React.useRef<HTMLDivElement>(null);
    const headerRef = React.useRef<HTMLDivElement>(null);

    const diffedColumns = React.useMemo(() => {
      const diffed = columns.reduce((pre, cur, index) => {
        const c = Object.defineProperties(cur, {
          width: {
            value:
              typeof columnWidth === 'function'
                ? columnWidth(index)
                : columnWidth,
            writable: true,
            enumerable: true,
            configurable: true,
          },
          offset: {
            value:
              index === 0 ? 0 : pre[index - 1].offset + pre[index - 1].width,
            writable: true,
            enumerable: true,
            configurable: true,
          },
        });

        pre.push(c);
        return pre;
      }, [] as { name: string; width: number; offset: number }[]);
      // console.log(diffed);
      return diffed;
    }, [columns, columnWidth]);

    const [scroll, setScroll] = React.useState({
      scrollLeft: 0,
      scrollTop: 0,
    });

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

    const onScroll = React.useCallback(
      (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
        event.preventDefault();
        const {
          clientHeight,
          clientWidth,
          scrollLeft,
          scrollTop,
          scrollHeight,
          scrollWidth,
        } = event.currentTarget;

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

          return {
            scrollLeft: actualLeft,
            scrollTop: actualTop,
          };
        });
      },
      [headerRef.current, headerTranslate, wrapperScroll],
    );

    // const wrapped = React.useCallback(bindRaf(onScroll), [onScroll]);

    return (
      <div className="table-wrapper">
        <div ref={headerRef} className="table-header-translate-wrapper">
          <Header columns={diffedColumns} />
        </div>
        <div
          ref={scrollWrapper}
          onScroll={onScroll}
          className="table-scroll-wrapper"
        >
          <Grid
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
