import React from 'react';
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
  defaultValue: any;
  value: any;
  disposers?: (() => void)[];
  onInput: (event: NormalEvent) => void;
}

export interface ArrayField extends Field {
  // TODO 更多的内容
  remove: (index: number) => void;
  push: (...args: any[]) => void;
}

type Component<
  P = {
    value?: any;
    onChange: (e: Event) => void;
  }
> = React.FunctionComponent<P> | React.ComponentClass<P> | string;
type ComponentProps = Record<string, any>;

export interface FieldProps {
  name: Segment;
  children?: React.ReactElement;
  component: [Component, ComponentProps?];
  basePath?: Segment[];
  defaultValue?: any;
}

export interface ArrayFieldProps extends FieldProps {
  defaultValue?: any[];
}

export type GeneralField = Field | ArrayField;
