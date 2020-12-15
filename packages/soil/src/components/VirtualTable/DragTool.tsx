/* eslint-disable import/no-extraneous-dependencies */
import * as React from 'react';
import Draggable, { DraggableEventHandler } from 'react-draggable';
import bindRaf from './utils/bindRaf';
import styles from './DragTool.less';
import type { ColumnDiffedData } from './interface';

interface DragStuffProps {
  setColumn: (
    index: number,
    action: React.SetStateAction<ColumnDiffedData[]>,
  ) => void;
}

function DragStuff({
  setColumn,
  wrapperHeight,
  columnIndex,
  ...elementAttributes
}: DragStuffProps) {
  const dragBasic = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<
    React.ElementRef<typeof Draggable> & {
      state: { x: number };
    }
  >(null!);
  const [isDragging, setDrag] = React.useState(false);

  React.useEffect(() => {
    if (!isDragging && dragBasic.current !== null)
      dragBasic.current.style.transform = '';
  }, [isDragging]);

  const dragStuffRef = React.useRef<{
    node: HTMLDivElement | null;
    appended: boolean;
  }>({
    node: null,
    appended: false,
  });

  const handleDragStart: DraggableEventHandler = (_, ui) => {
    setDrag(true);
    const dragInfo = dragStuffRef.current;
    const { left, top } = ui.node.getBoundingClientRect();
    const el = dragInfo.node || (dragInfo.node = document.createElement('div'));
    el.style.left = `${left}px`;

    if (!dragInfo.appended) {
      el.className = styles.stuffDragging;
      el.style.height = `${wrapperHeight}px`;
      el.style.top = `${top}px`;
      dragInfo.appended = true;
      document.body.appendChild(el);
    }
  };

  const handleDrag: DraggableEventHandler = bindRaf((_, ui) => {
    const dragInfo = dragStuffRef.current;
    const { left } = ui.node.getBoundingClientRect();
    if (dragInfo.node !== null) dragInfo.node.style.left = `${left}px`;
  });

  const handleDragStop: DraggableEventHandler = (_, ui) => {
    const { lastX } = ui;

    let difference = lastX;
    drag.current.state.x = 0;
    setColumn(columnIndex, (preColumns) =>
      preColumns.reduce<ColumnDiffedData[]>((pre, cur, i) => {
        if (i > columnIndex) {
          pre.push({
            ...cur,
            offset: cur.offset + difference,
          });
        } else if (i === columnIndex) {
          difference =
            cur.width + lastX < cur.minWidth ? cur.minWidth - cur.width : lastX;
          pre.push({
            ...cur,
            width: cur.width + difference,
          });
        } else {
          pre.push(cur);
        }
        return pre;
      }, []),
    );
    const dragInfo = dragStuffRef.current;
    if (dragInfo.node) {
      document.body.removeChild(dragInfo.node);
    }
    dragInfo.appended = false;
    dragInfo.node = null;
    setDrag(false);
  };
  return (
    <Draggable
      ref={drag}
      axis="x"
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
    >
      <div
        ref={dragBasic}
        {...elementAttributes}
        className={styles.dragStuff}
      />
    </Draggable>
  );
}

export default React.memo(DragStuff);
