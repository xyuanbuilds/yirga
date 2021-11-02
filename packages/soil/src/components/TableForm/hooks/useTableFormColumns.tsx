import * as React from 'react';
import { Divider } from 'antd';
import {
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import Field from '../../Form/Field';
import { useField } from '../../Form/context/Field';
import { getValidator } from '../Item/validator';
import FeedbackItem from '../Item/Item';
import type { ColumnType } from '../type';

import { useConfig } from './useConfig';

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

function useTableFormColumns<RecordType extends object = any>(
  columns: ColumnType<RecordType>[],
  { remove, moveUp, moveDown },
) {
  const { onlyDelete } = useConfig();

  const actionNum = (onlyDelete ? 0 : 3) + (onlyDelete ? 1 : 0);

  return columns
    .reduce<ColumnType<RecordType>[]>((buf, column) => {
      return buf.concat(getFieldRender(column));
    }, [])
    .concat({
      key: 'array_action_column',
      dataIndex: 'array_action_column',
      width: onlyDelete ? 60 : actionNum * 16 + (actionNum - 1) * 16 + 16,
      render: (_: any, __: any, index: number) => {
        return (
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {!onlyDelete && (
              <>
                <ArrowUpOutlined
                  style={{ fontSize: 16 }}
                  onClick={() => moveUp(index)}
                />
                <Divider type="vertical" />
                <ArrowDownOutlined
                  style={{ fontSize: 16 }}
                  onClick={() => moveDown(index)}
                />
                <Divider type="vertical" />
              </>
            )}
            <DeleteOutlined
              style={{ fontSize: 16 }}
              onClick={() => remove(index)}
            />
          </div>
        );
      },
    });
}

export default useTableFormColumns;
