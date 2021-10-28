import type * as React from 'react';
import type { Rule } from 'rc-field-form/lib/interface.d';
import type { ColumnType as AntdColumnType } from 'antd/lib/table';

type ValueType =
  | 'array'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'number'
  | 'object'
  | 'string';

type BasicTarget = { value: any };
type CheckedTarget = {
  checked: boolean;
};

type Component<
  P = {
    value?: any;
    onChange: (e: { target: BasicTarget | CheckedTarget }) => void;
  }
> = React.FunctionComponent<P> | React.ComponentClass<P> | string;

type ComponentProps = Record<string, unknown>;

export interface ColumnType<RecordType extends object>
  extends AntdColumnType<RecordType> {
  dataIndex: string;
  valueType?: ValueType;
  width: number;
  component?: [Component, ComponentProps?];
  linkages?: string[];
  linkageReaction?: (field: any, value: any) => void;
  deduplicate?: boolean;
  rules?: Rule[];
  render?: (
    data: unknown,
    record: RecordType,
    index: number,
  ) => React.ReactNode;
}
