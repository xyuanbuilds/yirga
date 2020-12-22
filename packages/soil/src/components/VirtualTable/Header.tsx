import * as React from 'react';
import classNames from 'classnames';
import DragStuff from './DragTool';
import styles from './Header.less';

function Empty({ style, ...reset }) {
  return (
    <div
      {...reset}
      style={{
        position: 'absolute',
        padding: 0,
        width: 8,
        height: '100%',
        border: 'none',
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

function renderFilter(titleContent, filterRender) {
  return typeof filterRender === 'function'
    ? filterRender(titleContent)
    : titleContent;
}
function renderSorter(titleContent, sorterRender) {
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
}) {
  return (
    // <div>
    columns
      .map((i, index) => {
        const filterRender = filters[i.key];
        const sorterRender = sorters[i.key];

        // TODO 注入sorter处
        const titleContent = (
          <TitleContainer hasSorter={!!sorterRender} hasFilter={!!filterRender}>
            {i.title || i.key}
          </TitleContainer>
        );
        return React.createElement(Th, {
          wrapperHeight,
          key: i.key,
          id: i.key,
          bordered,
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
        // return ;
      })
      .concat(
        React.createElement(Empty, {
          key: 'scrollBar',
          style: {
            left:
              columns[columns.length - 1].offset +
              columns[columns.length - 1].width,
            minWidth: 8,
            width: 8,
          },
        }),
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
}) {
  const thClassNames = classNames(styles.tableHeaderTh, {
    [styles.noBorder]: !bordered,
  });
  return (
    <>
      <div className={thClassNames} style={style}>
        {content}
      </div>
      <DragStuff
        style={{
          left: style.left + style.width - 5,
        }}
        id={id}
        wrapperHeight={wrapperHeight}
        columnIndex={columnIndex}
        setColumn={setColumn}
      />
    </>
  );
}

export default React.memo(Header);
