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

export type Validator = (name: string, value: unknown) => Promise<any[]>;
export interface Field {
  form: Form;
  identifier: string; // * 内部名称，唯一数组
  address: Segment[]; // * 选址数组
  name: Segment; // * 外部名称，column中的 dataIndex
  initialValue: any;
  modified: boolean;
  validator: Validator;
  setValidator: (validator: Validator) => void;
  feedbacks: any[];
  value: any;
  dispose: () => void;
  destroy: () => void;
  validate: (options?: { force?: boolean }) => Promise<any>;
  disposers: (() => void)[];
  caches: {
    inputting: boolean;
  };
  onInput: (event: NormalEvent) => void;
  reset: (options?: { forceClear?: boolean }) => void;
}

export interface ArrayField extends Field {
  // TODO 更多的内容
  remove: (index: number) => void;
  push: (...args: any[]) => void;
  move: (fromIndex: number, toIndex: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
}

type Component<
  P = {
    value?: any;
    onChange: (e: Event) => void;
  }
> = React.FunctionComponent<P> | React.ComponentClass<P> | string;

type DecoratorComponent<
  P = {
    feedbacks?: React.ReactNode[];
  }
> =
  | React.FunctionComponent<React.PropsWithChildren<P>>
  | React.ComponentClass<React.PropsWithChildren<P>>;

type ComponentProps = Record<string, unknown>;

export interface FieldProps {
  name: Segment;
  basePath?: Segment[];
  initialValue?: any;
  children?: React.ReactElement;
  component: [Component, ComponentProps?];
  // * 产生联动关系
  linkages?: Segment | Segment[];
  linkageReaction?: (field: Field, values: any | any[]) => void;
  // * 校验重名
  deduplicate?: boolean;
  validator?: (name: string, value: unknown) => Promise<any[]>;
  decorator?: [DecoratorComponent, ComponentProps?];
}

export interface ArrayFieldProps extends FieldProps {
  initialValue?: any[];
}

export type GeneralField = Field | ArrayField;
