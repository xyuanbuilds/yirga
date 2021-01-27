import * as React from 'react';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import DragStuff from './DragTool';
import styles from './Header.less';

function Empty({ style, bordered, ...reset }) {
  return (
    <div
      {...reset}
      className={
        bordered
          ? styles.scrollBarTh
          : `${styles.scrollBarTh} ${styles.noBorder}`
      }
      style={{
        position: 'absolute',
        padding: 0,
        height: '100%',
        ...style,
      }}
    />
  );
}

function TitleContainer({
  hasFilter,
  hasSorter,
  children,
  ...propsForContainer
}: {
  children: React.ReactElement;
  hasFilter?: boolean;
  hasSorter?: boolean;
} & React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLSpanElement>,
  HTMLSpanElement
>) {
  return (
    <span
      {...propsForContainer}
      className={classNames(styles.titleContainer, {
        [styles.titleWithExtra]: hasFilter || hasSorter,
      })}
    >
      {children}
    </span>
  );
}

function renderFilter(titleContent: React.ReactElement, filterRender) {
  return typeof filterRender === 'function'
    ? filterRender(titleContent)
    : titleContent;
}
function renderSorter(titleContent: React.ReactElement, sorterRender) {
  return typeof sorterRender === 'function'
    ? sorterRender(titleContent)
    : titleContent;
}

function Header({
  columns,
  setColumn,
  filters,
  sorters,
  wrapperHeight,
  bordered = true,
  bodyScrollBar,
  scrollbarSize,
}) {
  const { y } = bodyScrollBar;
  return (
    // <div>
    columns
      .map((i, index: number) => {
        const filterRender = filters[i.key];
        const sorterRender = sorters[i.key];

        const titleContent = (
          <TitleContainer hasSorter={!!sorterRender} hasFilter={!!filterRender}>
            <Tooltip
              placement="topLeft"
              mouseEnterDelay={0.3}
              title={i.title || i.key}
            >
              {i.title || i.key}
            </Tooltip>
          </TitleContainer>
        );
        return React.createElement(Th, {
          wrapperHeight,
          key: i.key,
          id: i.key,
          bordered,
          last: index === columns.length - 1,
          hasScrollBar: y,
          scrollbarSize,
          content: renderFilter(
            renderSorter(titleContent, sorterRender),
            filterRender,
          ),
          style: {
            left: i.offset,
            minWidth: i.width,
            width: i.width,
          },
          columnIndex: index,
          setColumn,
        });
      })
      .concat(
        columns.length > 0 && y && scrollbarSize > 0 ? (
          React.createElement(Empty, {
            key: 'scrollBar',
            style: {
              left:
                columns[columns.length - 1].offset +
                columns[columns.length - 1].width,
              width: scrollbarSize,
            },
            bordered,
          })
        ) : columns.length === 0 ? (
          <div
            className={
              bordered
                ? styles.emptyHeader
                : `${styles.emptyHeader} ${styles.noBorder}`
            }
          />
        ) : null,
      )
    // </div>
  );
}

function Th({
  id,
  content,
  style,
  setColumn,
  columnIndex,
  wrapperHeight,
  bordered,
  hasScrollBar,
  scrollbarSize,
  last,
}) {
  const thClassNames = classNames(styles.tableHeaderTh, {
    [styles.lastWithScrollBar]: last && hasScrollBar,
    [styles.normalBorder]:
      !last || (last && scrollbarSize === 0) || !hasScrollBar,
    [styles.noBorder]: !bordered,
  });
  return (
    <>
      <div className={thClassNames} style={style}>
        {content}
      </div>
      <DragStuff
        style={{
          left: style.left + style.width - 5 - (last ? 5 : 0),
        }}
        id={id}
        wrapperHeight={wrapperHeight}
        columnIndex={columnIndex}
        setColumn={setColumn}
      />
    </>
  );
}

export default Header;
