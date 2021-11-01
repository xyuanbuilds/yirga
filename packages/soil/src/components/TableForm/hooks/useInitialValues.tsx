import * as React from 'react';
import { getValidator } from '../Item/validator';

import type { Form } from '../../Form/types/Form';

function useInitialValues(initialValues: any, columns, form: Form) {
  React.useEffect(() => {
    if (Array.isArray(initialValues))
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
          const initialValue = data[dataIndex];

          form.createField({
            name: dataIndex,
            basePath: parent,
            initialValue,
            validator: rules ? getValidator(rules) : undefined,
            linkages,
            linkageReaction,
            deduplicate,
          });
        });
      });
  }, [form, initialValues, columns]);
}

const getInitialValue = (initialValues) => ({
  array: initialValues,
});

export default Object.assign(useInitialValues, { getInitialValue });
