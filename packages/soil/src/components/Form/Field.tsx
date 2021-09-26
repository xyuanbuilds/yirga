import { useForm } from './context/Form';
import FieldContext, { useField } from './context/Field';

// * 没ArrayField场景，只有一个 ArrayField Context 用于提供 remove，push 等操作函数
function Field({ name, children }) {
  const form = useForm();
  const parent = useField();
  const field = form.createField({
    name,
    basePath: parent.address,
  });

  return (
    <FieldContext.Provider value={field}>{children}</FieldContext.Provider>
  );
}

export default Field;