/* eslint-disable no-param-reassign */
import { define, observable, batch, action, toJS } from '@formily/reactive';
import { isValid, isArr, isNumberIndex, isNum, isFn } from '../predicate';
import * as FieldModel from './Field';
import * as ArrayFieldModel from './ArrayField';
import LifeCycles from '../effects/constants';
import { createHeart, runEffects } from './LifeCycle';
import { each, pipe, clone } from '../utils';

import type { Field, ArrayField, Segment } from '../types/Field';
import type { Form, FormProps, FieldFactoryProps } from '../types/Form';

const formInit = (props: FormProps | undefined): Form => {
  const effects = props?.effects;
  const form: Form = {
    lifeCycles: [],
    fields: {}, // { xx.0.xx: Field }
    values: {}, // { array: [{ a1: xx }, { a1: xx }]}
    initialValues: {},
    setValuesIn,
    getValuesIn,
    getInitialValuesIn,
    createField,
    createArrayField,
    notify,
    reset,
    unmount,
  };

  form.heart = isFn(effects)
    ? createHeart(runEffects(form, effects), form)
    : undefined;

  // * form.notify 用于处理 form 与 field 周期
  function notify(type: string, field?: any) {
    if (form.heart) {
      form.heart.publish(type, field || { form });
    }
  }

  function reset(...args) {
    each(form.fields, (field) => {
      field.reset(...args);
    });
  }

  function unmount() {
    form.notify(LifeCycles.ON_FORM_UNMOUNT);
  }

  function createField({
    basePath = [], // 来自父Field
    name, // 当前 field name
    initialValue,
    linkages,
    linkageReaction,
    deduplicate,
    validator,
  }: FieldFactoryProps): Field {
    const address = basePath.concat(name);
    const identifier = address.toString();

    if (!identifier) {
      throw new Error('field no identifier');
    }

    if (!form.fields[identifier]) {
      batch(() => {
        const field = FieldModel.fieldInit({
          form,
          name,
          address,
          identifier,
          validator,
        });

        form.fields[identifier] = pipe(
          {
            field,
            form,
          },
          FieldModel.setFieldInitial({
            initialValue,
          }),
          FieldModel.createFieldModel,
          FieldModel.createFieldReactions({
            linkages,
            linkageReaction,
            deduplicate,
          }),
        ).field;

        form.notify(LifeCycles.ON_FIELD_INIT, form.fields[identifier]);
      });
    }

    return form.fields[identifier];
  }

  function createArrayField({
    basePath = [],
    name,
    initialValue,
  }: {
    basePath?: (number | string)[];
    name: string;
    initialValue?: any[];
  }): ArrayField {
    const address = basePath.concat(name);
    const identifier = address.toString();

    if (!identifier) {
      throw new Error('no identifier');
    }
    if (!form.fields[identifier]) {
      batch(() => {
        form.fields[identifier] = pipe(
          {
            field: ArrayFieldModel.fieldInit({
              form,
              name,
              address,
              identifier,
            }),
          },
          ArrayFieldModel.setInitial({
            initialValue,
          }),
          ArrayFieldModel.createModel,
          ArrayFieldModel.setReactions,
        ).field;
      });
      // this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE);
    }

    return form.fields[identifier] as ArrayField;
  }

  function getValuesIn(address: Segment[]) {
    // getIn(form.values, address); // TODO path 系统添加
    // return form.values[address[1]][address[2]];
    let v = form.values;
    address.forEach((key) => {
      v = v && key in v ? v[key] : undefined;
    });
    return v;
  }

  function getInitialValuesIn(address: Segment[]) {
    let v = form.initialValues;
    address.forEach((key) => {
      v = v && key in v ? v[key] : undefined;
    });
    return v;
  }

  function setValuesIn(address: Segment[], value: any) {
    setIn(address, form.values, value);
  }
  return form;
};

const setInitial = (props: { initialValues?: any }) => (form: Form): Form => {
  form.initialValues = clone(props.initialValues) || ({} as any);

  form.values = toJS(form.initialValues);

  return form;
};

const createFormModel = (form: Form): Form => {
  return define(form, {
    fields: observable.shallow,
    values: observable,
    initialValues: observable,
    setValuesIn: action,
    reset: action,
  });
};

function setIn(segments: Segment[], source: any, value: any) {
  for (let i = 0; i < segments.length; i += 1) {
    const index = segments[i];

    if (!isValid(source)) return;
    if (isArr(source) && !isNumberIndex(index)) {
      return;
    }
    if (!isValid(source[index])) {
      if (!isValid(value)) {
        return;
      }
      if (i < segments.length - 1) {
        source[index] = isNum(segments[i + 1]) ? [] : {};
      }
    }
    if (i === segments.length - 1) {
      source[index] = value;
    }
    source = source[index];
  }
}

const createForm = (props?: FormProps) => {
  const initialValues = props?.initialValues;

  let form: Form;

  batch(() => {
    form = pipe(
      formInit(props),
      createFormModel,
      setInitial({
        initialValues,
      }),
    );

    form.notify(LifeCycles.ON_FORM_INIT);
  });

  return form!;
};

export default createForm;
