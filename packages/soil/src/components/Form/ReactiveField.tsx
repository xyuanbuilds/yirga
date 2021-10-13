import React from 'react';
import { observer } from '@formily/reactive-react';
import type { GeneralField } from './types/Field';
import type { Form } from './types/Form';

type C<
  P = {
    value?: any;
    onChange: (e: Event) => void;
  }
> = React.FunctionComponent<P> | React.ComponentClass<P> | string;
interface ReactiveFieldProps {
  field: GeneralField;
  onlyObservable?: boolean;
  children?:
    | ((field: GeneralField, form: Form) => React.ReactChild)
    | React.ReactNode;
  component?: [C, Record<string, any>?];
}

const ReactiveInternal: React.FC<ReactiveFieldProps> = (props) => {
  const { field, children, component, onlyObservable } = props;

  if (!component && !onlyObservable) return null;
  if (onlyObservable || !field) {
    return <div>{children}</div>;
  }

  // if (field.display !== 'visible') return null;
  const renderComponent = () => {
    // const value = !isVoidField(field) ? field.value : undefined;

    const onChange = (event) => {
      field.onInput(event);
    };

    // const disabled = !isVoidField(field)
    //   ? field.pattern === 'disabled' || field.pattern === 'readPretty'
    //   : undefined;
    // const readOnly = !isVoidField(field)
    //   ? field.pattern === 'readOnly'
    //   : undefined;

    console.log(component![1]);

    return React.createElement(
      component![0],
      {
        value: field.value,
        onChange,
        ...component![1],
      },
      children,
    );
  };

  return renderComponent();
};

ReactiveInternal.displayName = 'ReactiveInternal';

const ReactiveField = observer(ReactiveInternal, {
  displayName: 'ReactiveField',
});

export default ReactiveField;
