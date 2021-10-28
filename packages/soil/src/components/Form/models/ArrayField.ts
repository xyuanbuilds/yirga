/* eslint-disable no-param-reassign */
import {
  define,
  observable,
  batch,
  toJS,
  action,
  reaction,
} from '@formily/reactive';
import { nanoid } from 'nanoid/non-secure';
import { fieldInit as normalFieldInit } from './Field';
import { isArr, isNumberIndex } from '../predicate';
import { each } from '../utils';

import type { GeneralField, ArrayField } from '../types/Field';
import type { Form, FieldFactoryProps } from '../types/Form';

type Dependencies = {
  field: ArrayField;
};

const ROW_ID_KEY = Symbol('array_row_id');

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
      reset(options?: { forceClear?: boolean }) {
        field.modified = false;
        field.feedbacks = [];
        // this.visited = false
        // this.feedbacks = []
        // this.inputValue = undefined
        // this.inputValues = []
        // batch.scope?.(() => {
        if (options?.forceClear) {
          field.value = [] as any;
        } else if (isArr(field.value)) {
          const hasLine =
            isArr(field.initialValue) && field.initialValue.length > 0;
          field.value = hasLine
            ? setLineId(toJS(field.initialValue))
            : toJS(field.initialValue) || [];
        }
      },
      push(...items: any[]) {
        if (!isArr(field.value)) return;
        action(() => {
          field.value.push(...setLineId(items));

          field.form.modified = true;
          // 用于触发相应的生命周期，及其他状态，暂不需要
          // TODO return field.onInput(field.value);
        });
      },
      remove(index: number) {
        if (!isArr(field.value)) return;
        action(() => {
          spliceArrayState(field, {
            startIndex: index,
            deleteCount: 1,
          });
          field.value.splice(index, 1);
          // return this.onInput(this.value);

          field.form.modified = true;
        });
      },
      move(fromIndex: number, toIndex: number) {
        if (!isArr(field.value)) return;
        if (fromIndex === toIndex) return;
        action(() => {
          exchangeArrayState(field, {
            fromIndex,
            toIndex,
          });
          const fromItem = field.value[fromIndex];
          field.value.splice(fromIndex, 1);
          field.value.splice(toIndex, 0, fromItem);
          // return this.onInput(this.value);

          field.form.modified = true;
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
    },
  );

  return field;
};

const createModel = ({ field }: Dependencies): Dependencies => {
  if (!field.form.fields[field.identifier]) {
    define(field, {
      value: observable.computed,
      onInput: batch,
      reset: action,
      initialValue: observable.computed,
    });

    field.form.fields[field.identifier] = field;
  }

  return {
    field,
  };
};

const setInitial = ({
  initialValue: propsInitialValue,
}: {
  initialValue?: any[];
}) => ({ field }: Dependencies): Dependencies => {
  /* 表单联动相关内容 */
  const defaultValue = toJS(field.initialValue) || propsInitialValue || [];

  batch.scope?.(() => {
    if (isArr(defaultValue)) field.value = setLineId(defaultValue);
  });

  return {
    field,
  };
};

const setReactions = ({ field }: Dependencies): Dependencies => {
  field.disposers.push(
    reaction(
      () => field.value?.length,
      (newLength, oldLength) => {
        if (oldLength && !newLength) {
          cleanupArrayChildren(field, 0);
        } else if (newLength < oldLength) {
          cleanupArrayChildren(field, newLength);
        }
      },
    ),
  );

  return { field };
};

// * 值操作行为模式
type Patch =
  | {
      type: 'remove';
      identifier: string;
    }
  | {
      type: 'update';
      identifier: string;
      oldIdentifier: string;
      payload?: GeneralField;
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
  const fieldPatches: Patch[] = [];
  const isArrayChildren = (identifier: string) => {
    return (
      identifier.indexOf(address) === 0 && identifier.length > address.length
    );
  };

  const isDown = fromIndex < toIndex;

  const isMoveNode = (identifier: string) => {
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^,(\d+)/)?.[1];
    if (number === undefined) return false;
    const index = Number(number);

    return isDown
      ? index > fromIndex && index <= toIndex
      : index < fromIndex && index >= toIndex;
  };

  const isFrom = (identifier: string) => {
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^,(\d+)/)?.[1];
    if (number === undefined) return false;
    const index = Number(number);

    return index === fromIndex;
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
      index += isDown ? -1 : 1;
    }

    return `${preStr}${afterStr.replace(/^,\d+/, `,${index}`)}`;
  };

  batch(() => {
    each(fields, (curField, identifier) => {
      if (isArrayChildren(identifier)) {
        if (isMoveNode(identifier) || isFrom(identifier)) {
          const newIdentifier = moveIndex(identifier);
          fieldPatches.push({
            type: 'update',
            identifier: newIdentifier,
            oldIdentifier: identifier,
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
  const fieldPatches: Patch[] = [];
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
            oldIdentifier: identifier,
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
  patches: Patch[],
) {
  patches.forEach((patch) => {
    if (patch.type === 'remove') {
      const { identifier } = patch;
      target[identifier]?.destroy();
    } else if (patch.type === 'update') {
      const { identifier, oldIdentifier, payload } = patch;
      if (payload) {
        target[identifier] = payload;
        if (target[oldIdentifier] === payload) delete target[oldIdentifier];
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

function cleanupArrayChildren(field: ArrayField, start: number) {
  const address = field.address.toString();
  const { fields } = field.form;

  const isArrayChildren = (identifier: string) => {
    return (
      identifier.indexOf(address) === 0 && identifier.length > address.length
    );
  };

  const isNeedCleanup = (identifier: string) => {
    const afterStr = identifier.slice(address.length);
    const number = afterStr.match(/^,(\d+)/)?.[1];
    if (number === undefined) return false;
    const index = Number(number);
    return index >= start;
  };

  batch(() => {
    each(fields, (curField, identifier) => {
      if (isArrayChildren(identifier) && isNeedCleanup(identifier)) {
        curField.destroy();
      }
    });
  });
}

function setLineId(items: any[]) {
  return items.map((i) => ({
    ...i,
    [ROW_ID_KEY]: nanoid(),
  }));
}

export { ROW_ID_KEY, setLineId };
export { fieldInit, createModel, setInitial, setReactions };
