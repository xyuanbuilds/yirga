import * as React from 'react';
import useHoverLazy from './hooks/useHoverLazy';
import DragStuff from './DragTool';
import './Header.css';

function Header({ columns, setColumn }) {
  return columns.map((i, index) => {
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
  });
}

function Th({ id, content, style, setColumn, columnIndex }) {
  const [el, isHover] = useHoverLazy(
    <div className="table-header-th" style={style}>
      {content}
    </div>,
  );
  return (
    <>
      {el}
      {isHover && (
        <DragStuff
          style={{
            left: style.left + style.width - 5,
          }}
          id={id}
          columnIndex={columnIndex}
          setColumn={setColumn}
        />
      )}
    </>
  );
}

export default Header;
