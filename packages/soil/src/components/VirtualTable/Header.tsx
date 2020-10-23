import * as React from 'react';
// import useHover from './hooks/useHover';
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

function Header({ columns, setColumn }) {
  return (
    // <div>
    columns
      .map((i, index) => {
        return React.createElement(Th, {
          key: i.name,
          id: i.name,
          content: i.name,
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
