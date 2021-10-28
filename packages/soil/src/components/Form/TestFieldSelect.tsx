import { Select } from 'antd';
import * as React from 'react';

function TestFieldComponent(props: {
  value?: string;
  onChange?: (v: { target: { value: any } }) => void;
  options?: {
    label: string;
    value: string;
  }[];
}) {
  const { value: controlledValue, options } = props;

  const [value, setValue] = React.useState<string>(controlledValue || '');

  React.useEffect(() => {
    setValue(controlledValue!);
  }, [controlledValue]);

  return (
    <Select
      style={{ width: '100%' }}
      onChange={(e) => {
        props.onChange?.({
          target: { value: e },
        });
      }}
      options={options}
      value={value}
    />
  );
}

export default React.memo(TestFieldComponent);
