import { useForm } from './context/Form';
import ReactiveField from './ReactiveField';
import FieldContext from './context/Field';

// 0: ['a', 'b']: value
// * 没ArrayField场景，只有一个 ArrayField Context 用于提供 remove，push 等操作函数
function ArrayField({ name: arrayName = 'array', children }) {
  const form = useForm();
  const field = form.createArrayField({
    name: arrayName,
  });

  return (
    <FieldContext.Provider value={field}>
      <ReactiveField field={field}> {children}</ReactiveField>
    </FieldContext.Provider>
  );
}

export default ArrayField;
