import * as React from 'react';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import { FilterFilled } from '@ant-design/icons';
import { Button, Menu, Checkbox, Radio, Dropdown } from 'antd';
import useSyncState from '../useSyncState';
import { FilterState } from '.';
import styles from './DropDown.less';

const { Item: MenuItem } = Menu;

function renderFilterItems({
  filters,
  filteredKeys,
  filterMultiple,
}: {
  filters: {
    text: React.ReactNode;
    value: string | number | boolean;
  }[];
  filteredKeys: (string | number | boolean)[];
  filterMultiple: boolean;
}) {
  if (filters.length === 0) {
    // wrapped with <div /> to avoid react warning
    // https://github.com/ant-design/ant-design/issues/25979
    return (
      <div
        style={{
          margin: '16px 0',
        }}
      >
        空
      </div>
    );
  }
  return filters.map((filter, index) => {
    const key = String(filter.value);
    const Component = filterMultiple ? Checkbox : Radio;

    return (
      <MenuItem key={filter.value !== undefined ? key : index}>
        <Component checked={filteredKeys.includes(key)} />
        <span>{filter.text}</span>
      </MenuItem>
    );
  });
}

export interface FilterDropdownProps<RecordType> {
  filterState: FilterState<RecordType>;
  children: React.ReactNode;
  triggerFilter: (filterState: FilterState<RecordType>) => void;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
}

function FilterDropdown<RecordType>(props: FilterDropdownProps<RecordType>) {
  const { filterState, triggerFilter, children, getPopupContainer } = props;

  const { key: columnKey, filter, filteredKeys, forceFiltered } = filterState;
  const filterActive = !!(
    filterState &&
    (filteredKeys?.length || forceFiltered)
  );
  const { filterMultiple = true } = filter;
  const [visible, triggerVisible] = React.useState(false);

  // ===================== Select Keys =====================
  const propFilteredKeys = filterState && filterState.filteredKeys;

  const [getFilteredKeysSync, setFilteredKeysSync] = useSyncState(
    propFilteredKeys || [],
  );

  const onSelectKeys = ({
    selectedKeys,
  }: {
    selectedKeys?: (string | number | boolean)[];
  }) => {
    setFilteredKeysSync(selectedKeys!);
  };

  React.useEffect(() => {
    onSelectKeys({ selectedKeys: propFilteredKeys || [] });
  }, [propFilteredKeys]);

  // ====================== Open Keys ======================
  const [openKeys, setOpenKeys] = React.useState<React.Key[]>([]);
  const openRef = React.useRef<number>();
  const onOpenChange = (keys: React.Key[]) => {
    openRef.current = window.setTimeout(() => {
      setOpenKeys(keys);
    });
  };
  const onMenuClick = () => {
    window.clearTimeout(openRef.current);
  };
  React.useEffect(() => {
    return () => {
      window.clearTimeout(openRef.current);
    };
  }, []);

  // ======================= Submit ========================
  const internalTriggerFilter = (
    keys: (string | number | boolean)[] | undefined | null,
  ) => {
    triggerVisible(false);

    const mergedKeys = keys && keys.length ? keys : null;
    if (mergedKeys === null && (!filterState || !filterState.filteredKeys)) {
      return null;
    }

    if (isEqual(mergedKeys, filterState?.filteredKeys)) {
      return null;
    }

    return triggerFilter({
      ...filterState,
      filter,
      key: columnKey,
      filteredKeys: mergedKeys,
    });
  };

  const onConfirm = () => {
    internalTriggerFilter(getFilteredKeysSync());
  };

  const onReset = () => {
    setFilteredKeysSync([]);
    internalTriggerFilter([]);
  };

  const onVisibleChange = (newVisible: boolean) => {
    if (newVisible && propFilteredKeys !== undefined) {
      // Sync filteredKeys on appear in controlled mode (propFilteredKeys !== undefined)
      setFilteredKeysSync(propFilteredKeys || []);
    }

    triggerVisible(newVisible);

    // Default will filter when closed
    if (!newVisible) {
      onConfirm();
    }
  };

  // ======================== Style ========================
  const selectedKeys = (getFilteredKeysSync() || []) as any;
  const dropdownContent: React.ReactNode = (
    <>
      <Menu
        multiple={filterMultiple}
        onClick={onMenuClick}
        onSelect={onSelectKeys}
        onDeselect={onSelectKeys}
        selectedKeys={selectedKeys}
        getPopupContainer={getPopupContainer}
        openKeys={openKeys as string[]}
        onOpenChange={onOpenChange}
        className={styles.menu}
      >
        {renderFilterItems({
          filters: filter.filters || [],
          filteredKeys: getFilteredKeysSync(),
          filterMultiple,
        })}
      </Menu>
      <div className={styles.btns}>
        <Button
          type="link"
          size="small"
          disabled={selectedKeys.length === 0}
          onClick={onReset}
        >
          重置
        </Button>
        <Button type="primary" size="small" onClick={onConfirm}>
          确认
        </Button>
      </div>
    </>
  );

  const menu = <div className={styles.dropDown}>{dropdownContent}</div>;

  return (
    <div className={styles.filterColumn}>
      <span className={styles.columnTitle}>{children}</span>
      <span className={styles.filterTriggerContainer}>
        <Dropdown
          overlay={menu}
          trigger={['click']}
          visible={visible}
          onVisibleChange={onVisibleChange}
          getPopupContainer={getPopupContainer}
        >
          <span
            className={classNames(styles.filterTrigger, {
              [styles.containerOpen]: visible,
            })}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <span
              role="button"
              tabIndex={-1}
              className={classNames(styles.icon, {
                [styles.active]: filterActive,
              })}
            >
              <FilterFilled />
            </span>
          </span>
        </Dropdown>
      </span>
    </div>
  );
}

export default FilterDropdown;
