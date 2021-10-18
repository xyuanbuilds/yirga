/* eslint-disable no-param-reassign */
import { define, observable, batch } from '@formily/reactive';
import { fieldInit as normalFieldInit } from './Field';
import { isArr, isNumberIndex } from '../predicate';
import { each } from '../utils';

import type { GeneralField, ArrayField } from '../types/Field';
import type { Form, FieldFactoryProps } from '../types/Form';

type Dependencies = {
  field: ArrayField;
};

const fieldInit = ({
  form,
  name,
  identifier,
  address,
}: Pick<FieldFactoryProps, 'name'> & {
  form: Form;
  identifier: string;
  address: (number | string)[];
}): ArrayField => {
  const field: ArrayField = Object.assign(
    normalFieldInit({
      form,
      address,
      identifier,
      name,
    }),
    {
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
          spliceArrayState(field, {
            startIndex: index,
            deleteCount: 1,
          });
          field.value.splice(index, 1);
          // return this.onInput(this.value);
        });
      },
      move(fromIndex: number, toIndex: number) {
        if (!isArr(field.value)) return;
        if (fromIndex === toIndex) return;
        batch(() => {
          exchangeArrayState(field, {
            fromIndex,
            toIndex,
          });
          const fromItem = field.value[fromIndex];
          field.value.splice(fromIndex, 1);
          field.value.splice(toIndex, 0, fromItem);
          // return this.onInput(this.value);
        });
      },
      moveUp(index: number) {
        if (!isArr(field.value)) return;
        field.move(index, index - 1 < 0 ? field.value.length - 1 : index - 1);
      },
      moveDown(index: number) {
        if (!isArr(field.value)) return;
        field.move(index, index + 1 >= field.value.length ? 0 : index + 1);
      },
      defaultValue: [],
    },
  );

  return field;
};

const createModel = ({ field }: Dependencies): Dependencies => {
  if (!field.form.fields[field.identifier]) {
    define(field, {
      value: observable.computed,
      onInput: batch,
    });

    field.form.fields[field.identifier] = field;
  }

  return {
    field,
  };
};

const setInitial = ({
  defaultValue: propsDefaultValue,
}: {
  defaultValue?: any[];
}) => ({ field }: Dependencies): Dependencies => {
  /* 表单联动相关内容 */
  const parentDefaultValue = field.value;
  const defaultValue = propsDefaultValue || parentDefaultValue;

  console.log('d', defaultValue, field.value);

  batch.scope?.(() => {
    if (isArr(defaultValue)) field.value = defaultValue;
  });

  return {
    field,
  };
};

function exchangeArrayState(
  field: ArrayField,
  props: {
    fromIndex?: number;
    toIndex?: number;
  },
) {
  const { fromIndex, toIndex } = {
    fromIndex: 0,
    toIndex: 0,
    ...props,
  };
  const address = field.address.toString();
  const { fields } = field.form;
  const fieldPatches: {
    type: 'remove' | 'update';
    identifier: string;
    payload?: GeneralField;
  }[] = [];
  const isArrayChildren = (identifier: string) => {
    return (
      identifier.indexOf(address) === 0 && identifier.length > address.length
    );
  };

  const isFromOrToNode = (identifier: string) => {
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^,(\d+)/)?.[1];
    if (number === undefined) return false;
    const index = Number(number);

    return index === toIndex || index === fromIndex;
  };

  const moveIndex = (identifier: string) => {
    const preStr = identifier.slice(0, address.length);
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^,(\d+)/)?.[1];
    const current = Number(number);
    let index = current;
    if (index === fromIndex) {
      index = toIndex;
    } else {
      index = fromIndex;
    }

    return `${preStr}${afterStr.replace(/^,\d+/, `,${index}`)}`;
  };

  batch(() => {
    each(fields, (curField, identifier) => {
      if (isArrayChildren(identifier)) {
        if (isFromOrToNode(identifier)) {
          const newIdentifier = moveIndex(identifier);
          fieldPatches.push({
            type: 'update',
            identifier: newIdentifier,
            payload: curField,
          });
          if (!fields[newIdentifier]) {
            fieldPatches.push({
              type: 'remove',
              identifier,
            });
          }
        }
      }
    });
    applyFieldPatches(fields, fieldPatches);
  });
}

function spliceArrayState(
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
    const number = afterStr.match(/^,(\d+)/)?.[1];
    if (number === undefined) return false;
    const index = Number(number);
    return index > startIndex + deleteCount - 1;
  };
  const isInsertNode = (identifier: string) => {
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^,(\d+)/)?.[1];
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
    return (
      index >= startIndex &&
      !fields[
        `${preStr}${afterStr.replace(/^,\d+/, `.${index + deleteCount}`)}`
      ]
    );
  };
  const moveIndex = (identifier: string) => {
    if (offset === 0) return identifier;
    const preStr = identifier.slice(0, address.length);
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^,(\d+)/)?.[1];
    if (number === undefined) return identifier;
    const index = Number(number) + offset;
    return `${preStr}${afterStr.replace(/^,\d+/, `,${index}`)}`;
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

function applyFieldPatches(
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
      //* 路径信息变更
      if (identifier && payload) {
        payload.identifier = identifier;
        payload.address = identifier
          .split(',')
          .map((i) => (isNumberIndex(i) ? Number(i) : i));
      }
    }
  });
}

export { fieldInit, createModel, setInitial };
