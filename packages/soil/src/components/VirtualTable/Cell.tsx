import * as React from 'react';
import './Cell.css';

function Cell({ style, data }) {
  return (
    <div style={style} className="table-cell-container">
      {data}
    </div>
  );
}

export default Cell;
