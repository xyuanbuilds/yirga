import * as React from 'react';
// import useHover from './hooks/useHover';
import classNames from 'clsx';
import DragStuff from './DragTool';
import './Header.css';

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
} & Partial<React.HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span
      {...propsForContainer}
      className={classNames('title-container', {
        'title-with-extra': hasFilter || hasSorter,
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

function Header({ columns, setColumn, filters, sorters }) {
  return (
    // <div>
    columns
      .map((i, index) => {
        const filterRender = filters[i.key];
        const sorterRender = sorters[i.key];

        // TODO 注入sorter处
        const titleContent = (
          <TitleContainer hasSorter={!!sorterRender} hasFilter={!!filterRender}>
            {i.key || i.title}
          </TitleContainer>
        );
        return React.createElement(Th, {
          key: i.key,
          id: i.key,
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

function Th({ id, content, style, setColumn, columnIndex }) {
  return (
    <>
      <div className="table-header-th" style={style}>
        {content}
      </div>
      <DragStuff
        style={{
          left: style.left + style.width - 5,
        }}
        id={id}
        columnIndex={columnIndex}
        setColumn={setColumn}
      />
    </>
  );
}

export default React.memo(Header);
