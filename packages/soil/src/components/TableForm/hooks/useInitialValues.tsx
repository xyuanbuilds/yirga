import * as React from 'react';
import { getValidator } from '../Item/validator';

import type { Form } from '../../Form/types/Form';

function useInitialValues(initialValues: any, columns, form: Form) {
  React.useEffect(() => {
    if (Array.isArray(initialValues) && !form.modified)
      initialValues.forEach((data, line) => {
        const parent = ['array', line];

        const tmpIndexMap: { [key: string]: number } = {};
        Object.keys(data).forEach((dataIndex) => {
          const columnIndex =
            tmpIndexMap[dataIndex] ||
            columns.findIndex((i) => i.dataIndex === dataIndex);
          tmpIndexMap[dataIndex] = columnIndex;
          const { rules, linkages, linkageReaction, deduplicate } = columns[
            columnIndex
          ];

          form.createField({
            name: dataIndex,
            basePath: parent,
            validator: rules ? getValidator(rules) : undefined,
            linkages,
            linkageReaction,
            deduplicate,
          });
        });
      });
  }, [form, initialValues, columns]);
}

const getInitialValue = (initialValues) => {
  if (Array.isArray(initialValues)) {
    return {
      array: initialValues,
    };
  }
  return {};
};

export default Object.assign(useInitialValues, { getInitialValue });
