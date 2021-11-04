import type { Form } from './Form';
import type { GeneralField } from './Field';

export type ExtraPayload = object | undefined;

export type LifeCycleCallBack<Payload extends ExtraPayload = undefined> = (
  form: Form,
  payload?: Payload,
) => void;

export type FieldLifeCycleCallBack<Payload extends ExtraPayload = undefined> = (
  field: GeneralField,
  form: Form,
  payload?: Payload,
) => void;

export interface LifeCycle<Payload extends object | undefined = undefined> {
  notify: (notifyType: any, payload: Payload, ctx: Form) => void;
}

export interface FieldLifeCycle {
  notify: (notifyType: any, field: GeneralField, ctx: Form) => void;
}

export interface Heart {
  addLifeCycles: (id: any, lifeCycles: LifeCycle<any>[]) => void;
  publish: <P, C>(type: any, payload?: P, context?: C) => void;
}
