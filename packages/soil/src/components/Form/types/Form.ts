import type { GeneralField, Field, ArrayField, FieldProps } from './Field';

type PathPattern = string | number; // TODO 后面有需要再增加
type Address = PathPattern[];

export interface FieldFactoryProps
  extends Pick<
    FieldProps,
    | 'name'
    | 'basePath'
    | 'defaultValue'
    | 'linkages'
    | 'linkageReaction'
    | 'deduplicate'
  > {}

export interface CreateArrayFieldProps {
  name: string;
  defaultValue?: any[];
}

export interface Form<ValueType extends object = any> {
  fields: Record<string, GeneralField>;
  values: ValueType;
  getValuesIn: (address: Address) => any;
  setValuesIn: (address: Address, value: any) => void;
  createField: (props: FieldFactoryProps) => Field; // TODO, 目前只支持 ArrayField，先做尝试
  createArrayField: (props: CreateArrayFieldProps) => ArrayField; // TODO, 目前只支持 ArrayField，先做尝试
}
