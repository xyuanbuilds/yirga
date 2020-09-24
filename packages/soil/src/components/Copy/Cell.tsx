import * as React from 'react';

function Cell({ style }) {
  // console.log(style);
  return (
    <div
      style={{
        ...style,
        boxSizing: 'border-box',
        padding: '12px 16px',
        borderBottom: '1px solid #e8e8e8',
        borderRight: '1px solid #e8e8e8',
        background: '#fff',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      className="tableCell"
    >
      test text
    </div>
  );
}

export default Cell;
