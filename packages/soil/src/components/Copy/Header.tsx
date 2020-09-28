import * as React from 'react';
import './Header.css';

function Header({ columns }) {
  return columns.map((i) => {
    return React.createElement(Th, {
      key: i.name,
      content: i.name,
      style: {
        left: i.offset,
        minWidth: i.width,
        width: i.width,
      },
    });
  });
}

function Th({ content, style }) {
  return (
    <div className="table-header-th" style={style}>
      {content}
    </div>
  );
}

export default Header;
