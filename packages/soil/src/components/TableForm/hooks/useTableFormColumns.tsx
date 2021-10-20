import * as React from 'react';
import { Button } from 'antd';
import Field from '../../Form/Field';
import { useField } from '../../Form/context/Field';

export interface IArrayBaseItemProps {
  index: number;
}
const ItemContext = React.createContext<IArrayBaseItemProps>(null!);
ItemContext.displayName = 'ArrayItemContext';

const I = ({ children, index }) => {
  const arrayField = useField();

  return (
    <ItemContext.Provider value={index}>
      {children({ basePath: arrayField.address.concat(index) })}
    </ItemContext.Provider>
  );
};

const Item = React.memo(I);

const FC = ({
  index,
  name,
  dataIndex,
  component,
  linkages,
  linkageReaction,
  deduplicate,
}) => {
  return (
    <Item index={index}>
      {({ basePath }) => {
        return (
          <Field
            component={component}
            basePath={basePath}
            name={name || dataIndex}
            linkages={linkages}
            linkageReaction={linkageReaction}
            deduplicate={deduplicate}
          />
        );
      }}
    </Item>
  );
};

const FieldContainer = React.memo(FC);

// * 表单域获取当前 index 信息
export const useIndex = (index?: number) => {
  const ctx = React.useContext(ItemContext);
  return ctx ? ctx.index : index;
};

function getFieldRender(column) {
  if ('component' in column) {
    const {
      name,
      dataIndex,
      component,
      linkages,
      linkageReaction,
      deduplicate,
      ...extra
    } = column;

    return {
      ...extra,
      render: (_: any, __: any, y) => {
        return (
          <FieldContainer
            index={y}
            name={name}
            dataIndex={dataIndex}
            component={component}
            linkages={linkages}
            linkageReaction={linkageReaction}
            deduplicate={deduplicate}
          />
        );
      },
    };
  }
  return column;
}

function useTableFormColumns(
  columns,
  // dataSource,
  { remove, moveUp, moveDown },
) {
  return columns
    .reduce((buf, column) =>
      // key,
      {
        return buf.concat(getFieldRender(column));
      }, [])
    .concat({
      key: 'array_action_column',
      dataIndex: 'array_action_column',
      width: 200,
      render: (_: any, record: any, index: number) => {
        // const index = dataSource.indexOf(record);
        return (
          <>
            <Button onClick={() => moveUp(index)}>向上</Button>
            <Button onClick={() => moveDown(index)}>向下</Button>
            <Button onClick={() => remove(index)}>删除</Button>
          </>
        );
      },
    });
}

export default useTableFormColumns;
