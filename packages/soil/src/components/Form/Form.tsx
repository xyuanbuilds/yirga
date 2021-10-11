/* eslint-disable no-param-reassign */
import * as React from 'react';
import {
  define,
  observable,
  // reaction,
  untracked,
  batch,
} from '@formily/reactive';
import { isArr, isNum, isValid, isNumberIndex } from './predicate';
import FormContext from './context/Form';
import * as FieldModel from './models/Field';
import { pipe, each } from './utils';

import type { Segment, Field, ArrayField, GeneralField } from './types/Field';
import type { Form, FieldFactoryProps } from './types/Form';

export type FieldPath = Array<string | number | FieldPath>;
// 0: ['a', 'b']: value

// * path/address 为数组
// * path.toString 为唯一标识

//! Form 组件, 内部提供 context 即可
// * 每个单独的组件只有一个 Form 组件
function FormInstance({ children }) {
  const { current: form } = React.useRef<Form>({
    fields: {}, // { xx.0.xx: Field }
    values: {}, // { array: [{ a1: xx }, { a1: xx }]}
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

  // window.form_test = form;

  function createField({
    basePath = [], // 来自父Field
    name, // 当前 field name
    defaultValue,
    linkages,
    linkageReaction,
    deduplicate,
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
        });

        form.fields[identifier] = pipe(
          FieldModel.createFieldModel({
            form,
            field,
          }),
          FieldModel.createFieldReactions({
            linkages,
            linkageReaction,
            deduplicate,
          }),
          FieldModel.setFieldInitial({
            defaultValue,
          }),
        ).field;
      });
    }

    return form.fields[identifier];
  }

  // remove 任一行删除：（尽量快速）该 index 数据删除，该index 后所有数据 index -1；
  // move 任一行移动到指定位置，若下移，经过行做上移，若上移，经过行做下移；（慢速）
  // moveUp 任一行做上移操作；（尽量快速）
  // moveDown 任一行坐下移操作；（尽量快速）
  function createArrayField({
    basePath = [],
    name,
    defaultValue,
  }: {
    basePath?: (number | string)[];
    name: string;
    defaultValue?: any[];
  }): ArrayField {
    const address = basePath.concat(name);
    const identifier = address.toString();

    if (!identifier) {
      throw new Error('no identifier');
    }
    if (!form.fields[identifier]) {
      batch(() => {
        const field: ArrayField = {
          form,
          push(...items: any[]) {
            if (!isArr(field.value)) return;
            batch(() => {
              field.value.push(...items);
              // 用于触发相应的生命周期，及其他状态，暂不需要
              // TODO return field.onInput(field.value);
            });
          },
          remove(index: number) {
            if (!isArr(field.value)) return;
            batch(() => {
              field.value.splice(index, 1);
              spliceArrayState(field, {
                startIndex: index,
                deleteCount: 1,
              });
              // return this.onInput(this.value);
            });
          },
          get value() {
            return form.getValuesIn(address) || [];
          },
          set value(value: any) {
            form.setValuesIn(address, value);
          },
          onInput(e) {
            if ('target' in e) {
              field.value =
                'value' in e.target ? e.target.value : e.target.checked;
            } else {
              throw new Error('target without value');
            }
          },
          defaultValue: [],
          address,
          identifier,
          name,
        };
        define(field, {
          value: observable.computed, // 为啥是 computed ?
          onInput: batch,
        });

        batch.scope?.(() => {
          if (isArr(defaultValue)) field.value = defaultValue;
        });

        form.fields[identifier] = field;
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
      v = v[key];
    });
    return v;
  }

  function setValuesIn(address: Segment[], value: any) {
    untracked(() => {
      setIn(address, form.values, value);
    });
  }

  // TODO 添加 去除 reactions 逻辑
  // * form 注销时，手动清除所有的 disposers
  // const disposers = [];
  // React.useEffect(() => {
  //   return () => {
  //     disposers.forEach((dispose) => {
  //       dispose();
  //     });
  //   };
  // }, []);

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

export function spliceArrayState(
  field: ArrayField,
  props?: {
    startIndex?: number;
    deleteCount?: number;
    insertCount?: number;
  },
) {
  const { startIndex, deleteCount, insertCount } = {
    startIndex: 0,
    deleteCount: 0,
    insertCount: 0,
    ...props,
  };
  const address = field.address.toString();
  const { fields } = field.form;
  const fieldPatches: {
    type: 'remove' | 'update';
    identifier: string;
    payload?: GeneralField;
  }[] = [];
  const offset = insertCount - deleteCount;
  const isArrayChildren = (identifier: string) => {
    return (
      identifier.indexOf(address) === 0 && identifier.length > address.length
    );
  };
  const isAfterNode = (identifier: string) => {
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^\.(\d+)/)?.[1];
    if (number === undefined) return false;
    const index = Number(number);
    return index > startIndex + deleteCount - 1;
  };
  const isInsertNode = (identifier: string) => {
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^\.(\d+)/)?.[1];
    if (number === undefined) return false;
    const index = Number(number);
    return index >= startIndex && index < startIndex + insertCount;
  };
  const isDeleteNode = (identifier: string) => {
    const preStr = identifier.slice(0, address.length);
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^,(\d+)/)?.[1];
    if (number === undefined) return false;
    const index = Number(number);
    const target = `${preStr}${afterStr.replace(
      /^,\d+/,
      `,${index + deleteCount}`,
    )}`;
    return !fields[target];
  };
  const moveIndex = (identifier: string) => {
    if (offset === 0) return identifier;
    const preStr = identifier.slice(0, address.length);
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^\.(\d+)/)?.[1];
    if (number === undefined) return identifier;
    const index = Number(number) + offset;
    return `${preStr}${afterStr.replace(/^\.\d+/, `.${index}`)}`;
  };

  batch(() => {
    each(fields, (curField, identifier) => {
      if (isArrayChildren(identifier)) {
        if (isAfterNode(identifier)) {
          const newIdentifier = moveIndex(identifier);
          fieldPatches.push({
            type: 'update',
            identifier: newIdentifier,
            payload: curField,
          });
        }
        if (isInsertNode(identifier) || isDeleteNode(identifier)) {
          fieldPatches.push({ type: 'remove', identifier });
        }
      }
    });
    applyFieldPatches(fields, fieldPatches);
  });
  // field.form.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE);
}

export function applyFieldPatches(
  target: Record<string, GeneralField>,
  patches: {
    type: 'remove' | 'update';
    identifier: string;
    payload?: GeneralField;
  }[],
) {
  patches.forEach(({ type, identifier, payload }) => {
    if (type === 'remove') {
      target[identifier].disposers?.forEach((dispose) => {
        dispose();
      });
      delete target[identifier];
    } else if (type === 'update') {
      if (payload) {
        target[identifier] = payload;
      }
    }
  });
}

export default React.memo(FormInstance);
