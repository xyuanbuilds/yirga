/* eslint-disable no-param-reassign */
import * as React from 'react';
import FormContext from './context/Form';
import createForm from './models/Form';

// import { isPlainObj } from './predicate';

import type { Form } from './types/Form';

export type FieldPath = Array<string | number | FieldPath>;
// 0: ['a', 'b']: value

// * path/address 为数组
// * path.toString 为唯一标识

function FormInstance({
  form,
  children,
}: // initialValues,
{
  form?;
  children?;
  // initialValues?;
}) {
  const { current: formInstance } = React.useRef<Form>(form || createForm());

  // React.useEffect(() => {
  //   if (isPlainObj(initialValues)) formInstance.setInitialValues(initialValues);
  // }, [formInstance, initialValues]);

  return (
    <FormContext.Provider value={formInstance}>{children}</FormContext.Provider>
  );
}

export default React.memo(FormInstance);
