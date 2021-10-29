/* eslint-disable no-param-reassign */
import { define, observable, batch, action, toJS } from '@formily/reactive';
import {
  isValid,
  isArr,
  isNumberIndex,
  isNum,
  isFn,
  isPlainObj,
} from '../predicate';
import * as FieldModel from './Field';
import * as ArrayFieldModel from './ArrayField';
import LifeCycles from '../effects/constants';
import { createHeart, runEffects } from './LifeCycle';
import { each, pipe } from '../utils';

import type { Field, ArrayField, Segment } from '../types/Field';
import type { Form, FormProps, FieldFactoryProps } from '../types/Form';

const formInit = (props: FormProps | undefined): Form => {
  const effects = props?.effects;
  const form: Form = {
    lifeCycles: [],
    modified: false,
    fields: {}, // { xx.0.xx: Field }
    values: {}, // { array: [{ a1: xx }, { a1: xx }]}
    initialValues: {},
    setInitialValues,
    setValuesIn,
    getValuesIn,
    getInitialValuesIn,
    createField,
    createArrayField,
    notify,
    reset,
    validate,
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
    form.modified = false;
    each(form.fields, (field) => {
      field.reset(...args);
    });
  }

  function setInitialValues(
    initialValues: any,
    strategy: 'merge' | 'replace' = 'replace',
  ) {
    if (!isPlainObj(initialValues)) return;
    if (strategy === 'merge') {
      // form.initialValues = merge(this.initialValues, initialValues, {
      //   arrayMerge: (target, source) => source,
      // })
      // TODO
    } else {
      form.initialValues = initialValues as any;
    }
    if (!form.modified) {
      form.values = getValuesFromInitialValue(form.initialValues);
    }
  }

  async function validate() {
    const promises: Promise<any>[] = [];

    each(form.fields, (field) => {
      promises.push(
        field.validate({
          force: true,
        }),
      );
    });

    const res = await Promise.all(promises).then(() => {
      let mostTopIndex = -1;
      let hasGotIndex = promises.length;
      each(form.fields, (curField) => {
        const curLineIndex =
          curField.address.length >= 3 ? (curField.address[1] as number) : -1;
        if (curLineIndex >= hasGotIndex) return;
        if (curField.feedbacks.length > 0) {
          hasGotIndex = hasGotIndex > curLineIndex ? curLineIndex : hasGotIndex;
          if (mostTopIndex === -1) mostTopIndex = curLineIndex;
          mostTopIndex =
            mostTopIndex >= 0 && mostTopIndex > curLineIndex
              ? curLineIndex
              : mostTopIndex;
        }
      });

      return mostTopIndex;
    });

    return res;
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
  form.initialValues = props.initialValues || ({} as any);

  form.values = getValuesFromInitialValue(form.initialValues);

  return form;
};

const createFormModel = (form: Form): Form => {
  return define(form, {
    fields: observable.shallow,
    values: observable,
    modified: observable.ref,
    initialValues: observable,
    setInitialValues: action,
    setValuesIn: action,
    reset: action,
    validate: action,
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

function initialValuesHandle(initialValues: any) {
  Object.keys(initialValues).forEach((key: string) => {
    const cur = initialValues[key];
    if (isArr(cur)) {
      initialValues[key] = ArrayFieldModel.setLineId(cur);
    } else if (isPlainObj(cur)) {
      initialValuesHandle(cur);
    }
  });

  return initialValues;
}

function getValuesFromInitialValue(initialValues: any): any {
  return initialValuesHandle(toJS(initialValues));
}

export default createForm;
