import * as React from 'react';
import { Empty } from 'antd';
import styles from './index.less';

const EmptyTable = ({
  height,
  width,
  headerWidth,
  syncScrollLeft,
  bordered,
}) => {
  return (
    <div
      style={{
        height,
      }}
      onScroll={syncScrollLeft}
      className={
        bordered
          ? `${styles.emptyContainer}`
          : `${styles.emptyContainer} ${styles.noBorder}`
      }
    >
      <div
        style={{
          height,
          position: 'relative',
          width: headerWidth - (bordered ? 1 : 0),
        }}
      >
        <div
          style={{
            width: bordered ? width - 2 : width,
          }}
          className={styles.stickyEmpty}
        >
          <Empty
            className={styles.tableEmpty}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      </div>
    </div>
  );
};

export default EmptyTable;
