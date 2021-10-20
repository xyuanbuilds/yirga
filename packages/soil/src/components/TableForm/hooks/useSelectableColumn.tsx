import * as React from 'react';
import { Checkbox } from 'antd';

export interface ISelectableItemProps {
  toggleSelection: (index: number) => () => void;
  isSelected: (index: number) => boolean;
}
const SelectableItemContext = React.createContext<ISelectableItemProps>(null!);
SelectableItemContext.displayName = 'SelectableItemContext';

function useSelectable() {
  // const selectable = true;
  // const [selectedAll, setSelectedAll] = React.useState(false);
  const [selectedIndexes, setSelected] = React.useState<React.Key[]>([]);

  const toggleSelection = (index: number) => () => {
    setSelected((v) => {
      const curSelectionIndex = v.findIndex((i) => i === index);
      if (curSelectionIndex >= 0) {
        return v.slice(0, index).concat(v.slice(index + 1));
      }
      return v.concat(index);
    });
  };

  const isSelected = (index: number) => {
    return selectedIndexes.findIndex((i) => i === index) >= 0;
  };

  return {
    toggleSelection,
    selectedIndexes,
    isSelected,
    setSelected,
  };
}

const CK = ({ index }) => {
  const { toggleSelection, isSelected } = React.useContext(
    SelectableItemContext,
  );

  return (
    <Checkbox checked={isSelected(index)} onClick={toggleSelection(index)} />
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
        render(_, __, index) {
          return <CheckBoxContainer index={index} />;
        },
      },
    ];

    return selectColumn.concat(columns);
  }
  return columns;
}

export { useSelectable, SelectableItemContext };
export default useSelectableColumns;
