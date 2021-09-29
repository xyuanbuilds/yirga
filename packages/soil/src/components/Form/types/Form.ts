import type { GeneralField, Field, ArrayField } from './Field';

type PathPattern = string | number; // TODO 后面有需要再增加
type Address = PathPattern[];
export interface CreateFieldProps {
  name: PathPattern;
  basePath?: Address;
  defaultValue?: any;
}

export interface CreateArrayFieldProps {
  name: string;
  defaultValue?: any[];
}

export interface Form<ValueType extends object = any> {
  fields: Record<string, GeneralField>;
  values: ValueType;
  getValuesIn: (address: Address) => any;
  setValuesIn: (address: Address, value: any) => void;
  createField: (props: CreateFieldProps) => Field; // TODO, 目前只支持 ArrayField，先做尝试
  createArrayField: (props: CreateArrayFieldProps) => ArrayField; // TODO, 目前只支持 ArrayField，先做尝试
}
