import { Input } from 'antd';
import * as React from 'react';

function TestFieldComponent(props: {
  value?: string;
  onChange?: (v: string) => void;
}) {
  const { value: controlledValue } = props;
  const [value, setValue] = React.useState<string>(controlledValue || '');
  React.useEffect(() => {
    if (typeof controlledValue === 'string') setValue(controlledValue);
  }, [controlledValue]);

  return (
    <Input
      onChange={(e) => {
        setValue(e.target.value);
        props.onChange?.(e.target.value);
      }}
      value={value}
    />
  );
}

export default TestFieldComponent;
