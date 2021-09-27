import { useForm } from './context/Form';
import ReactiveField from './ReactiveField';
import FieldContext, { useField } from './context/Field';

// * 没ArrayField场景，只有一个 ArrayField Context 用于提供 remove，push 等操作函数
function Field({ name, children, component }) {
  const form = useForm();
  const parent = useField();
  const field = form.createField({
    name,
    basePath: parent?.address,
  });

  // TODO 后面如果确认只有一层嵌套，可以去除 FieldContext
  return (
    <FieldContext.Provider value={field}>
      <ReactiveField component={component} field={field}>
        {children}
      </ReactiveField>
    </FieldContext.Provider>
  );
}

export default Field;
