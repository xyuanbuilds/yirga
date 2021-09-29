import { useForm } from './context/Form';
import ReactiveField from './ReactiveField';
import FieldContext from './context/Field';

// 0: ['a', 'b']: value
// * 没ArrayField场景，只有一个 ArrayField Context 用于提供 remove，push 等操作函数
function ArrayField({ name: arrayName = 'array', children, defaultValue }) {
  const form = useForm();
  const field = form.createArrayField({
    name: arrayName,
    defaultValue,
  });

  return (
    <FieldContext.Provider value={field}>
      {/* 目前 ArrayField 只有 value 变化，可以考虑去除这层 ReactiveField */}
      <ReactiveField onlyObservable field={field}>
        {children}
      </ReactiveField>
    </FieldContext.Provider>
  );
}

export default ArrayField;
