import { useEffect, useRef } from 'react';
import { useForm } from './context/Form';
import ReactiveField from './ReactiveField';
import FieldContext, { useField } from './context/Field';
import type { FieldProps, Field as IField } from './types/Field';

const useAttach = <T extends IField>(target: T): T => {
  // const oldTargetRef = useRef<IField>(null!);
  // useEffect(() => {
  //   if (oldTargetRef.current && target !== oldTargetRef.current) {
  //     console.log('what diffs ?');
  //     oldTargetRef.current.disposers?.forEach((dispose) => {
  //       dispose();
  //     });
  //   }
  //   oldTargetRef.current = target;
  //   return () => {
  //     console.log('what ?');
  //     target.disposers?.forEach((dispose) => {
  //       dispose();
  //     });
  //   };
  // }, [target]);
  return target;
};

function Field({
  name,
  children,
  component,
  basePath,
  defaultValue,
}: FieldProps) {
  const form = useForm();
  const parent = useField();
  const field = useAttach(
    form.createField({
      name,
      basePath: basePath || parent?.address,
      defaultValue,
    }),
  );

  return (
    <FieldContext.Provider value={field}>
      <ReactiveField component={component} field={field}>
        {children}
      </ReactiveField>
    </FieldContext.Provider>
  );
}

export default Field;
