import * as React from 'react';

export const INDEX_COLUMN_WIDTH = 32;

export interface ConfigStates {
  sortable?: boolean;
  selectable?: boolean;
  hasIndex?: boolean;
  onlyDelete?: boolean;

  movable?: boolean;
  deletable?: boolean;
}

const ConfigContext = React.createContext<ConfigStates>(null!);

function ConfigProvider({
  sortable = true,
  selectable = true,
  hasIndex = true,
  onlyDelete = false,
  movable = true,
  deletable = true,
  children,
}: React.PropsWithChildren<ConfigStates>) {
  const configMemo = React.useMemo(
    () => ({
      sortable,
      selectable,
      hasIndex,
      onlyDelete,
      movable,
      deletable,
    }),
    [sortable, selectable, hasIndex, onlyDelete, movable, deletable],
  );
  return (
    <ConfigContext.Provider value={configMemo}>
      {children}
    </ConfigContext.Provider>
  );
}

function useConfig() {
  return React.useContext(ConfigContext);
}

export { useConfig };
export default ConfigProvider;
