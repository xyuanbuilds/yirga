/* eslint-disable no-param-reassign */
import * as React from 'react';
import FormContext from './context/Form';
import createForm from './models/Form';

import type { Form } from './types/Form';

export type FieldPath = Array<string | number | FieldPath>;
// 0: ['a', 'b']: value

// * path/address 为数组
// * path.toString 为唯一标识

//! Form 组件, 内部提供 context 即可
// * 每个单独的组件只有一个 Form 组件
function FormInstance({ form, children }) {
  const { current: formInstance } = React.useRef<Form>(form || createForm());

  React.useEffect(() => {
    return () => {
      formInstance.unmount();
    };
  });

  return (
    <FormContext.Provider value={formInstance}>{children}</FormContext.Provider>
  );
}

export default React.memo(FormInstance);
