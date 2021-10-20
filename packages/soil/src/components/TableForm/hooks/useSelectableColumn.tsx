import * as React from 'react';
import { Checkbox } from 'antd';
import { ROW_ID_KEY } from '../../Form/models/ArrayField';

export interface ISelectableItemProps {
  toggleSelection: (index: React.Key) => () => void;
  isSelected: (index: React.Key) => boolean;
}
const SelectableItemContext = React.createContext<ISelectableItemProps>(null!);
SelectableItemContext.displayName = 'SelectableItemContext';

function useSelectable() {
  // const selectable = true;
  // const [selectedAll, setSelectedAll] = React.useState(false);
  const [selectedIndexes, setSelected] = React.useState<React.Key[]>([]);

  const toggleSelection = (option: React.Key) => () => {
    setSelected((v) => {
      const curSelectionIndex = v.findIndex((i) => i === option);
      if (curSelectionIndex >= 0) {
        return v
          .slice(0, curSelectionIndex)
          .concat(v.slice(curSelectionIndex + 1));
      }
      return v.concat(option);
    });
  };

  const isSelected = (option: any) => {
    return selectedIndexes.findIndex((i) => i === option) >= 0;
  };

  return {
    toggleSelection,
    selectedIndexes,
    isSelected,
    setSelected,
  };
}

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
const CheckBoxContainer = React.memo(CK);

function useSelectableColumns(columns: any[], selectable?: boolean): any[] {
  if (selectable) {
    const selectColumn = [
      {
        key: 'array_table_select',
        dataIndex: 'array_table_select',
        width: 32,
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
