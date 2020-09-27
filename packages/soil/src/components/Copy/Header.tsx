import * as React from 'react';
import './Header.css';

function Header({ columns, headerInfo }) {
  const { columnsInfo } = headerInfo;

  return columnsInfo.map((i) => {
    const column = columns[i[0]];
    const metadata = i[1];
    return React.createElement(Th, {
      key: column.name,
      content: column.name,
      style: {
        left: metadata.offset,
        width: metadata.size,
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
