import type { GeneralField, Field, ArrayField, FieldProps } from './Field';
import type { Heart } from './Effects';

type PathPattern = string | number; // TODO 后面有需要再增加
type Address = PathPattern[];

export interface FieldFactoryProps
  extends Pick<
    FieldProps,
    | 'name'
    | 'basePath'
    | 'initialValue'
    | 'linkages'
    | 'linkageReaction'
    | 'deduplicate'
    | 'validator'
  > {}

export interface CreateArrayFieldProps {
  name: string;
  initialValue?: any[];
}

export interface FormProps {
  initialValues?: any;
  effects: (form: Form) => void;
}

export interface Form<ValueType extends object = any> {
  heart?: Heart;
  notify: <Payload extends object>(
    notifyType: any,
    payload?: Payload,
    ctx?: any,
  ) => void;
  fields: Record<string, GeneralField>;
  values: ValueType;
  initialValues: ValueType;
  lifeCycles: any[];
  getValuesIn: (address: Address) => any;
  setValuesIn: (address: Address, value: any) => void;
  getInitialValuesIn: (address: Address) => any;
  createField: (props: FieldFactoryProps) => Field;
  createArrayField: (props: CreateArrayFieldProps) => ArrayField;
  unmount: () => void;
  reset: (props?: { forceClear?: boolean }) => void;
}
