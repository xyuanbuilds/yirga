import type * as React from 'react';
import TableFrom from './Table';
import useForm from '../Form/useForm';
import ArrayField from '../Form/ArrayField';
import FormC from '../Form/Form';
import { useField } from '../Form/context/Field';
import { useForm as useFormInstance } from '../Form/context/Form';
import type { ArrayField as ArrayFieldInstance } from '../Form/types/Field';
import type { Form as FormInstance } from '../Form/types/Form';

export type FormActions = Pick<FormInstance, 'reset' | 'validate'> &
  Pick<ArrayFieldInstance, 'push'>;

type RenderChildren = (actions: FormActions) => React.ReactNode;

export interface FormRenderProps {
  children: RenderChildren;
}

function FormRender({ children }) {
  const { push } = useField<ArrayFieldInstance>();
  const { reset, validate } = useFormInstance();

  return children({ push, reset, validate });
}

export interface FormProps extends FormRenderProps {
  // initialValues?: Record<string, any>[];
  form?: FormInstance;
}

function Form({ children, form }) {
  return (
    <FormC form={form}>
      <ArrayField>
        <FormRender>{children}</FormRender>
      </ArrayField>
    </FormC>
  );
}

export { Form };
export default Object.assign(TableFrom, {
  useForm,
});
