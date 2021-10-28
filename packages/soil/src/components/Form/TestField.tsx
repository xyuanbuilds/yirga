import { Input } from 'antd';
import * as React from 'react';

function TestFieldComponent(props: {
  value?: string;
  onChange?: (v: { target: { value: any } }) => void;
}) {
  const { value: controlledValue } = props;

  const [value, setValue] = React.useState<string>(controlledValue || '');

  React.useEffect(() => {
    setValue(controlledValue!);
  }, [controlledValue]);

  return (
    <Input
      onChange={(e) => {
        props.onChange?.(e);
      }}
      value={value}
    />
  );
}

export default React.memo(TestFieldComponent);
