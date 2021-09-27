import type { Form } from './Form';

export type NormalEvent = {
  target:
    | {
        value: any;
      }
    | {
        checked: boolean;
      };
};

export type Segment = string | number;
export interface Field {
  form: Form;
  identifier: string;
  address: Segment[];
  value: any;
  onInput: (event: NormalEvent) => void;
}

export interface ArrayField extends Field {
  // TODO 更多的内容
  remove: (index: number) => void;
}

export type GeneralField = Field | ArrayField;
