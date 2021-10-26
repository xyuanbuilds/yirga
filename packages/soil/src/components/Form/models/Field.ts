/* eslint-disable no-param-reassign */
import {
  define,
  observable,
  reaction,
  batch,
  action,
  toJS,
} from '@formily/reactive';
import { isValid, isArr, isFn } from '../predicate';
import LifeCycles from '../effects/constants';

import type { Field, ArrayField, NormalEvent } from '../types/Field';
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
  validator,
}: Pick<FieldFactoryProps, 'name'> & {
  form: Form;
  identifier: string;
  address: (number | string)[];
  validator?: any;
}): Field => {
  const field: Field = {
    form,
    get value() {
      return form.getValuesIn(field.address);
    },
    set value(value: any) {
      form.setValuesIn(field.address, value);
    },
    async onInput(e: NormalEvent) {
      field.caches.inputting = true;
      if ('target' in e) {
        field.value = 'value' in e.target ? e.target.value : e.target.checked;
      } else {
        throw new Error('invalid target');
      }
      field.modified = true;

      //  const values = getValuesFromEvent(args);
      //  const value = values[0];
      //  this.inputValue = value;
      //  this.inputValues = values;
      // form.modified = true;

      // form.notify(LifeCycleTypes.ON_FIELD_INPUT_VALUE_CHANGE, this);
      // form.notify(LifeCycleTypes.ON_FORM_INPUT_CHANGE, this.form);
      await field.validate();
      field.caches.inputting = false;
    },
    get initialValue() {
      return form.getInitialValuesIn(field.address);
    },
    modified: false,
    validate,
    validator,
    setValidator,
    feedbacks: [],
    reset,
    address,
    identifier,
    name,
    dispose,
    destroy,
    disposers: [],
    caches: {
      inputting: false,
    },
  };

  function setValidator(
    newValidator: (name: string, value: unknown) => Promise<any[]>,
  ) {
    field.validator = newValidator;
  }
  async function validate() {
    if (!field.modified) return;
    const start = () => {
      // this.setValidating(true)
      // this.form.notify(LifeCycleTypes.ON_FIELD_VALIDATE_START, this)
    };
    const end = () => {
      // TODO validate status
      // this.setValidating(false)
      // if (this.valid) {
      //   this.form.notify(LifeCycleTypes.ON_FIELD_VALIDATE_SUCCESS, this)
      // } else {
      //   this.form.notify(LifeCycleTypes.ON_FIELD_VALIDATE_FAILED, this)
      // }
      // this.form.notify(LifeCycleTypes.ON_FIELD_VALIDATE_END, this)
    };
    start();
    // TODO 先validator 获取 validate 结果
    // TODO 再 setFeedback 设置 Item 样式
    try {
      const results = await field.validator(field.identifier, field.value);
      field.feedbacks = results;
    } catch (e) {
      field.feedbacks = e;
    }
    end();
    // return results
  }

  function reset(options?: { forceClear?: boolean }) {
    field.modified = false;
    field.feedbacks = [];
    // this.visited = false
    // this.feedbacks = []
    // this.inputValue = undefined
    // this.inputValues = []
    // batch.scope?.(() => {
    if (options?.forceClear) {
      if (isArrayField(field)) {
        field.value = [] as any;
      } else {
        field.value = undefined;
      }
    } else if (isValid(field.value)) {
      // if (isArrayField(field)) {
      // field.value = toJS(field.initialValue);
      // } else {
      field.value = toJS(field.initialValue);
      // }
    }
    // });
  }

  function dispose() {
    field.disposers.forEach((c) => {
      c();
    });
    // field.form.removeEffects(field);
  }

  function destroy() {
    field.dispose();
    delete field.form.fields[field.identifier];
  }

  return field;
};

const createFieldModel = ({ form, field }: Dependencies): Dependencies => {
  const { identifier } = field;
  if (!form.fields[identifier]) {
    define(field, {
      value: observable.computed,
      onInput: batch,
      reset: action,
      initialValue: observable.computed,
      modified: observable.ref,
      validator: observable.shallow,
      feedbacks: observable.shallow,
      setValidator: action,
      validate: action,
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
    field.disposers!.push(
      reaction(
        () => field.value,
        () => {
          field.form.notify(LifeCycles.ON_FIELD_VALUE_CHANGE, field);
          if (field.modified && !field.caches.inputting) {
            field.validate();
          }
        },
      ),
    );

    field.disposers!.push(
      reaction(
        () => field.validator,
        () => {
          if (field.modified) {
            field.validate();
          }
        },
      ),
    );
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

            const curField = form.fields[`${arrayKey},${indexKey},${linkages}`];
            // TODO 优化为 query 方式获取
            return curField === undefined ? null : curField.value;
          },
          (values: any | any[]) => {
            // * 空数组或 null 表示当前 field 已失效
            if (values === null || values.length <= 0) {
              return;
            }
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
              const arr = form.values[address[0]].reduce(
                (res: any[], cur: any) => {
                  res.push(cur[address[keyIndex]]);
                  return res;
                },
                [],
              );

              if (
                prev.length !== arr.length ||
                arr.find((v: any, index: number) => v !== prev[index])
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
  initialValue: propsInitialValue,
}: Pick<FieldFactoryProps, 'initialValue'>) => {
  return ({ field, form }: Dependencies): Dependencies => {
    /* 表单联动相关内容 */
    const defaultValue =
      toJS(field.initialValue) || propsInitialValue || undefined;

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

export function isArrayField(node: any): node is ArrayField {
  return isArr(node.value);
}

export { fieldInit, createFieldModel, createFieldReactions, setFieldInitial };
