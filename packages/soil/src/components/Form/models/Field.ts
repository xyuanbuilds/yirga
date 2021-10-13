/* eslint-disable no-param-reassign */
import { define, observable, reaction, batch } from '@formily/reactive';
import { isValid, isArr, isFn } from '../predicate';

import type { Field, NormalEvent } from '../types/Field';
import type { Form, FieldFactoryProps } from '../types/Form';

interface Dependencies {
  form: Form;
  field: Field;
}

const fieldInit = ({
  form,
  name,
  identifier,
  address,
}: Pick<FieldFactoryProps, 'name'> & {
  form: Form;
  identifier: string;
  address: (number | string)[];
}): Field => {
  const field: Field = {
    form,
    get value() {
      return form.getValuesIn(field.address);
    },
    set value(value: any) {
      form.setValuesIn(field.address, value);
    },
    onInput(e: NormalEvent) {
      if ('target' in e) {
        field.value = 'value' in e.target ? e.target.value : e.target.checked;
      } else {
        throw new Error('invalid target');
      }

      //  const values = getValuesFromEvent(args);
      //  const value = values[0];
      //  this.inputValue = value;
      //  this.inputValues = values;

      // field.modified = true;
      // form.modified = true;

      // form.notify(LifeCycleTypes.ON_FIELD_INPUT_VALUE_CHANGE, this);
      // form.notify(LifeCycleTypes.ON_FORM_INPUT_CHANGE, this.form);

      //  await this.validate('onInput');
      //  this.caches.inputting = false;
    },
    defaultValue: undefined,
    address,
    identifier,
    name,
    disposers: [],
  };

  return field;
};

const createFieldModel = ({ form, field }: Dependencies): Dependencies => {
  const { identifier } = field;
  if (!form.fields[identifier]) {
    define(field, {
      value: observable.computed,
      onInput: batch,
    });

    form.fields[identifier] = field as Field;
    // this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE);
  }
  return {
    form,
    field: form.fields[identifier] as Field,
  };
};

const createFieldReactions = ({
  linkages,
  linkageReaction,
  deduplicate,
}: Pick<FieldFactoryProps, 'linkages' | 'linkageReaction' | 'deduplicate'>) => {
  return ({ field, form }: Dependencies): Dependencies => {
    /* 表单联动相关内容 */

    /* 副作用添加 */
    //* 普通表单联动 & 同行表单联动
    if (isValid(linkages) && isFn(linkageReaction)) {
      field.disposers!.push(
        reaction(
          () => {
            const { address } = field;
            const arrayKey = address[0]; // TODO field.parent 获取准确地址
            const indexKey = address[1];
            if (isArr(linkages)) {
              const curLine = form.fields[arrayKey]?.value[indexKey];
              if (!curLine) return [];

              return linkages.map((key) => curLine[key]);
            }

            // TODO 优化为 query 方式获取
            return form.fields[`${arrayKey},${indexKey},${linkages}`]?.value;
          },
          (values: any | any[]) => {
            linkageReaction(field, values);
          },
        ),
      );
    }
    //* 整列表单联动（重名校验）
    if (deduplicate) {
      let prev = [];
      batch.scope?.(() => {
        field.disposers!.push(
          reaction(
            () => {
              const { address, name } = field;
              const keyIndex = address.findIndex((s) => s === name);
              // TODO 优化数组内寻址
              const arr = form.values[address[0]].reduce((res, cur) => {
                res.push(cur[address[keyIndex]]);
                return res;
              }, []);

              if (
                prev.length !== arr.length ||
                arr.find((v, index) => v !== prev[index])
              ) {
                prev = arr;
              }
              return prev;
            },
            (values) => {
              // TODO 优化可变index地址
              const { address, value } = field;
              const fieldIndex = address[1];

              if (
                isValid(value) &&
                Array.isArray(values) &&
                values.find((v, index) => v === value && index !== fieldIndex)
              ) {
                console.log(`${field.identifier} same: ${field.value}`);
              }
            },
          ),
        );
      });
    }
    /* 副作用添加 */

    return {
      form,
      field,
    };
  };
};

const setFieldInitial = ({
  defaultValue: propsDefaultValue,
}: Pick<FieldFactoryProps, 'defaultValue'>) => {
  return ({ field, form }: Dependencies): Dependencies => {
    /* 表单联动相关内容 */
    const parentDefaultValue = field.value;
    const defaultValue = propsDefaultValue || parentDefaultValue;

    batch.scope?.(() => {
      if (isValid(defaultValue)) {
        field.value = defaultValue;
      }
    });

    return {
      field,
      form,
    };
  };
};

export { fieldInit, createFieldModel, createFieldReactions, setFieldInitial };
