import * as React from 'react';
import { Checkbox } from 'antd';
import { ROW_ID_KEY } from '../../Form/models/ArrayField';
import type { ColumnType } from '../type';

import { useConfig } from './useConfig';

import styles from './selectable.less';

export const SELECTABLE_COLUMN_WIDTH = 32;

export interface ISelectableItemProps {
  toggleSelection: (
    index: React.Key | React.Key[],
    clear?: boolean,
  ) => () => void;
  isSelected: (index: React.Key) => boolean;
  selectedItems: React.Key[];
}
const SelectableItemContext = React.createContext<ISelectableItemProps>(null!);
SelectableItemContext.displayName = 'SelectableItemContext';

function useSelectable() {
  const [selectedItems, setSelected] = React.useState<React.Key[]>([]);

  const toggleSelection: ISelectableItemProps['toggleSelection'] = React.useCallback(
    (option, clear) => () => {
      if (Array.isArray(option)) {
        setSelected(clear ? [] : option);
      } else {
        setSelected((v) => {
          const curSelectionIndex = v.findIndex((i) => i === option);

          if (curSelectionIndex >= 0) {
            return v
              .slice(0, curSelectionIndex)
              .concat(v.slice(curSelectionIndex + 1));
          }
          return v.concat(option);
        });
      }
    },
    [],
  );

  const isSelected: ISelectableItemProps['isSelected'] = (option) => {
    return selectedItems.findIndex((i) => i === option) >= 0;
  };

  return {
    toggleSelection,
    selectedItems,
    isSelected,
    setSelected,
  };
}

const CKA = ({ allOptions }) => {
  const { toggleSelection, selectedItems } = React.useContext(
    SelectableItemContext,
  );

  selectedItems.forEach((i) => {
    if (Array.isArray(allOptions) && !allOptions.find((cur) => cur === i)) {
      toggleSelection(i)();
    }
  });

  const allChecked =
    selectedItems.length === allOptions.length && selectedItems.length > 0;
  return (
    <Checkbox
      indeterminate={selectedItems.length > 0 && !allChecked}
      checked={allChecked}
      onClick={toggleSelection(allOptions, allChecked)}
    />
  );
};

const CheckAll = React.memo(CKA);

const CK = ({ record }) => {
  const { toggleSelection, isSelected } = React.useContext(
    SelectableItemContext,
  );

  return (
    <Checkbox
      checked={isSelected(record[ROW_ID_KEY])}
      onClick={toggleSelection(record[ROW_ID_KEY])}
    />
  );
};
const CheckBoxContainer = CK;

function useSelectableColumns<RecordType extends object = any>(
  columns: ColumnType<RecordType>[],
  lineIds: React.Key[],
): ColumnType<RecordType>[] {
  const { selectable } = useConfig();
  if (selectable) {
    const selectColumn: ColumnType<RecordType>[] = [
      {
        key: 'array_table_select',
        title() {
          return <CheckAll allOptions={lineIds} />;
        },
        className: styles.checkContainer,
        align: 'center',
        dataIndex: 'array_table_select',
        width: SELECTABLE_COLUMN_WIDTH,
        render(_, record) {
          return <CheckBoxContainer record={record} />;
        },
      },
    ];

    return selectColumn.concat(columns);
  }
  return columns;
}

export { useSelectable, SelectableItemContext };
export default useSelectableColumns;
