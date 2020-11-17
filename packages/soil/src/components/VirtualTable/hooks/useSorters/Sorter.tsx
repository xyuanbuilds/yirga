import * as React from 'react';
import classNames from 'classnames';
import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
import CaretUpOutlined from '@ant-design/icons/CaretUpOutlined';
import { SortOrder } from '../../interface';
import styles from './Sorter.less';

export const ASCEND = 'ascend';
export const DESCEND = 'descend';

function renderSorter(sortOrder) {
  const upNode: React.ReactNode = (
    <CaretUpOutlined
      className={classNames(styles.sorterUp, {
        [styles.active]: sortOrder === ASCEND,
      })}
    />
  );
  const downNode: React.ReactNode = (
    <CaretDownOutlined
      className={classNames(styles.sorterDown, {
        [styles.active]: sortOrder === DESCEND,
      })}
    />
  );
  return (
    <span
      className={classNames(styles.sorter, {
        [styles.sorterFull]: upNode && downNode,
      })}
    >
      <span className={styles.sorterInner}>
        {upNode}
        {downNode}
      </span>
    </span>
  );
}

const DEFAULT_DIRECTION: SortOrder[] = [ASCEND, DESCEND, null];

function Sorter({ triggerSorter, title, sorterState }) {
  // showSorterTooltip ? (
  //   <Tooltip title={sortTip}>
  //     <div className={`${prefixCls}-column-sorters-with-tooltip`}>
  //       {renderSortTitle}
  //     </div>
  //   </Tooltip>
  // ) : (
  //   renderSortTitle
  // );
  const toggleSorter = () => {
    const nextSortOrder = nextSortDirection(
      DEFAULT_DIRECTION,
      sorterState.sortOrder,
    );

    triggerSorter({
      ...sorterState,
      sortOrder: nextSortOrder || null,
    });
  };
  return (
    <div className={styles.sorterColumn} onClick={toggleSorter}>
      {title}
      {renderSorter(sorterState.sortOrder)}
    </div>
  );
}

function nextSortDirection(
  sortDirections: SortOrder[],
  current: SortOrder | null,
) {
  if (!current) {
    return sortDirections[0];
  }

  return sortDirections[sortDirections.indexOf(current) + 1];
}

export default Sorter;
