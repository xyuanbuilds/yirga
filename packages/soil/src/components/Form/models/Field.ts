/* eslint-disable no-param-reassign */
import { define, observable, reaction, batch } from '@formily/reactive';
import { isValid } from '../predicate';
import type { Field, NormalEvent } from '../types/Field';
import type { Form } from '../types/Form';

interface Dependencies {
  form: Form;
}

const createField = ({ form }: Dependencies) => {
  return ({
    basePath = [], // 来自父Field
    name, // 当前 field name
    defaultValue: propsDefaultValue,
  }: {
    basePath?: (number | string)[];
    name: string | number;
    defaultValue?: any;
  }): Field => {
    const address = basePath.concat(name);
    const identifier = address.toString();

    /* 表单联动相关内容 */
    const disposers: (() => void)[] = [];

    if (!identifier) {
      throw new Error('field no identifier');
    }
    if (!form.fields[identifier]) {
      batch(() => {
        const field: Field = {
          form,
          get value() {
            return form.getValuesIn(address);
          },
          set value(value: any) {
            form.setValuesIn(address, value);
          },
          onInput(e: NormalEvent) {
            if ('target' in e) {
              field.value =
                'value' in e.target ? e.target.value : e.target.checked;
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
          disposers,
        };
        define(field, {
          value: observable.computed,
          onInput: batch,
        });

        const parentDefaultValue = field.value;
        const defaultValue = propsDefaultValue || parentDefaultValue;

        batch.scope?.(() => {
          if (isValid(defaultValue)) field.value = defaultValue;

          if (identifier.includes(',a')) {
            const c = `${identifier.slice(0, identifier.length - 1)}b`;
            field.disposers!.push(
              reaction(
                () => form.fields[c]?.value,
                (value) => {
                  field.value = value;
                },
              ),
            );
          }
        });

        form.fields[identifier] = field as Field;
      });
      // this.notify(LifeCycleTypes.ON_FORM_GRAPH_CHANGE);
    }
    return form.fields[identifier] as Field;
  };
};

export default createField;
