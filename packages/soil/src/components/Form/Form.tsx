/* eslint-disable no-param-reassign */
import * as React from 'react';
import {
  define,
  observable,
  // reaction,
  untracked,
  batch,
  // toJS,
  // autorun,
} from '@formily/reactive';
import { isArr, isNum, isValid, isNumberIndex } from './predicate';
import FormContext from './context/Form';
import type { Segment, Field, ArrayField } from './types/Field';
import type { Form } from './types/Form';

export type FieldPath = Array<string | number | FieldPath>;
// 0: ['a', 'b']: value

// * path/address 为数组
// * path.toString 为唯一标识

//! Form 组件, 内部提供 context 即可
// * 每个单独的组件只有一个 Form 组件
function FormInstance({ children }) {
  const { current: form } = React.useRef<Form>({
    fields: {}, // { xx.0.xx: Field }
    values: {}, // {}
    setValuesIn,
    getValuesIn,
    createField,
    createArrayField,
  });
  define(form, {
    fields: observable.shallow,
    values: observable,
    setValuesIn: batch,
  });

  function createField({
    basePath = [], // 来自父Field
    name, // 当前 field name
  }: {
    basePath?: (number | string)[];
    name: string | number;
  }): Field {
    const address = basePath.concat(name);
    const identifier = address.toString();

    if (!identifier) {
      throw new Error('no identifier');
    }
    if (!form.fields[identifier]) {
      batch(() => {
        const field = {
          form,
          get value() {
            return form.getValuesIn(address) || [];
          },
          set value(value: any) {
            form.setValuesIn(address, value);
          },
          onInput(e) {
            if ('target' in e) {
              field.value = e.target.value || e.target!.checked;
            } else {
              throw new Error('target without value');
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
          address,
          identifier,
        };
        define(field, {
          value: observable.computed, // 为啥是 computed ?
          onInput: batch,
        });

        form.fields[identifier] = field;
      });
      // this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE);
    }
    return form.fields[identifier] as Field;
  }

  function createArrayField({
    basePath = [],
    name = 'array',
  }: {
    basePath?: (number | string)[];
    name: string | number;
  }): ArrayField {
    const address = basePath.concat(name);
    const identifier = address.toString();

    if (!identifier) {
      throw new Error('no identifier');
    }
    if (!form.fields[identifier]) {
      batch(() => {
        const field = {
          form,
          remove() {},
          get value() {
            return form.getValuesIn(address) || [];
          },
          set value(value: any) {
            form.setValuesIn(address, value);
          },
          onInput(e) {
            if ('target' in e) {
              field.value = e.target.value || e.target!.checked;
            } else {
              throw new Error('target without value');
            }
          },
          address,
          identifier,
        };
        define(field, {
          value: observable.computed, // 为啥是 computed ?
          onInput: batch,
        });

        form.fields[identifier] = field;
      });
      // this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE);
    }

    // TODO 与createField相同，多增加类似 remove，push 等操作
    return form.fields[identifier] as ArrayField;
  }

  function getValuesIn(address: Segment[]) {
    // getIn(form.values, address); // TODO path 系统添加
    return form.values[address[1]][address[2]];
  }

  function setValuesIn(address: Segment[], value: any) {
    untracked(() => {
      setIn(address, form.values, value);
    });
  }

  // remove 任一行删除：（尽量快速）该 index 数据删除，该index 后所有数据 index -1；
  // move 任一行移动到指定位置，若下移，经过行做上移，若上移，经过行做下移；（慢速）
  // moveUp 任一行做上移操作；（尽量快速）
  // moveDown 任一行坐下移操作；（尽量快速）
  // push 行尾增加一行；（快速）

  // const onChange = () => {};

  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

// function getFieldPathStr(fieldPath: FieldPath): string {
//   if (typeof fieldPath === 'string' && fieldPath) return fieldPath;
//   if (typeof fieldPath === 'number') return String(fieldPath);
//   return fieldPath.reduce<string>((res, cur) => `${res}_${cur}`, '');
// }

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

export default React.memo(FormInstance);
