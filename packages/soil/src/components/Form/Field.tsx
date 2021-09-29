import { useForm } from './context/Form';
import ReactiveField from './ReactiveField';
import FieldContext, { useField } from './context/Field';
import type { FieldProps } from './types/Field';

function Field({ name, children, component, basePath }: FieldProps) {
  const form = useForm();
  const parent = useField();
  const field = form.createField({
    name,
    basePath: basePath || parent?.address,
  });

  return (
    <FieldContext.Provider value={field}>
      <ReactiveField component={component} field={field}>
        {children}
      </ReactiveField>
    </FieldContext.Provider>
  );
}

export default Field;
