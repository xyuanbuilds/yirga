import * as React from 'react';
import { Button } from 'antd';
import Field from '../../Form/Field';
import { useField } from '../../Form/context/Field';
import { getValidator } from '../Item/validator';
import FeedbackItem from '../Item/Item';

export interface IArrayBaseItemProps {
  index: number;
}
const ItemContext = React.createContext<IArrayBaseItemProps>(null!);
ItemContext.displayName = 'ArrayItemContext';

const Item = ({ rules, children, index }) => {
  const arrayField = useField();

  const validator = React.useMemo(() => {
    return rules && getValidator(rules);
  }, [rules]);

  const basePath = React.useMemo(() => {
    return arrayField.address.concat(index);
  }, [index, arrayField.address]);

  return (
    <ItemContext.Provider value={index}>
      {children({ basePath, validator })}
    </ItemContext.Provider>
  );
};

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
      rules,
      ...extra
    } = column;

    return {
      ...extra,
      render: (_: any, __: any, index: number) => {
        return (
          <Item rules={rules} index={index}>
            {({ basePath, validator }) => {
              return (
                <Field
                  decorator={[FeedbackItem]}
                  validator={validator}
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
    .reduce((buf, column) => {
      return buf.concat(getFieldRender(column));
    }, [])
    .concat({
      key: 'array_action_column',
      dataIndex: 'array_action_column',
      width: 200,
      render: (_: any, __: any, index: number) => {
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
