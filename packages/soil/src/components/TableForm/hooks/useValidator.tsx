import * as React from 'react';
import type { Rule } from 'rc-field-form/lib/interface.d';
import { getValidator } from '../Item/validator';
import type { Form } from '../../Form/types/Form';
import type { ColumnType } from '../type';

export default function useValidator(
  columns: ColumnType<any>[] | undefined,
  form: Form,
) {
  const { current: rulesPrevMap } = React.useRef<{
    [dataIndex: string]: Rule[];
  }>({});

  React.useEffect(() => {
    columns?.forEach(({ dataIndex, rules }) => {
      const prevRules = rulesPrevMap[dataIndex];

      if (Array.isArray(rules) && prevRules !== rules) {
        rulesPrevMap[dataIndex] = rules;
        form.setValidator(
          new RegExp(`array,[\\d]+,${dataIndex}`),
          getValidator(rules),
        );
      }
    });
  }, [form, columns]); // eslint-disable-line react-hooks/exhaustive-deps
}
