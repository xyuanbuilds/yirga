import * as React from 'react';
import Grid from './Grid';
import Header from './Header';
// import bindRaf from './utils/bindRaf';
import './index.css';

interface DefaultProps {
  columns: { name: string }[];
  dataSource: any[];
  columnWidth: number | ((index: number) => number);
  rowHeight: number | ((index: number) => number);
}

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

    const [headerInfo, setHeader] = React.useState({
      scroll: { scrollLeft: 0 },
      columnsInfo: [],
    });

    const [scroll, setScroll] = React.useState({
      scrollLeft: 0,
      scrollTop: 0,
    });

    // React.useEffect(() => {
    //   if (scrollWrapper.current !== null) {
    //     scrollWrapper.current.scrollLeft = scroll.scrollLeft;
    //     scrollWrapper.current.scrollTop = scroll.scrollTop;
    //   }
    // }, [scrollWrapper.current, scroll]);

    const onScroll = React.useCallback(
      (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
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

          if (headerRef.current)
            headerRef.current.style.transform = `translate3d(${-scrollLeft}px, 0px, 0px)`;

          // if (scrollWrapper.current) {
          //   scrollWrapper.current.scrollTo(scrollLeft, scrollTop);
          // }

          return {
            scrollLeft: actualLeft,
            scrollTop: actualTop,
          };
        });
      },
      [headerRef.current],
    );

    // const wrapped = React.useCallback(bindRaf(onScroll), [onScroll]);

    return (
      <div className="table-wrapper">
        <div
          ref={headerRef}
          style={{
            height: 48,
            position: 'relative',
            willChange: 'transform',
            // transform: `translate3d(${-scroll.scrollLeft}px, 0px, 0px)`,
          }}
        >
          <Header headerInfo={headerInfo} columns={columns} />
        </div>
        <div
          style={{
            height: 'calc(100% - 48px)',
            width: '100%',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            direction: 'ltr',
            position: 'relative',
          }}
          ref={scrollWrapper}
          onScroll={onScroll}
          className="table-scroll-wrapper"
        >
          <Grid
            scroll={scroll}
            setHeader={setHeader}
            columns={columns}
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
